"use server"

// ============================================================================
// CAMPUSTRACK - FACULTY TIMETABLE SERVER ACTIONS
// ============================================================================
// Faculty can view their assigned schedule

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Timetable } from "@prisma/client"

/**
 * Get faculty's timetable
 * FACULTY only - derived from assigned subjects
 */
export async function getFacultyTimetable(
    dayOfWeek?: number
): Promise<ActionResult<Timetable[]>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("FACULTY")

        // 2. Get faculty profile
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        // 3. Build query
        const where: Record<string, unknown> = {
            facultyId: facultyProfile.id,
        }

        if (dayOfWeek !== undefined && dayOfWeek >= 1 && dayOfWeek <= 6) {
            where.dayOfWeek = dayOfWeek
        }

        // 4. Fetch timetable entries
        const timetable = await prisma.timetable.findMany({
            where,
            include: {
                subject: {
                    select: { id: true, code: true, name: true, type: true },
                },
                semester: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                        academicYear: { select: { year: true, name: true } },
                    },
                },
                department: {
                    select: { id: true, code: true, name: true },
                },
            },
            orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
        })

        return successResponse(timetable)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch timetable")
    }
}

/**
 * Get today's classes for faculty
 * FACULTY only
 */
export async function getTodayClasses(): Promise<ActionResult<Timetable[]>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("FACULTY")

        // 2. Get faculty profile
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        // 3. Get today's day of week (1=Monday, 6=Saturday)
        const today = new Date()
        const dayOfWeek = today.getDay() // 0=Sunday, 1=Monday, etc.

        // No classes on Sunday
        if (dayOfWeek === 0) {
            return successResponse([])
        }

        // 4. Fetch today's classes
        const timetable = await prisma.timetable.findMany({
            where: {
                facultyId: facultyProfile.id,
                dayOfWeek: dayOfWeek,
            },
            include: {
                subject: {
                    select: { id: true, code: true, name: true, type: true },
                },
                semester: {
                    select: {
                        number: true,
                        academicYear: { select: { year: true } },
                    },
                },
                department: {
                    select: { code: true, name: true },
                },
            },
            orderBy: { period: "asc" },
        })

        return successResponse(timetable)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch today's classes")
    }
}

/**
 * Get subjects for a specific date (for attendance marking)
 * FACULTY only - returns subjects scheduled for that date
 */
export async function getSubjectsForDate(
    date: string
): Promise<ActionResult<unknown[]>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("FACULTY")

        // 2. Get faculty profile
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        // 3. Parse date and get day of week
        const attendanceDate = new Date(date)
        if (isNaN(attendanceDate.getTime())) {
            return errorResponse("Invalid date")
        }

        const dayOfWeek = attendanceDate.getDay()

        // No classes on Sunday
        if (dayOfWeek === 0) {
            return successResponse([])
        }

        // 4. Get subjects assigned to faculty for this day
        const timetableEntries = await prisma.timetable.findMany({
            where: {
                facultyId: facultyProfile.id,
                dayOfWeek: dayOfWeek,
            },
            include: {
                subject: {
                    include: {
                        department: { select: { code: true, name: true } },
                    },
                },
                semester: {
                    include: { academicYear: true },
                },
            },
            orderBy: { period: "asc" },
        })

        // Group by subject (one subject may appear in multiple periods)
        const subjectMap = new Map()
        for (const entry of timetableEntries) {
            if (!subjectMap.has(entry.subjectId)) {
                subjectMap.set(entry.subjectId, {
                    ...entry.subject,
                    semester: entry.semester,
                    periods: [entry.period],
                    room: entry.room,
                })
            } else {
                subjectMap.get(entry.subjectId).periods.push(entry.period)
            }
        }

        return successResponse(Array.from(subjectMap.values()))
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch subjects")
    }
}
