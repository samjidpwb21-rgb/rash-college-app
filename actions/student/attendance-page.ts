"use server"

// ============================================================================
// CAMPUSTRACK - STUDENT ATTENDANCE PAGE QUERIES
// ============================================================================

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

interface AttendancePageData {
    user: {
        name: string
        departmentName: string
        semesterNumber: number
    }
    stats: {
        totalPresent: number
        totalAbsent: number
        attendanceRate: number
    }
    subjectStats: Array<{
        subjectId: string
        subject: string
        present: number
        total: number
        percentage: number
    }>
    // Attendance dates for calendar heatmap
    attendanceDates: {
        present: string[] // ISO date strings
        absent: string[]
    }
    // Current semester number for filtering
    currentSemester: number
}

/**
 * Get all data needed for student attendance page
 */
export async function getStudentAttendancePageData(): Promise<ActionResult<AttendancePageData>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "STUDENT") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        // Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                user: { select: { name: true } },
                department: { select: { name: true } },
                semester: { select: { number: true } },
            },
        })

        if (!studentProfile) {
            return errorResponse("Student profile not found", "NOT_FOUND")
        }

        // Get all attendance records for current semester
        const records = await prisma.attendanceRecord.findMany({
            where: {
                studentId: studentProfile.id,
                semesterId: studentProfile.semesterId,
            },
            include: {
                subject: { select: { id: true, code: true, name: true } },
            },
        })

        // Calculate stats
        const totalPresent = records.filter(r => r.status === "PRESENT").length
        const totalAbsent = records.filter(r => r.status === "ABSENT").length
        const total = records.length
        const attendanceRate = total > 0 ? Math.round((totalPresent / total) * 100) : 0

        // Group by subject
        const subjectMap = new Map<string, { id: string; name: string; code: string; present: number; total: number }>()
        for (const record of records) {
            if (!subjectMap.has(record.subjectId)) {
                subjectMap.set(record.subjectId, {
                    id: record.subject.id,
                    name: record.subject.name,
                    code: record.subject.code,
                    present: 0,
                    total: 0,
                })
            }
            const stat = subjectMap.get(record.subjectId)!
            stat.total++
            if (record.status === "PRESENT") stat.present++
        }

        const subjectStats = Array.from(subjectMap.values()).map(s => ({
            subjectId: s.id,
            subject: `${s.name} (${s.code})`,
            present: s.present,
            total: s.total,
            percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
        }))

        // Group attendance by date for calendar heatmap
        const presentDates = new Set<string>()
        const absentDates = new Set<string>()

        for (const record of records) {
            const dateStr = record.date.toISOString().split("T")[0]
            if (record.status === "PRESENT") {
                presentDates.add(dateStr)
            } else {
                absentDates.add(dateStr)
            }
        }

        return successResponse({
            user: {
                name: studentProfile.user.name,
                departmentName: studentProfile.department.name,
                semesterNumber: studentProfile.semester.number,
            },
            stats: {
                totalPresent,
                totalAbsent,
                attendanceRate,
            },
            subjectStats,
            attendanceDates: {
                present: Array.from(presentDates),
                absent: Array.from(absentDates),
            },
            currentSemester: studentProfile.semester.number,
        })
    } catch (error) {
        console.error("Attendance page error:", error)
        return errorResponse("Failed to load attendance data")
    }
}

interface DailyAttendanceData {
    periods: Array<{
        period: number
        subject: string
        code: string
        time: string
        room: string | null
        faculty: string
        status: "PRESENT" | "ABSENT" | "not-marked" | "not-applicable"
    }>
    isWeekend: boolean
    isFuture: boolean
}

/**
 * Get attendance for a specific date (5-period view)
 */
export async function getDailyAttendance(dateStr: string): Promise<ActionResult<DailyAttendanceData>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "STUDENT") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const date = new Date(dateStr)
        if (isNaN(date.getTime())) {
            return errorResponse("Invalid date")
        }
        date.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isFuture = date > today

        const dayOfWeek = date.getDay()
        const isWeekend = dayOfWeek === 0 // Sunday

        if (isWeekend || isFuture) {
            return successResponse({
                periods: [],
                isWeekend,
                isFuture,
            })
        }

        // Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: session.user.id },
        })

        if (!studentProfile) {
            return errorResponse("Student profile not found", "NOT_FOUND")
        }

        // Get timetable for this day
        const timetable = await prisma.timetable.findMany({
            where: {
                semesterId: studentProfile.semesterId,
                departmentId: studentProfile.departmentId,
                dayOfWeek: dayOfWeek,
            },
            include: {
                subject: { select: { id: true, code: true, name: true } },
                faculty: {
                    include: { user: { select: { name: true } } },
                },
            },
            orderBy: { period: "asc" },
        })

        // Get attendance for this date
        const attendance = await prisma.attendanceRecord.findMany({
            where: {
                studentId: studentProfile.id,
                date: date,
            },
        })

        const attendanceMap = new Map(
            attendance.map(a => [`${a.subjectId}-${a.period}`, a.status])
        )

        const periodTimes = ["09:30 - 10:20", "10:20 - 11:20", "11:30 - 12:30", "01:30 - 02:30", "02:30 - 03:30"]

        // Build 5 periods
        const periods: DailyAttendanceData["periods"] = Array.from({ length: 5 }, (_, i) => {
            const period = i + 1
            const entry = timetable.find(t => t.period === period)

            if (!entry) {
                return {
                    period,
                    subject: "Free Period",
                    code: "",
                    time: periodTimes[i],
                    room: null,
                    faculty: "",
                    status: "not-applicable" as const,
                }
            }

            const key = `${entry.subjectId}-${period}`
            const status = attendanceMap.get(key) || "not-marked"

            return {
                period,
                subject: entry.subject.name,
                code: entry.subject.code,
                time: periodTimes[i],
                room: entry.room,
                faculty: entry.faculty.user.name,
                status: status as "PRESENT" | "ABSENT" | "not-marked",
            }
        })

        return successResponse({
            periods,
            isWeekend,
            isFuture,
        })
    } catch (error) {
        console.error("Daily attendance error:", error)
        return errorResponse("Failed to load daily attendance")
    }
}

interface AttendanceRecord {
    date: string
    day: string
    subject: string
    time: string
    status: "PRESENT" | "ABSENT"
}

/**
 * Get recent attendance records for the table
 */
export async function getRecentAttendanceRecords(
    limit: number = 20
): Promise<ActionResult<AttendanceRecord[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "STUDENT") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: session.user.id },
        })

        if (!studentProfile) {
            return errorResponse("Student profile not found", "NOT_FOUND")
        }

        const records = await prisma.attendanceRecord.findMany({
            where: {
                studentId: studentProfile.id,
                semesterId: studentProfile.semesterId,
            },
            include: {
                subject: { select: { name: true } },
            },
            orderBy: [{ date: "desc" }, { period: "desc" }],
            take: limit,
        })

        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        const periodTimes = ["09:30 AM", "10:20 AM", "11:30 AM", "01:30 PM", "02:30 PM"]

        return successResponse(records.map(r => ({
            date: r.date.toISOString().split("T")[0],
            day: dayNames[r.date.getDay()],
            subject: r.subject.name,
            time: periodTimes[r.period - 1] || `Period ${r.period}`,
            status: r.status,
        })))
    } catch (error) {
        console.error("Recent attendance error:", error)
        return errorResponse("Failed to load attendance records")
    }
}
