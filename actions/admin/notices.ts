"use server"

// ============================================================================
// CAMPUSTRACK - ADMIN NOTICES SERVER ACTIONS
// ============================================================================
// ADMIN can create/edit/delete global notices

import { prisma } from "@/lib/db"
import { requireRole, getSession } from "@/lib/auth"
import { createNoticeSchema, updateNoticeSchema, uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Notice } from "@prisma/client"

/**
 * Create a new global notice
 * ADMIN only
 */
export async function createNotice(
    input: {
        title: string;
        content: string;
        isImportant?: boolean;
        expiresAt?: string;
        imageUrl?: string;
        departmentId?: string;
        colorIndex?: number;
        type?: "ACADEMIC" | "EVENT" | "EXAM" | "GENERAL";
    }
): Promise<ActionResult<Notice>> {
    try {
        // 1. Validate session and role (ADMIN or FACULTY can create notices)
        const session = await getSession()
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "FACULTY")) {
            return errorResponse("Unauthorized: Admin or Faculty access required", "UNAUTHORIZED")
        }
        const user = session.user

        // 2. Validate input
        const validated = createNoticeSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        // 3. Create notice
        const notice = await prisma.notice.create({
            data: {
                title: validated.data.title,
                content: validated.data.content,
                isImportant: validated.data.isImportant ?? false,
                expiresAt: validated.data.expiresAt ? new Date(validated.data.expiresAt) : null,
                authorId: user.id,
                imageUrl: input.imageUrl || null,
                departmentId: input.departmentId || null,
                colorIndex: input.colorIndex ?? 0,
                type: input.type || "GENERAL",
            },
        })

        // 4. Create notifications for active users
        let whereUserClause: any = { isActive: true, deletedAt: null }

        if (input.departmentId) {
            // Find students and faculty in this department
            // This is complex because StudentProfile and FacultyProfile link to department
            // We need to find filtered profiles first, then get userIds
            const studentUserIds = await prisma.studentProfile.findMany({
                where: { departmentId: input.departmentId },
                select: { userId: true }
            })

            const facultyUserIds = await prisma.facultyProfile.findMany({
                where: { departmentId: input.departmentId },
                select: { userId: true }
            })

            const targetUserIds = [
                ...studentUserIds.map(s => s.userId),
                ...facultyUserIds.map(f => f.userId)
            ]

            whereUserClause.id = { in: targetUserIds }
        }

        const users = await prisma.user.findMany({
            where: whereUserClause,
            select: { id: true, role: true },
        })

        if (users.length > 0) {
            await prisma.notification.createMany({
                data: users.map((u) => {
                    let link = "/dashboard/student/notices"
                    if (u.role === "FACULTY") link = "/dashboard/faculty/notices"
                    if (u.role === "ADMIN") link = "/dashboard/admin/notices"

                    return {
                        userId: u.id,
                        type: "NOTICE" as const,
                        title: validated.data.title, // Use title as title
                        message: validated.data.content.substring(0, 100) + (validated.data.content.length > 100 ? "..." : ""), // Use content snippet as message
                        link: link,
                    }
                }),
            })
        }

        return successResponse(notice, "Notice created successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to create notice")
    }
}

/**
 * Update an existing notice
 * ADMIN only
 */
export async function updateNotice(
    input: { id: string; title?: string; content?: string; isImportant?: boolean; expiresAt?: string | null }
): Promise<ActionResult<Notice>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = updateNoticeSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        // 3. Check notice exists
        const existing = await prisma.notice.findUnique({
            where: { id: validated.data.id },
        })

        if (!existing) {
            return errorResponse("Notice not found", "NOT_FOUND")
        }

        // 4. Update notice
        const notice = await prisma.notice.update({
            where: { id: validated.data.id },
            data: {
                title: validated.data.title,
                content: validated.data.content,
                isImportant: validated.data.isImportant,
                expiresAt: validated.data.expiresAt !== undefined
                    ? (validated.data.expiresAt ? new Date(validated.data.expiresAt) : null)
                    : undefined,
            },
        })

        return successResponse(notice, "Notice updated successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to update notice")
    }
}

/**
 * Delete a notice
 * ADMIN can delete any notice, FACULTY can delete only their own notices
 */
export async function deleteNotice(id: string): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Validate session and role
        const session = await getSession()
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "FACULTY")) {
            return errorResponse("Unauthorized: Admin or Faculty access required", "UNAUTHORIZED")
        }
        const user = session.user

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid notice ID")
        }

        // 3. Check notice exists
        const existing = await prisma.notice.findUnique({
            where: { id: validated.data },
        })

        if (!existing) {
            return errorResponse("Notice not found", "NOT_FOUND")
        }

        // 4. Check ownership for Faculty (Admin can delete any)
        if (user.role === "FACULTY" && existing.authorId !== user.id) {
            return errorResponse("You can only delete your own notices", "FORBIDDEN")
        }

        // 5. Delete notice
        await prisma.notice.delete({
            where: { id: validated.data },
        })

        return successResponse({ id: validated.data }, "Notice deleted successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to delete notice")
    }
}

/**
 * Get all notices (admin view)
 * ADMIN only
 */
export async function getAdminNotices(): Promise<ActionResult<Notice[]>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Fetch all notices
        const notices = await prisma.notice.findMany({
            orderBy: { publishedAt: "desc" },
            include: {
                author: {
                    select: { id: true, name: true, email: true },
                },
                department: {
                    select: { id: true, name: true, code: true },
                },
            },
        })

        return successResponse(notices)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch notices")
    }
}
