"use server"

// ============================================================================
// CAMPUSTRACK - STUDENT NOTIFICATIONS SERVER ACTIONS
// ============================================================================
// Students can view and manage their notifications

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Notification } from "@prisma/client"

/**
 * Get student's notifications
 * STUDENT only - returns latest notifications (unread first)
 */
export async function getNotifications(
    options?: { limit?: number; unreadOnly?: boolean }
): Promise<ActionResult<Notification[]>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("STUDENT")

        // 2. Build query
        const where: Record<string, unknown> = {
            userId: user.id,
        }

        if (options?.unreadOnly) {
            where.isRead = false
        }

        // 3. Fetch notifications
        const notifications = await prisma.notification.findMany({
            where,
            orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
            take: options?.limit || 50,
        })

        return successResponse(notifications)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch notifications")
    }
}

/**
 * Get unread notification count
 * STUDENT only
 */
export async function getUnreadCount(): Promise<ActionResult<{ count: number }>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("STUDENT")

        // 2. Count unread notifications
        const count = await prisma.notification.count({
            where: {
                userId: user.id,
                isRead: false,
            },
        })

        return successResponse({ count })
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to get unread count")
    }
}

/**
 * Mark a notification as read
 * STUDENT only - can only mark own notifications
 */
export async function markNotificationRead(
    notificationId: string
): Promise<ActionResult<Notification>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("STUDENT")

        // 2. Validate input
        const validated = uuidSchema.safeParse(notificationId)
        if (!validated.success) {
            return errorResponse("Invalid notification ID")
        }

        // 3. Check notification belongs to user
        const notification = await prisma.notification.findUnique({
            where: { id: validated.data },
        })

        if (!notification) {
            return errorResponse("Notification not found", "NOT_FOUND")
        }

        if (notification.userId !== user.id) {
            return errorResponse("Not your notification", "UNAUTHORIZED")
        }

        // 4. Mark as read
        const updated = await prisma.notification.update({
            where: { id: validated.data },
            data: { isRead: true },
        })

        return successResponse(updated)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to mark notification as read")
    }
}

/**
 * Mark all notifications as read
 * STUDENT only
 */
export async function markAllNotificationsRead(): Promise<ActionResult<{ count: number }>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("STUDENT")

        // 2. Update all unread notifications
        const result = await prisma.notification.updateMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            data: { isRead: true },
        })

        return successResponse({ count: result.count }, `${result.count} notifications marked as read`)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to mark notifications as read")
    }
}

/**
 * Delete old read notifications (cleanup)
 * STUDENT only - deletes read notifications older than 30 days
 */
export async function cleanupOldNotifications(): Promise<ActionResult<{ count: number }>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("STUDENT")

        // 2. Calculate cutoff date (30 days ago)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)

        // 3. Delete old read notifications
        const result = await prisma.notification.deleteMany({
            where: {
                userId: user.id,
                isRead: true,
                createdAt: { lt: cutoff },
            },
        })

        return successResponse({ count: result.count }, `${result.count} old notifications cleaned up`)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to cleanup notifications")
    }
}
