"use server"

// ============================================================================
// CAMPUSTRACK - STUDENT ATTENDANCE SERVER ACTIONS
// ============================================================================
// Students can view their own attendance only
// Student ID always comes from session (never from client)

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { AttendanceRecord } from "@prisma/client"

interface AttendanceStats {
    totalClasses: number
    present: number
    absent: number
    percentage: number
}

interface DayAttendance {
    date: Date
    periods: {
        period: number
        status: "PRESENT" | "ABSENT"
        subject: {
            id: string
            code: string
            name: string
        }
    }[]
}

interface SubjectAttendance {
    subject: {
        id: string
        code: string
        name: string
        type: string
    }
    stats: AttendanceStats
}

/**
 * Get student's attendance for today
 * STUDENT only - student ID from session
 */
export async function getTodayAttendance(): Promise<ActionResult<DayAttendance | null>> {
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

        // 3. Get today's date (start of day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // 4. Fetch today's attendance
        const records = await prisma.attendanceRecord.findMany({
            where: {
                studentId: studentProfile.id,
                date: today,
            },
            include: {
                subject: {
                    select: { id: true, code: true, name: true },
                },
            },
            orderBy: { period: "asc" },
        })

        if (records.length === 0) {
            return successResponse(null)
        }

        const dayAttendance: DayAttendance = {
            date: today,
            periods: records.map((r) => ({
                period: r.period,
                status: r.status,
                subject: r.subject,
            })),
        }

        return successResponse(dayAttendance)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch today's attendance")
    }
}

/**
 * Get student's attendance for a specific date
 * STUDENT only - student ID from session
 */
export async function getAttendanceByDate(
    date: string
): Promise<ActionResult<DayAttendance | null>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("STUDENT")

        // 2. Validate date
        const targetDate = new Date(date)
        if (isNaN(targetDate.getTime())) {
            return errorResponse("Invalid date")
        }
        targetDate.setHours(0, 0, 0, 0)

        // 3. Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
        })

        if (!studentProfile) {
            return errorResponse("Student profile not found", "NOT_FOUND")
        }

        // 4. Fetch attendance for date
        const records = await prisma.attendanceRecord.findMany({
            where: {
                studentId: studentProfile.id,
                date: targetDate,
            },
            include: {
                subject: {
                    select: { id: true, code: true, name: true },
                },
            },
            orderBy: { period: "asc" },
        })

        if (records.length === 0) {
            return successResponse(null)
        }

        const dayAttendance: DayAttendance = {
            date: targetDate,
            periods: records.map((r) => ({
                period: r.period,
                status: r.status,
                subject: r.subject,
            })),
        }

        return successResponse(dayAttendance)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch attendance")
    }
}

/**
 * Get student's attendance for date range (calendar view)
 * STUDENT only
 */
export async function getAttendanceRange(
    startDate: string,
    endDate: string
): Promise<ActionResult<DayAttendance[]>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("STUDENT")

        // 2. Validate dates
        const start = new Date(startDate)
        const end = new Date(endDate)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return errorResponse("Invalid date range")
        }

        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)

        // Limit range to 90 days
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays > 90) {
            return errorResponse("Date range cannot exceed 90 days")
        }

        // 3. Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
        })

        if (!studentProfile) {
            return errorResponse("Student profile not found", "NOT_FOUND")
        }

        // 4. Fetch attendance for range
        const records = await prisma.attendanceRecord.findMany({
            where: {
                studentId: studentProfile.id,
                date: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                subject: {
                    select: { id: true, code: true, name: true },
                },
            },
            orderBy: [{ date: "asc" }, { period: "asc" }],
        })

        // Group by date
        const dateMap = new Map<string, DayAttendance>()

        for (const record of records) {
            const dateKey = record.date.toISOString().split("T")[0]

            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, {
                    date: record.date,
                    periods: [],
                })
            }

            dateMap.get(dateKey)!.periods.push({
                period: record.period,
                status: record.status,
                subject: record.subject,
            })
        }

        return successResponse(Array.from(dateMap.values()))
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch attendance")
    }
}

/**
 * Get student's semester attendance summary
 * STUDENT only - overall and per-subject stats
 */
export async function getSemesterAttendanceSummary(): Promise<ActionResult<{
    overall: AttendanceStats
    subjects: SubjectAttendance[]
}>> {
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

        // 3. Get all attendance for current semester
        const records = await prisma.attendanceRecord.findMany({
            where: {
                studentId: studentProfile.id,
                semesterId: studentProfile.semesterId,
            },
            include: {
                subject: {
                    select: { id: true, code: true, name: true, type: true },
                },
            },
        })

        // 4. Calculate overall stats
        const totalClasses = records.length
        const present = records.filter((r) => r.status === "PRESENT").length
        const absent = totalClasses - present
        const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0

        const overall: AttendanceStats = {
            totalClasses,
            present,
            absent,
            percentage,
        }

        // 5. Calculate per-subject stats
        const subjectMap = new Map<string, { subject: SubjectAttendance["subject"]; records: AttendanceRecord[] }>()

        for (const record of records) {
            if (!subjectMap.has(record.subjectId)) {
                subjectMap.set(record.subjectId, {
                    subject: record.subject as SubjectAttendance["subject"],
                    records: [],
                })
            }
            subjectMap.get(record.subjectId)!.records.push(record)
        }

        const subjects: SubjectAttendance[] = Array.from(subjectMap.values()).map((entry) => {
            const total = entry.records.length
            const pres = entry.records.filter((r) => r.status === "PRESENT").length
            const abs = total - pres
            const pct = total > 0 ? Math.round((pres / total) * 100) : 0

            return {
                subject: entry.subject,
                stats: {
                    totalClasses: total,
                    present: pres,
                    absent: abs,
                    percentage: pct,
                },
            }
        })

        // Sort by subject code
        subjects.sort((a, b) => a.subject.code.localeCompare(b.subject.code))

        return successResponse({ overall, subjects })
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch attendance summary")
    }
}

/**
 * Get student's attendance for a specific subject
 * STUDENT only
 */
export async function getSubjectAttendance(
    subjectId: string
): Promise<ActionResult<{
    subject: SubjectAttendance["subject"]
    stats: AttendanceStats
    records: AttendanceRecord[]
}>> {
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

        // 3. Verify subject exists and belongs to student's semester
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
        })

        if (!subject) {
            return errorResponse("Subject not found", "NOT_FOUND")
        }

        if (subject.semesterId !== studentProfile.semesterId) {
            return errorResponse("Subject not in your semester", "UNAUTHORIZED")
        }

        // 4. Get attendance records
        const records = await prisma.attendanceRecord.findMany({
            where: {
                studentId: studentProfile.id,
                subjectId: subjectId,
            },
            orderBy: [{ date: "desc" }, { period: "asc" }],
        })

        // 5. Calculate stats
        const totalClasses = records.length
        const present = records.filter((r) => r.status === "PRESENT").length
        const absent = totalClasses - present
        const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0

        return successResponse({
            subject: {
                id: subject.id,
                code: subject.code,
                name: subject.name,
                type: subject.type,
            },
            stats: {
                totalClasses,
                present,
                absent,
                percentage,
            },
            records,
        })
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Student access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch subject attendance")
    }
}
