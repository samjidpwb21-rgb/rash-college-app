"use server"

// ============================================================================
// CAMPUSTRACK - NOTICE AND EVENT PAGE QUERIES
// ============================================================================

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

// ============================================================================
// NOTICES PAGE DATA
// ============================================================================

export interface NoticeData {
    id: string
    title: string
    description: string
    type: string // "ACADEMIC" | "EVENT" | "EXAM" | "GENERAL"
    postedBy: string
    date: Date
    isImportant: boolean
    department?: { id: string; name: string; code: string } | null
    imageUrl?: string | null
}

/**
 * Get all notices for display
 */
export async function getNoticesPageData(): Promise<ActionResult<NoticeData[]>> {
    try {
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const notices = await prisma.notice.findMany({
            orderBy: [{ isImportant: "desc" }, { publishedAt: "desc" }],
            include: {
                author: { select: { name: true } },
                department: { select: { id: true, name: true, code: true } },
            },
        })

        return successResponse(
            notices.map((n) => ({
                id: n.id,
                title: n.title,
                description: n.content,
                type: n.type,
                postedBy: n.author.name,
                date: n.publishedAt,
                isImportant: n.isImportant,
                department: n.department,
                imageUrl: n.imageUrl,
            }))
        )
    } catch (error) {
        console.error("Notices page error:", error)
        return errorResponse("Failed to load notices")
    }
}

// ============================================================================
// EVENTS PAGE DATA
// ============================================================================

export interface EventData {
    id: string
    title: string
    description: string
    date: Date
    time?: string
    location: string | null
    isAllDay: boolean
    type: string
    thumbnailUrl?: string
}

/**
 * Get all events for display
 */
export async function getEventsPageData(): Promise<ActionResult<EventData[]>> {
    try {
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const events = await prisma.event.findMany({
            orderBy: { eventDate: "asc" },
            include: {
                author: { select: { name: true } },
            },
        })

        return successResponse(
            events.map((e) => ({
                id: e.id,
                title: e.title,
                description: e.description || "",
                date: e.eventDate,
                time: e.eventTime?.toISOString().split("T")[1]?.substring(0, 5),
                location: e.location,
                isAllDay: e.isAllDay,
                type: "event",
                thumbnailUrl: undefined, // Could add to schema if needed
            }))
        )
    } catch (error) {
        console.error("Events page error:", error)
        return errorResponse("Failed to load events")
    }
}

/**
 * Get events for a specific month (calendar view)
 */
export async function getEventsForMonth(
    year: number,
    month: number
): Promise<ActionResult<EventData[]>> {
    try {
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0)

        const events = await prisma.event.findMany({
            where: {
                eventDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { eventDate: "asc" },
        })

        return successResponse(
            events.map((e) => ({
                id: e.id,
                title: e.title,
                description: e.description || "",
                date: e.eventDate,
                time: e.eventTime?.toISOString().split("T")[1]?.substring(0, 5),
                location: e.location,
                isAllDay: e.isAllDay,
                type: "event",
            }))
        )
    } catch (error) {
        console.error("Events for month error:", error)
        return errorResponse("Failed to load events")
    }
}
