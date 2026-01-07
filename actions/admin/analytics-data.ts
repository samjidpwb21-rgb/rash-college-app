"use server"

// ============================================================================
// CAMPUSTRACK - ADMIN ANALYTICS DATA SERVER ACTIONS
// ============================================================================
// Real data queries for analytics (no mock data)

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

/**
 * Get analytics statistics
 */
export async function getAnalyticsStats(): Promise<ActionResult<{
    averageAttendance: number
    peakDay: string
    peakDayRate: number
    atRiskStudents: number
    classesTracked: number
    trend: number
}>> {
    try {
        await requireRole("ADMIN")

        const today = new Date()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // Average attendance
        const totalRecords = await prisma.attendanceRecord.count({
            where: { date: { gte: thirtyDaysAgo } }
        })
        const presentRecords = await prisma.attendanceRecord.count({
            where: { date: { gte: thirtyDaysAgo }, status: "PRESENT" }
        })
        const averageAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 1000) / 10 : 0

        // Peak day (group by day of week)
        const records = await prisma.attendanceRecord.findMany({
            where: { date: { gte: thirtyDaysAgo } },
            select: { date: true, status: true }
        })

        const dayStats: Record<string, { total: number; present: number }> = {
            Monday: { total: 0, present: 0 },
            Tuesday: { total: 0, present: 0 },
            Wednesday: { total: 0, present: 0 },
            Thursday: { total: 0, present: 0 },
            Friday: { total: 0, present: 0 }
        }

        records.forEach(r => {
            const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(r.date)
            if (dayStats[dayName]) {
                dayStats[dayName].total++
                if (r.status === "PRESENT") dayStats[dayName].present++
            }
        })

        let peakDay = "Monday"
        let peakDayRate = 0
        Object.entries(dayStats).forEach(([day, stats]) => {
            if (stats.total > 0) {
                const rate = Math.round((stats.present / stats.total) * 100)
                if (rate > peakDayRate) {
                    peakDay = day
                    peakDayRate = rate
                }
            }
        })

        // At-risk students
        const students = await prisma.studentProfile.findMany({
            include: {
                attendance: {
                    where: { date: { gte: thirtyDaysAgo } }
                }
            }
        })
        const atRiskStudents = students.filter(s => {
            const total = s.attendance.length
            if (total === 0) return false
            const present = s.attendance.filter(a => a.status === "PRESENT").length
            return (present / total) < 0.60
        }).length

        // Classes tracked this month
        const classesTracked = await prisma.attendanceRecord.groupBy({
            by: ['date', 'subjectId'],
            where: { date: { gte: thirtyDaysAgo } }
        })

        // Trend
        const sixtyDaysAgo = new Date(today)
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        const previousTotal = await prisma.attendanceRecord.count({
            where: { date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
        })
        const previousPresent = await prisma.attendanceRecord.count({
            where: { date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, status: "PRESENT" }
        })
        const previousAvg = previousTotal > 0 ? (previousPresent / previousTotal) * 100 : 0
        const trend = averageAttendance - previousAvg

        return successResponse({
            averageAttendance,
            peakDay,
            peakDayRate,
            atRiskStudents,
            classesTracked: classesTracked.length,
            trend: Math.round(trend * 10) / 10
        })
    } catch (error) {
        console.error("Get analytics stats error:", error)
        return errorResponse("Failed to fetch analytics statistics")
    }
}

/**
 * Get semester trend data (last 6 months)
 */
export async function getSemesterTrendData(): Promise<ActionResult<Array<{
    month: string
    attendance: number
    target: number
}>>> {
    try {
        await requireRole("ADMIN")

        const data: Array<{ month: string; attendance: number; target: number }> = []
        const today = new Date()
        const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"]

        for (let i = 5; i >= 0; i--) {
            const monthEnd = new Date(today)
            monthEnd.setMonth(monthEnd.getMonth() - i)
            monthEnd.setDate(1)
            monthEnd.setMonth(monthEnd.getMonth() + 1)
            monthEnd.setDate(0)

            const monthStart = new Date(monthEnd)
            monthStart.setDate(1)

            const totalRecords = await prisma.attendanceRecord.count({
                where: { date: { gte: monthStart, lte: monthEnd } }
            })
            const presentRecords = await prisma.attendanceRecord.count({
                where: { date: { gte: monthStart, lte: monthEnd }, status: "PRESENT" }
            })

            const attendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

            data.push({
                month: months[5 - i],
                attendance,
                target: 85
            })
        }

        return successResponse(data)
    } catch (error) {
        console.error("Get semester trend error:", error)
        return errorResponse("Failed to fetch semester trend")
    }
}

/**
 * Get department comparison data
 */
