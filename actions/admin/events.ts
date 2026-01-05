"use server"

// ============================================================================
// CAMPUSTRACK - ADMIN EVENTS SERVER ACTIONS
// ============================================================================
// ADMIN can create/edit/delete global events

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { createEventSchema, updateEventSchema, uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Event } from "@prisma/client"

/**
 * Create a new global event
 * ADMIN only
 */
export async function createEvent(
    input: {
        title: string
        description?: string
        eventDate: string
        eventTime?: string
        endTime?: string
        location?: string
        isAllDay?: boolean
    }
): Promise<ActionResult<Event>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("ADMIN")

        // 2. Validate input
        const validated = createEventSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        // 3. Create event
        const event = await prisma.event.create({
            data: {
                title: validated.data.title,
                description: validated.data.description,
                eventDate: new Date(validated.data.eventDate),
                eventTime: validated.data.eventTime ? new Date(`1970-01-01T${validated.data.eventTime}`) : null,
                endTime: validated.data.endTime ? new Date(`1970-01-01T${validated.data.endTime}`) : null,
                location: validated.data.location,
                isAllDay: validated.data.isAllDay ?? false,
                authorId: user.id,
            },
        })

        // 4. Create notifications for all active users
        const users = await prisma.user.findMany({
            where: { isActive: true, deletedAt: null },
            select: { id: true },
        })

        if (users.length > 0) {
            await prisma.notification.createMany({
                data: users.map((u) => ({
                    userId: u.id,
                    type: "EVENT" as const,
                    title: "New Event",
                    message: `${validated.data.title} on ${new Date(validated.data.eventDate).toLocaleDateString()}`,
                    link: "/dashboard/student/events",
                })),
            })
        }

        return successResponse(event, "Event created successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to create event")
    }
}

/**
 * Update an existing event
 * ADMIN only
 */
export async function updateEvent(
    input: {
        id: string
        title?: string
        description?: string
        eventDate?: string
        eventTime?: string | null
        endTime?: string | null
        location?: string
        isAllDay?: boolean
    }
): Promise<ActionResult<Event>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = updateEventSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        // 3. Check event exists
        const existing = await prisma.event.findUnique({
            where: { id: validated.data.id },
        })

        if (!existing) {
            return errorResponse("Event not found", "NOT_FOUND")
        }

        // 4. Update event
        const event = await prisma.event.update({
            where: { id: validated.data.id },
            data: {
                title: validated.data.title,
                description: validated.data.description,
                eventDate: validated.data.eventDate ? new Date(validated.data.eventDate) : undefined,
                eventTime: validated.data.eventTime !== undefined
                    ? (validated.data.eventTime ? new Date(`1970-01-01T${validated.data.eventTime}`) : null)
                    : undefined,
                endTime: validated.data.endTime !== undefined
                    ? (validated.data.endTime ? new Date(`1970-01-01T${validated.data.endTime}`) : null)
                    : undefined,
                location: validated.data.location,
                isAllDay: validated.data.isAllDay,
            },
        })

        return successResponse(event, "Event updated successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to update event")
    }
}

/**
 * Delete an event
 * ADMIN only
 */
export async function deleteEvent(id: string): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid event ID")
        }

        // 3. Check event exists
        const existing = await prisma.event.findUnique({
            where: { id: validated.data },
        })

        if (!existing) {
            return errorResponse("Event not found", "NOT_FOUND")
        }

        // 4. Delete event
        await prisma.event.delete({
            where: { id: validated.data },
        })

        return successResponse({ id: validated.data }, "Event deleted successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to delete event")
    }
}

/**
 * Get all events (admin view)
 * ADMIN only
 */
export async function getAdminEvents(): Promise<ActionResult<Event[]>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Fetch all events
        const events = await prisma.event.findMany({
            orderBy: { eventDate: "desc" },
            include: {
                author: {
                    select: { id: true, name: true, email: true },
                },
            },
        })

        return successResponse(events)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch events")
    }
}
