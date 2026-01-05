"use server"

// ============================================================================
// CAMPUSTRACK - IMAGE UPLOAD UTILITY
// Admin+Faculty file upload with validation
// ============================================================================

import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { existsSync, mkdirSync } from "fs"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

const NOTICES_UPLOAD_DIR = join(process.cwd(), "public", "uploads", "notices")
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// Ensure upload directory exists
if (!existsSync(NOTICES_UPLOAD_DIR)) {
    mkdirSync(NOTICES_UPLOAD_DIR, { recursive: true })
}

/**
 * Upload notice image
 * Admin & Faculty access
 */
export async function uploadNoticeImage(formData: FormData): Promise<ActionResult<{ fileUrl: string }>> {
    try {
        // 1. Validate session (Admin or Faculty)
        const session = await getSession()
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "FACULTY")) {
            return errorResponse("Unauthorized: Admin or Faculty access required", "UNAUTHORIZED")
        }

        // 2. Get file from form data
        const file = formData.get("file") as File | null
        if (!file) {
            return errorResponse("No file provided")
        }

        // 3. Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return errorResponse("Invalid file type. Only JPG, PNG, and WebP images are allowed.")
        }

        // 4. Validate file size
        if (file.size > MAX_IMAGE_SIZE) {
            return errorResponse(`File size exceeds maximum limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`)
        }

        // 5. Generate unique filename
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 10)
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `notice_${timestamp}_${random}.${extension}`
        const filePath = join(NOTICES_UPLOAD_DIR, fileName)
        const fileUrl = `/uploads/notices/${fileName}`

        // 6. Save file to disk
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        return successResponse({ fileUrl }, "Image uploaded successfully")
    } catch (error) {
        console.error("Upload notice image error:", error)
        return errorResponse("Failed to upload image")
    }
}

/**
 * Delete notice image
 * Admin & Faculty access
 */
export async function deleteNoticeImage(imageUrl: string): Promise<ActionResult<{ deleted: boolean }>> {
    try {
        // 1. Validate session (Admin or Faculty)
        const session = await getSession()
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "FACULTY")) {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        // 2. Construct file path
        const filePath = join(process.cwd(), "public", imageUrl)

        // 3. Delete file if exists
        if (existsSync(filePath)) {
            await unlink(filePath)
            return successResponse({ deleted: true }, "Image deleted successfully")
        }

        return successResponse({ deleted: false }, "Image not found")
    } catch (error) {
        console.error("Delete notice image error:", error)
        return errorResponse("Failed to delete image")
    }
}
