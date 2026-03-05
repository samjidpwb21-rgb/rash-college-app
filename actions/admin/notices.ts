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
            const firstError = validated.error.errors[0]
            console.error("Notice validation failed:", validated.error.errors)
            return errorResponse(firstError.message)
        }

        // 3. Create the notice — this MUST succeed before anything else
        const notice = await prisma.notice.create({
            data: {
                title: validated.data.title,
                content: validated.data.content,
                isImportant: validated.data.isImportant ?? false,
                expiresAt: validated.data.expiresAt ? new Date(validated.data.expiresAt) : null,
                authorId: user.id,
                imageUrl: input.imageUrl || null,
                // departmentId is optional — null means campus-wide notice
                departmentId: input.departmentId || null,
                colorIndex: input.colorIndex ?? 0,
                type: input.type || "GENERAL",
            },
        })

        // 4. Send notifications — isolated in its own try-catch so a failure
        //    here NEVER causes the notice creation to report as failed.
        try {
            let userFilter: any = { isActive: true, deletedAt: null }

            if (input.departmentId) {
                const [studentIds, facultyIds] = await Promise.all([
                    prisma.studentProfile.findMany({
                        where: { departmentId: input.departmentId },
                        select: { userId: true }
                    }),
                    prisma.facultyProfile.findMany({
                        where: { departmentId: input.departmentId },
                        select: { userId: true }
                    })
                ])
                const targetIds = [
                    ...studentIds.map(s => s.userId),
                    ...facultyIds.map(f => f.userId)
                ]
                if (targetIds.length === 0) {
                    // No users in this dept — skip notifications
                    return successResponse(notice, "Notice created successfully")
                }
                userFilter.id = { in: targetIds }
            }

            const targetUsers = await prisma.user.findMany({
                where: userFilter,
                select: { id: true, role: true },
                take: 500, // Guard against huge notification batches
            })

            if (targetUsers.length > 0) {
                const messageSnippet = validated.data.content.substring(0, 100) +
                    (validated.data.content.length > 100 ? "..." : "")

                await prisma.notification.createMany({
                    data: targetUsers.map((u) => ({
                        userId: u.id,
                        type: "NOTICE" as const,
                        title: validated.data.title,
                        message: messageSnippet,
                        link: u.role === "FACULTY"
                            ? "/dashboard/faculty/notices"
                            : u.role === "ADMIN"
                                ? "/dashboard/admin/notices"
                                : "/dashboard/student/notices",
                    })),
                    skipDuplicates: true,
                })
            }
        } catch (notifError) {
            // Notification failure is non-fatal — notice was already created.
            console.error("Notice notification dispatch failed (non-fatal):", notifError)
        }

        return successResponse(notice, "Notice created successfully")
    } catch (error) {
        console.error("createNotice error:", error)
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin or Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to create notice. Please try again.")
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
