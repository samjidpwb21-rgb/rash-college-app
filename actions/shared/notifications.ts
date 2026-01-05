"use server"

// ============================================================================
// CAMPUSTRACK - SHARED NOTIFICATIONS SERVER ACTIONS
// ============================================================================
// Notification access for all authenticated users

import { prisma } from "@/lib/db"
import { getSession, getCurrentUser } from "@/lib/auth"
import { uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Notification } from "@prisma/client"

/**
 * Get current user's notifications
 * All authenticated users
 */
export async function getMyNotifications(
    options?: { limit?: number; unreadOnly?: boolean }
): Promise<ActionResult<Notification[]>> {
    try {
        // 1. Get current user
        const user = await getCurrentUser()

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
        if (error instanceof Error && error.message.includes("Not authenticated")) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch notifications")
    }
}

/**
 * Get unread notification count
 * All authenticated users
 */
export async function getMyUnreadCount(): Promise<ActionResult<{ count: number }>> {
    try {
        // 1. Get current user
        const user = await getCurrentUser()

        // 2. Count unread notifications
        const count = await prisma.notification.count({
            where: {
                userId: user.id,
                isRead: false,
            },
        })

        return successResponse({ count })
    } catch (error) {
        if (error instanceof Error && error.message.includes("Not authenticated")) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }
        return errorResponse("Failed to get unread count")
    }
}

/**
 * Mark a notification as read
 * All authenticated users - own notifications only
 */
export async function markAsRead(
    notificationId: string
): Promise<ActionResult<Notification>> {
    try {
        // 1. Get current user
        const user = await getCurrentUser()

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
        if (error instanceof Error && error.message.includes("Not authenticated")) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }
        return errorResponse("Failed to mark notification as read")
    }
}

/**
 * Mark all notifications as read
 * All authenticated users
 */
export async function markAllAsRead(): Promise<ActionResult<{ count: number }>> {
    try {
        // 1. Get current user
        const user = await getCurrentUser()

        // 2. Update all unread notifications
        const result = await prisma.notification.updateMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            data: { isRead: true },
        })

        return successResponse({ count: result.count })
    } catch (error) {
        if (error instanceof Error && error.message.includes("Not authenticated")) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }
        return errorResponse("Failed to mark all as read")
    }
}

/**
 * Delete a notification
 * All authenticated users - own notifications only
 */
export async function deleteNotification(
    notificationId: string
): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Get current user
        const user = await getCurrentUser()

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

        // 4. Delete notification
        await prisma.notification.delete({
            where: { id: validated.data },
        })

        return successResponse({ id: validated.data })
    } catch (error) {
        if (error instanceof Error && error.message.includes("Not authenticated")) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }
        return errorResponse("Failed to delete notification")
    }
}

/**
 * Create a notification (internal use)
 * Used by other server actions to create notifications
 */
export async function createNotification(input: {
    userId: string
    type: "ATTENDANCE" | "NOTICE" | "EVENT" | "SYSTEM"
    title: string
    message: string
    link?: string
}): Promise<ActionResult<Notification>> {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: input.userId,
                type: input.type,
                title: input.title,
                message: input.message,
                link: input.link,
            },
        })

        return successResponse(notification)
    } catch (error) {
        return errorResponse("Failed to create notification")
    }
}

/**
 * Create notifications for multiple users (internal use)
 * Used when creating notices/events to notify all users
 */
export async function createBulkNotifications(input: {
    userIds: string[]
    type: "ATTENDANCE" | "NOTICE" | "EVENT" | "SYSTEM"
    title: string
    message: string
    link?: string
}): Promise<ActionResult<{ count: number }>> {
    try {
        const result = await prisma.notification.createMany({
            data: input.userIds.map((userId) => ({
                userId,
                type: input.type,
                title: input.title,
                message: input.message,
                link: input.link,
            })),
        })

        return successResponse({ count: result.count })
    } catch (error) {
        return errorResponse("Failed to create notifications")
    }
}
