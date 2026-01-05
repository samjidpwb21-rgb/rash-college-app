"use server"

// ============================================================================
// CAMPUSTRACK - FACULTY TIMETABLE SERVER ACTIONS
// Get unified timetable for faculty members
// ============================================================================

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { getBulkSubjectColors } from "@/lib/subject-color-assignment"

// ============================================================================
// GET FACULTY UNIFIED TIMETABLE
// Returns all periods assigned to a faculty member across all semesters
// ============================================================================

export async function getFacultyUnifiedTimetable(
    facultyId: string,
    departmentId: string
): Promise<ActionResult<any>> {
    try {
        // 1. Validate session and role
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }

        // 2. Validate faculty belongs to this department
        const faculty = await prisma.facultyProfile.findFirst({
            where: {
                id: facultyId,
                departmentId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        if (!faculty) {
            return errorResponse("Faculty not found in this department", "NOT_FOUND")
        }

        // 3. Get all timetable entries for this faculty
        const timetable = await prisma.timetable.findMany({
            where: {
                facultyId,
                departmentId,
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                semester: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
                academicYear: {
                    select: {
                        id: true,
                        year: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { dayOfWeek: "asc" },
                { period: "asc" },
            ],
        })

        // 4. Get persistent colors for all subjects
        const subjectIds = timetable.map(entry => entry.subject.id)
        const colorMap = await getBulkSubjectColors(subjectIds)

        // 5. Attach colors to timetable entries
        const timetableWithColors = timetable.map(entry => ({
            ...entry,
            subjectColor: colorMap.get(entry.subject.id) || "bg-gray-100 border-l-4 border-gray-400 text-gray-900",
        }))

        return successResponse({
            faculty,
            timetable: timetableWithColors,
        })
    } catch (error) {
        console.error("Get faculty timetable error:", error)
        return errorResponse("Failed to fetch faculty timetable")
    }
}

// ============================================================================
// GET FACULTY TIMETABLE STATS
// Returns summary statistics for a faculty member
// ============================================================================

export async function getFacultyTimetableStats(
    facultyId: string,
    departmentId: string
): Promise<ActionResult<any>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        // Count total periods
        const totalPeriods = await prisma.timetable.count({
            where: {
                facultyId,
                departmentId,
            },
        })

        // Count unique subjects
        const uniqueSubjects = await prisma.timetable.findMany({
            where: {
                facultyId,
                departmentId,
            },
            select: {
                subjectId: true,
            },
            distinct: ["subjectId"],
        })

        // Count semesters taught
        const semestersTaught = await prisma.timetable.findMany({
            where: {
                facultyId,
                departmentId,
            },
            select: {
                semesterId: true,
            },
            distinct: ["semesterId"],
        })

        return successResponse({
            totalPeriods,
            totalSubjects: uniqueSubjects.length,
            totalSemesters: semestersTaught.length,
        })
    } catch (error) {
        console.error("Get faculty stats error:", error)
        return errorResponse("Failed to fetch faculty stats")
    }
}
