"use server"

// ============================================================================
// CAMPUSTRACK - SHARED EVENTS SERVER ACTIONS
// ============================================================================
// Read access for all authenticated users

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Event } from "@prisma/client"

/**
 * Get all upcoming events
 * All authenticated users can view
 */
export async function getEvents(): Promise<ActionResult<Event[]>> {
    try {
        // 1. Validate session (any role)
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }

        // 2. Fetch all events (past and future for calendar)
        const events = await prisma.event.findMany({
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { eventDate: "asc" },
        })

        return successResponse(events)
    } catch (error) {
        return errorResponse("Failed to fetch events")
    }
}

/**
 * Get upcoming events only
 * All authenticated users can view
 */
export async function getUpcomingEvents(
    limit: number = 10
): Promise<ActionResult<Event[]>> {
    try {
        // 1. Validate session
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }

        // 2. Get today's date
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // 3. Fetch upcoming events
        const events = await prisma.event.findMany({
            where: {
                eventDate: { gte: today },
            },
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { eventDate: "asc" },
            take: limit,
        })

        return successResponse(events)
    } catch (error) {
        return errorResponse("Failed to fetch events")
    }
}

/**
 * Get a single event by ID
 * All authenticated users can view
 */
export async function getEvent(id: string): Promise<ActionResult<Event>> {
    try {
        // 1. Validate session
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid event ID")
        }

        // 3. Fetch event
        const event = await prisma.event.findUnique({
            where: { id: validated.data },
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
        })

        if (!event) {
            return errorResponse("Event not found", "NOT_FOUND")
        }

        return successResponse(event)
    } catch (error) {
        return errorResponse("Failed to fetch event")
    }
}

/**
 * Get events for a specific month (calendar view)
 * All authenticated users can view
 */
export async function getEventsByMonth(
    year: number,
    month: number // 1-12
): Promise<ActionResult<Event[]>> {
    try {
        // 1. Validate session
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }

        // 2. Validate month
        if (month < 1 || month > 12) {
            return errorResponse("Invalid month")
        }

        // 3. Calculate date range
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)

        // 4. Fetch events for month
        const events = await prisma.event.findMany({
            where: {
                eventDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { eventDate: "asc" },
        })

        return successResponse(events)
    } catch (error) {
        return errorResponse("Failed to fetch events")
    }
}

/**
 * Get today's events
 * All authenticated users can view
 */
export async function getTodayEvents(): Promise<ActionResult<Event[]>> {
    try {
        // 1. Validate session
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }

        // 2. Get today's date range
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // 3. Fetch today's events
        const events = await prisma.event.findMany({
            where: {
                eventDate: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { eventTime: "asc" },
        })

        return successResponse(events)
    } catch (error) {
        return errorResponse("Failed to fetch events")
    }
}