export async function getDepartmentComparisonData(): Promise<ActionResult<Array<{
    name: string
    current: number
    previous: number
}>>> {
    try {
        await requireRole("ADMIN")

        const today = new Date()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const sixtyDaysAgo = new Date(today)
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

        const departments = await prisma.department.findMany({
            include: {
                students: {
                    include: {
                        attendance: true
                    }
                }
            }
        })

        const data = departments.map(dept => {
            let currentTotal = 0, currentPresent = 0
            let previousTotal = 0, previousPresent = 0

            dept.students.forEach(student => {
                student.attendance.forEach(a => {
                    if (a.date >= thirtyDaysAgo) {
                        currentTotal++
                        if (a.status === "PRESENT") currentPresent++
                    } else if (a.date >= sixtyDaysAgo && a.date < thirtyDaysAgo) {
                        previousTotal++
                        if (a.status === "PRESENT") previousPresent++
                    }
                })
            })

            return {
                name: dept.name,
                current: currentTotal > 0 ? Math.round((currentPresent / currentTotal) * 100) : 0,
                previous: previousTotal > 0 ? Math.round((previousPresent / previousTotal) * 100) : 0
            }
        }).filter(d => d.current > 0 || d.previous > 0)

        return successResponse(data)
    } catch (error) {
        console.error("Get department comparison error:", error)
        return errorResponse("Failed to fetch department comparison")
    }
}

/**
 * Get attendance by day of week
 */
export async function getAttendanceByDayData(): Promise<ActionResult<Array<{
    day: string
    rate: number
}>>> {
    try {
        await requireRole("ADMIN")

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const records = await prisma.attendanceRecord.findMany({
            where: { date: { gte: thirtyDaysAgo } },
            select: { date: true, status: true }
        })

        const dayStats: Record<string, { total: number; present: number }> = {
            Monday: { total: 0, present: 0 },
            Tuesday: { total: 0, present: 0 },
            Wednesday: { total: 0, present: 0 },
            Thursday: { total: 0, present: 0 },
            Friday: { total: 0, present: 0 }
        }

        records.forEach(r => {
            const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(r.date)
            if (dayStats[dayName]) {
                dayStats[dayName].total++
                if (r.status === "PRESENT") dayStats[dayName].present++
            }
        })

        const data = Object.entries(dayStats).map(([day, stats]) => ({
            day,
            rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
        }))

        return successResponse(data)
    } catch (error) {
        console.error("Get attendance by day error:", error)
        return errorResponse("Failed to fetch attendance by day")
    }
}

/**
 * Get attendance distribution by brackets
 */
export async function getAttendanceDistributionData(): Promise<ActionResult<Array<{
    range: string
    count: number
    color: string
}>>> {
    try {
        await requireRole("ADMIN")

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const students = await prisma.studentProfile.findMany({
            include: {
                attendance: {
                    where: { date: { gte: thirtyDaysAgo } }
                }
            }
        })

        const distribution = {
            "90-100%": 0,
            "75-89%": 0,
            "60-74%": 0,
            "Below 60%": 0
        }

        students.forEach(student => {
            const total = student.attendance.length
            if (total === 0) return

            const present = student.attendance.filter(a => a.status === "PRESENT").length
            const percentage = (present / total) * 100

            if (percentage >= 90) distribution["90-100%"]++
            else if (percentage >= 75) distribution["75-89%"]++
            else if (percentage >= 60) distribution["60-74%"]++
            else distribution["Below 60%"]++
        })

        const data = [
            { range: "90-100%", count: distribution["90-100%"], color: "#22c55e" },
            { range: "75-89%", count: distribution["75-89%"], color: "#3b82f6" },
            { range: "60-74%", count: distribution["60-74%"], color: "#f59e0b" },
            { range: "Below 60%", count: distribution["Below 60%"], color: "#ef4444" }
        ]

        return successResponse(data)
    } catch (error) {
        console.error("Get attendance distribution error:", error)
        return errorResponse("Failed to fetch attendance distribution")
    }
}

/**
 * Get hourly attendance pattern (by period 1-5)
 */
export async function getHourlyPatternData(): Promise<ActionResult<Array<{
    hour: string
    attendance: number
}>>> {
    try {
        await requireRole("ADMIN")

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const records = await prisma.attendanceRecord.findMany({
            where: { date: { gte: thirtyDaysAgo } },
            select: { period: true, status: true }
        })

        const periodStats: Record<number, { total: number; present: number }> = {
            1: { total: 0, present: 0 },
            2: { total: 0, present: 0 },
            3: { total: 0, present: 0 },
            4: { total: 0, present: 0 },
            5: { total: 0, present: 0 }
        }

        records.forEach(r => {
            if (periodStats[r.period]) {
                periodStats[r.period].total++
                if (r.status === "PRESENT") periodStats[r.period].present++
            }
        })

        // Map periods to approximate hours
        const hourMap: Record<number, string> = {
            1: "9AM",
            2: "10AM",
            3: "11AM",
            4: "2PM",
            5: "3PM"
        }

        const data = Object.entries(periodStats).map(([period, stats]) => ({
            hour: hourMap[parseInt(period)] || `Period ${period}`,
            attendance: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
        }))

        return successResponse(data)
    } catch (error) {
        console.error("Get hourly pattern error:", error)
        return errorResponse("Failed to fetch hourly pattern")
    }
}
