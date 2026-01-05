"use server"

// ============================================================================
// CAMPUSTRACK - STUDENT TIMETABLE SERVER ACTIONS
// ============================================================================
// Students can view their class schedule

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

interface TimetableEntry {
    id: string
    dayOfWeek: number
    period: number
    room: string | null
    subject: {
        id: string
        code: string
        name: string
        type: string
    }
    faculty: {
        user: {
            name: string
        }
    }
}

/**
 * Get student's full week timetable
 * STUDENT only - based on their semester
 */
export async function getStudentTimetable(): Promise<ActionResult<TimetableEntry[]>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("STUDENT")

        // 2. Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
        })

        if (!studentProfile) {
            return errorResponse("Student profile not found", "NOT_FOUND")
        }

        // 3. Fetch timetable for student's semester and department
        const timetable = await prisma.timetable.findMany({
            where: {
                semesterId: studentProfile.semesterId,
                departmentId: studentProfile.departmentId,
            },
            include: {
                subject: {
                    select: { id: true, code: true, name: true, type: true },
                },
                faculty: {
                    include: {
                        user: { select: { name: true } },
                    },
                },
            },
            orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
        })

        return successResponse(timetable as unknown as TimetableEntry[])
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch timetable")
    }
}

/**
 * Get today's schedule for student
 * STUDENT only
 */
export async function getTodaySchedule(): Promise<ActionResult<TimetableEntry[]>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("STUDENT")

        // 2. Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
        })

        if (!studentProfile) {
            return errorResponse("Student profile not found", "NOT_FOUND")
        }

        // 3. Get today's day of week
        const today = new Date()
        const dayOfWeek = today.getDay() // 0=Sunday

        // No classes on Sunday
        if (dayOfWeek === 0) {
            return successResponse([])
        }

        // 4. Fetch today's classes
        const timetable = await prisma.timetable.findMany({
            where: {
                semesterId: studentProfile.semesterId,
                departmentId: studentProfile.departmentId,
                dayOfWeek: dayOfWeek,
            },
            include: {
                subject: {
                    select: { id: true, code: true, name: true, type: true },
                },
                faculty: {
                    include: {
                        user: { select: { name: true } },
                    },
                },
            },
            orderBy: { period: "asc" },
        })

        return successResponse(timetable as unknown as TimetableEntry[])
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch today's schedule")
    }
}

/**
 * Get student's enrolled subjects
 * STUDENT only
 */
export async function getEnrolledSubjects(): Promise<ActionResult<unknown[]>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("STUDENT")

        // 2. Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
        })

        if (!studentProfile) {
            return errorResponse("Student profile not found", "NOT_FOUND")
        }

        // 3. Get subjects for student's semester and department
        const subjects = await prisma.subject.findMany({
            where: {
                semesterId: studentProfile.semesterId,
                departmentId: studentProfile.departmentId,
            },
            include: {
                facultyAssigned: {
                    include: {
                        faculty: {
                            include: {
                                user: { select: { name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { code: "asc" },
        })

        // Transform to include faculty names
        const result = subjects.map((subject) => ({
            id: subject.id,
            code: subject.code,
            name: subject.name,
            credits: subject.credits,
            type: subject.type,
            faculty: subject.facultyAssigned.map((fa) => ({
                id: fa.faculty.id,
                name: fa.faculty.user.name,
            })),
        }))

        return successResponse(result)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch subjects")
    }
}
