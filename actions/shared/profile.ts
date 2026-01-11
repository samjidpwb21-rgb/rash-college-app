"use server"

// ============================================================================
// CAMPUSTRACK - PROFILE SERVER ACTIONS
// ============================================================================
// Manage user profiles and avatars

import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { z } from "zod"
// Note: Using base64 encoding for avatar storage (Vercel/Neon compatible)

// Profile update schema
const updateProfileSchema = z.object({
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    bloodGroup: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    libraryBarcode: z.string().optional().nullable(),
    guardianName: z.string().optional().nullable(), // Student only
    guardianPhone: z.string().optional().nullable(), // Student only
})

export type ProfileData = {
    // User data
    name: string
    email: string
    role: string
    avatar: string | null
    id: string

    // Profile data
    phone?: string | null
    address?: string | null
    bloodGroup?: string | null
    gender?: string | null
    libraryBarcode?: string | null

    // Student specific
    enrollmentNo?: string
    guardianName?: string | null
    guardianPhone?: string | null
    semester?: number
    departmentName?: string

    // Faculty specific
    employeeId?: string
    designation?: string
}

/**
 * Get current user's full profile
 */
export async function getMyProfile(): Promise<ActionResult<ProfileData>> {
    try {
        const user = await getCurrentUser()

        // Fetch fresh avatar explicitly because session no longer carries it to avoid cookie bloat
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { avatar: true }
        })

        const baseData = {
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: dbUser?.avatar ?? null,
            id: user.id
        }

        if (user.role === "STUDENT") {
            const profile = await prisma.studentProfile.findUnique({
                where: { userId: user.id },
                include: {
                    department: true,
                    semester: true
                }
            })

            if (!profile) return errorResponse("Profile not found", "NOT_FOUND")

            return successResponse({
                ...baseData,
                phone: profile.phone,
                address: profile.address,
                bloodGroup: profile.bloodGroup,
                gender: profile.gender,
                libraryBarcode: profile.libraryBarcode,
                enrollmentNo: profile.enrollmentNo,
                guardianName: profile.guardianName,
                guardianPhone: profile.guardianPhone,
                semester: profile.semester.number,
                departmentName: profile.department.name
            })
        }

        if (user.role === "FACULTY") {
            const profile = await prisma.facultyProfile.findUnique({
                where: { userId: user.id },
                include: { department: true }
            })

            if (!profile) return errorResponse("Profile not found", "NOT_FOUND")

            return successResponse({
                ...baseData,
                phone: profile.phone,
                address: profile.address,
                bloodGroup: profile.bloodGroup,
                gender: profile.gender,
                libraryBarcode: profile.libraryBarcode,
                employeeId: profile.employeeId,
                designation: profile.designation,
                departmentName: profile.department.name
            })
        }

        if (user.role === "ADMIN") {
            return successResponse(baseData)
        }

        return errorResponse("Invalid role")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Not authenticated")) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }
        console.error("Failed to fetch profile:", error)
        return errorResponse("Failed to load profile")
    }
}

/**
 * Update user profile fields
 */
export async function updateMyProfile(
    input: z.infer<typeof updateProfileSchema>
): Promise<ActionResult<void>> {
    try {
        const user = await getCurrentUser()
        const validated = updateProfileSchema.safeParse(input)

        if (!validated.success) return errorResponse("Invalid input")

        if (user.role === "STUDENT") {
            await prisma.studentProfile.update({
                where: { userId: user.id },
                data: validated.data
            })
        } else if (user.role === "FACULTY") {
            // Filter out student-only fields
            const { guardianName, guardianPhone, ...facultyData } = validated.data
            await prisma.facultyProfile.update({
                where: { userId: user.id },
                data: facultyData
            })
        }

        return successResponse(undefined)
    } catch (error) {
        console.error("Failed to update profile:", error)
        return errorResponse("Failed to update profile")
    }
}

/**
 * Upload profile picture (stores as base64 in database - Vercel/Neon compatible)
 */
export async function uploadProfilePicture(formData: FormData): Promise<ActionResult<{ url: string }>> {
    try {
        const user = await getCurrentUser()
        const file = formData.get("file") as File

        if (!file) {
            return errorResponse("No file provided")
        }

        // Validation
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Max 2MB for base64 storage (reasonable limit for database storage)
        if (buffer.length > 2 * 1024 * 1024) {
            return errorResponse("File size too large (max 2MB)")
        }

        // Support all common image formats
        const validTypes = [
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "image/bmp", "image/tiff", "image/svg+xml",
            "image/heic", "image/heif", "image/avif"
        ]
        if (!validTypes.includes(file.type)) {
            return errorResponse("Invalid file type. Supported: JPG, PNG, WebP, GIF, BMP, TIFF, SVG, HEIC, AVIF")
        }

        // Convert to base64 data URL
        const base64 = buffer.toString("base64")
        const dataUrl = `data:${file.type};base64,${base64}`

        // Update user record with base64 avatar
        await prisma.user.update({
            where: { id: user.id },
            data: { avatar: dataUrl }
        })

        return successResponse({ url: dataUrl })
    } catch (error) {
        console.error("Failed to upload avatar:", error)
        return errorResponse("Failed to upload image")
    }
}
