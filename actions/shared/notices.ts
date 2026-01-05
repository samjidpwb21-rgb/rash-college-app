"use server"

// ============================================================================
// CAMPUSTRACK - SHARED NOTICES SERVER ACTIONS
// ============================================================================
// Read access for all authenticated users

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Notice } from "@prisma/client"

/**
 * Get all active notices (public view)
 * All authenticated users can view
 */
export async function getNotices(): Promise<ActionResult<Notice[]>> {
    try {
        // 1. Validate session (any role)
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }

        // 2. Fetch active notices (not expired)
        const now = new Date()

        const notices = await prisma.notice.findMany({
            where: {
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } },
                ],
            },
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
            orderBy: [
                { isImportant: "desc" },
                { publishedAt: "desc" },
            ],
        })

        return successResponse(notices)
    } catch (error) {
        return errorResponse("Failed to fetch notices")
    }
}

/**
 * Get a single notice by ID
 * All authenticated users can view
 */
export async function getNotice(id: string): Promise<ActionResult<Notice>> {
    try {
        // 1. Validate session
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid notice ID")
        }

        // 3. Fetch notice
        const notice = await prisma.notice.findUnique({
            where: { id: validated.data },
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
        })

        if (!notice) {
            return errorResponse("Notice not found", "NOT_FOUND")
        }

        return successResponse(notice)
    } catch (error) {
        return errorResponse("Failed to fetch notice")
    }
}

/**
 * Get important notices only
 * All authenticated users can view
 */
export async function getImportantNotices(): Promise<ActionResult<Notice[]>> {
    try {
        // 1. Validate session
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }

        // 2. Fetch important notices
        const now = new Date()

        const notices = await prisma.notice.findMany({
            where: {
                isImportant: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } },
                ],
            },
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { publishedAt: "desc" },
        })

        return successResponse(notices)
    } catch (error) {
        return errorResponse("Failed to fetch notices")
    }
}

/**
 * Get recent notices (last 7 days)
 * All authenticated users can view
 */
export async function getRecentNotices(
    limit: number = 5
): Promise<ActionResult<Notice[]>> {
    try {
        // 1. Validate session
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }

        // 2. Calculate 7 days ago
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        // 3. Fetch recent notices
        const notices = await prisma.notice.findMany({
            where: {
                publishedAt: { gte: weekAgo },
            },
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { publishedAt: "desc" },
            take: limit,
        })

        return successResponse(notices)
    } catch (error) {
        return errorResponse("Failed to fetch notices")
    }
}
