"use server"

// ============================================================================
// CAMPUSTRACK - ADMIN ANALYTICS DATA SERVER ACTIONS (OPTIMIZED v2)
// ============================================================================
// Uses Prisma groupBy + count aggregations — no raw SQL, no bulk findMany.
// Each function returns only aggregate data (a few rows) not full record sets.

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

export type TimePeriod = "week" | "month" | "semester" | "year"

/** Date window for the selected period */
function getDateRange(period: TimePeriod) {
    const now = new Date()
    now.setHours(23, 59, 59, 999)

    const daysMap: Record<TimePeriod, number> = { week: 7, month: 30, semester: 90, year: 365 }
    const days = daysMap[period] ?? 30

    const start = new Date(now)
    start.setDate(start.getDate() - days)
    start.setHours(0, 0, 0, 0)

    const prevEnd = new Date(start)
    prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1)
    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - days)
    prevStart.setHours(0, 0, 0, 0)

    return { start, end: now, prevStart, prevEnd }
}

/**
 * Build an array of Date objects grouped by day-of-week for a date range.
 * Returns a map: { 1: [Mon dates], 2: [Tue dates], ..., 5: [Fri dates] }
 */
function groupDatesByDOW(start: Date, end: Date): Map<number, Date[]> {
    const map = new Map<number, Date[]>([[1, []], [2, []], [3, []], [4, []], [5, []]])
    const cursor = new Date(start)
    while (cursor <= end) {
        const dow = cursor.getDay() // 0=Sun…6=Sat
        if (dow >= 1 && dow <= 5) {
            map.get(dow)!.push(new Date(cursor))
        }
        cursor.setDate(cursor.getDate() + 1)
    }
    return map
}

// ============================================================================
// ANALYTICS STATS
// ============================================================================
export async function getAnalyticsStats(period: TimePeriod = "month"): Promise<ActionResult<{
    averageAttendance: number
    peakDay: string
    peakDayRate: number
    atRiskStudents: number
    classesTracked: number
    trend: number
}>> {
    try {
        await requireRole("ADMIN")
        const { start, end, prevStart, prevEnd } = getDateRange(period)

        // ── Parallel: basic totals + per-student totals ──────────────────────
        const [
            totalCount,
            presentCount,
            prevTotalCount,
            prevPresentCount,
            classesTracked,
            allStudentGroups,
            presentStudentGroups
        ] = await Promise.all([
            prisma.attendanceRecord.count({ where: { date: { gte: start, lte: end } } }),
            prisma.attendanceRecord.count({ where: { date: { gte: start, lte: end }, status: "PRESENT" } }),
            prisma.attendanceRecord.count({ where: { date: { gte: prevStart, lte: prevEnd } } }),
            prisma.attendanceRecord.count({ where: { date: { gte: prevStart, lte: prevEnd }, status: "PRESENT" } }),
            // Distinct (date × subject) slots = classes held
            prisma.attendanceRecord.groupBy({
                by: ["date", "subjectId"],
                where: { date: { gte: start, lte: end } }
            }),
            // Per-student total count (for at-risk and DOW)
            prisma.attendanceRecord.groupBy({
                by: ["studentId"],
                where: { date: { gte: start, lte: end } },
                _count: { _all: true }
            }),
            prisma.attendanceRecord.groupBy({
                by: ["studentId"],
                where: { date: { gte: start, lte: end }, status: "PRESENT" },
                _count: { _all: true }
            })
        ])

        // At-risk students
        const presentMap = new Map(presentStudentGroups.map(p => [p.studentId, p._count._all]))
        const atRiskStudents = allStudentGroups.filter(s => {
            const total = s._count._all
            const present = presentMap.get(s.studentId) ?? 0
            return total > 0 && present / total < 0.60
        }).length

        // Peak day of week — 10 targeted count queries (one per DOW × 2)
        const dowMap = groupDatesByDOW(start, end)
        const dayNames: Record<number, string> = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday" }
        const dowResults = await Promise.all(
            [1, 2, 3, 4, 5].map(async (dow) => {
                const dates = dowMap.get(dow) ?? []
                if (dates.length === 0) return { dow, rate: 0 }
                const [t, p] = await Promise.all([
                    prisma.attendanceRecord.count({ where: { date: { in: dates } } }),
                    prisma.attendanceRecord.count({ where: { date: { in: dates }, status: "PRESENT" } })
                ])
                return { dow, rate: t > 0 ? Math.round((p / t) * 100) : 0 }
            })
        )

        let peakDay = "Monday"
        let peakDayRate = 0
        for (const { dow, rate } of dowResults) {
            if (rate > peakDayRate) { peakDayRate = rate; peakDay = dayNames[dow] }
        }

        const averageAttendance = totalCount > 0 ? Math.round((presentCount / totalCount) * 1000) / 10 : 0
        const previousAvg = prevTotalCount > 0 ? (prevPresentCount / prevTotalCount) * 100 : 0
        const trend = Math.round((averageAttendance - previousAvg) * 10) / 10

        return successResponse({
            averageAttendance,
            peakDay,
            peakDayRate,
            atRiskStudents,
            classesTracked: classesTracked.length,
            trend
        })
    } catch (error) {
        console.error("getAnalyticsStats error:", error)
        return errorResponse("Failed to fetch analytics statistics")
    }
}

// ============================================================================
// SEMESTER TREND
// ============================================================================
export async function getSemesterTrendData(period: TimePeriod = "month"): Promise<ActionResult<Array<{
    month: string; attendance: number; target: number
}>>> {
    try {
        await requireRole("ADMIN")
        const today = new Date()
        const buckets: { label: string; start: Date; end: Date }[] = []

        if (period === "week") {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today); d.setDate(d.getDate() - i)
                const s = new Date(d); s.setHours(0, 0, 0, 0)
                const e = new Date(d); e.setHours(23, 59, 59, 999)
                buckets.push({ label: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(s), start: s, end: e })
            }
        } else if (period === "month") {
            for (let i = 3; i >= 0; i--) {
                const wEnd = new Date(today); wEnd.setDate(wEnd.getDate() - i * 7); wEnd.setHours(23, 59, 59, 999)
                const wStart = new Date(wEnd); wStart.setDate(wStart.getDate() - 6); wStart.setHours(0, 0, 0, 0)
                buckets.push({ label: `Wk ${4 - i} (${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(wStart)})`, start: wStart, end: wEnd })
            }
        } else {
            const numMonths = period === "semester" ? 3 : 6
            for (let i = numMonths - 1; i >= 0; i--) {
                const d = new Date(today); d.setMonth(d.getMonth() - i)
                const s = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
                const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
                buckets.push({ label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(s), start: s, end: e })
            }
        }

        const results = await Promise.all(
            buckets.map(async (b) => {
                const [total, present] = await Promise.all([
                    prisma.attendanceRecord.count({ where: { date: { gte: b.start, lte: b.end } } }),
                    prisma.attendanceRecord.count({ where: { date: { gte: b.start, lte: b.end }, status: "PRESENT" } })
                ])
                return { month: b.label, attendance: total > 0 ? Math.round((present / total) * 100) : 0, target: 85 }
            })
        )

        return successResponse(results)
    } catch (error) {
        console.error("getSemesterTrendData error:", error)
        return errorResponse("Failed to fetch semester trend")
    }
}

// ============================================================================
// DEPARTMENT COMPARISON
// ============================================================================
export async function getDepartmentComparisonData(period: TimePeriod = "month"): Promise<ActionResult<Array<{
    name: string; current: number; previous: number
}>>> {
    try {
        await requireRole("ADMIN")
        const { start, end, prevStart, prevEnd } = getDateRange(period)

        const departments = await prisma.department.findMany({ select: { id: true, name: true } })

        const results = await Promise.all(
            departments.map(async (dept) => {
                const [ct, cp, pt, pp] = await Promise.all([
                    prisma.attendanceRecord.count({ where: { date: { gte: start, lte: end }, student: { departmentId: dept.id } } }),
                    prisma.attendanceRecord.count({ where: { date: { gte: start, lte: end }, status: "PRESENT", student: { departmentId: dept.id } } }),
                    prisma.attendanceRecord.count({ where: { date: { gte: prevStart, lte: prevEnd }, student: { departmentId: dept.id } } }),
                    prisma.attendanceRecord.count({ where: { date: { gte: prevStart, lte: prevEnd }, status: "PRESENT", student: { departmentId: dept.id } } })
                ])
                return {
                    name: dept.name,
                    current: ct > 0 ? Math.round((cp / ct) * 100) : 0,
                    previous: pt > 0 ? Math.round((pp / pt) * 100) : 0
                }
            })
        )

        return successResponse(results.filter(d => d.current > 0 || d.previous > 0))
    } catch (error) {
        console.error("getDepartmentComparisonData error:", error)
        return errorResponse("Failed to fetch department comparison")
    }
}

// ============================================================================
// ATTENDANCE BY DAY OF WEEK
// ============================================================================
export async function getAttendanceByDayData(period: TimePeriod = "month"): Promise<ActionResult<Array<{
    day: string; rate: number
}>>> {
    try {
        await requireRole("ADMIN")
        const { start, end } = getDateRange(period)

        const dowMap = groupDatesByDOW(start, end)
        const dayNames: Record<number, string> = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday" }

        const data = await Promise.all(
            [1, 2, 3, 4, 5].map(async (dow) => {
                const dates = dowMap.get(dow) ?? []
                if (dates.length === 0) return { day: dayNames[dow], rate: 0 }
                const [total, present] = await Promise.all([
                    prisma.attendanceRecord.count({ where: { date: { in: dates } } }),
                    prisma.attendanceRecord.count({ where: { date: { in: dates }, status: "PRESENT" } })
                ])
                return { day: dayNames[dow], rate: total > 0 ? Math.round((present / total) * 100) : 0 }
            })
        )

        return successResponse(data)
    } catch (error) {
        console.error("getAttendanceByDayData error:", error)
        return errorResponse("Failed to fetch attendance by day")
    }
}

// ============================================================================
// ATTENDANCE DISTRIBUTION (per student bracket)
// ============================================================================
export async function getAttendanceDistributionData(period: TimePeriod = "month"): Promise<ActionResult<Array<{
    range: string; count: number; color: string
}>>> {
    try {
        await requireRole("ADMIN")
        const { start, end } = getDateRange(period)

        // groupBy per student — returns ~240 rows, not 24k records
        const [allGroups, presentGroups] = await Promise.all([
            prisma.attendanceRecord.groupBy({
                by: ["studentId"],
                where: { date: { gte: start, lte: end } },
                _count: { _all: true }
            }),
            prisma.attendanceRecord.groupBy({
                by: ["studentId"],
                where: { date: { gte: start, lte: end }, status: "PRESENT" },
                _count: { _all: true }
            })
        ])

        const presentMap = new Map(presentGroups.map(p => [p.studentId, p._count._all]))
        const dist = { "90-100%": 0, "75-89%": 0, "60-74%": 0, "Below 60%": 0 }

        for (const s of allGroups) {
            const total = s._count._all
            const present = presentMap.get(s.studentId) ?? 0
            const pct = total > 0 ? (present / total) * 100 : 0
            if (pct >= 90) dist["90-100%"]++
            else if (pct >= 75) dist["75-89%"]++
            else if (pct >= 60) dist["60-74%"]++
            else dist["Below 60%"]++
        }

        return successResponse([
            { range: "90-100%", count: dist["90-100%"], color: "#22c55e" },
            { range: "75-89%", count: dist["75-89%"], color: "#3b82f6" },
            { range: "60-74%", count: dist["60-74%"], color: "#f59e0b" },
            { range: "Below 60%", count: dist["Below 60%"], color: "#ef4444" }
        ])
    } catch (error) {
        console.error("getAttendanceDistributionData error:", error)
        return errorResponse("Failed to fetch attendance distribution")
    }
}

// ============================================================================
// HOURLY / PERIOD PATTERN
// ============================================================================
export async function getHourlyPatternData(period: TimePeriod = "month"): Promise<ActionResult<Array<{
    hour: string; attendance: number
}>>> {
    try {
        await requireRole("ADMIN")
        const { start, end } = getDateRange(period)

        // groupBy period — returns 5 rows max
        const [allGroups, presentGroups] = await Promise.all([
            prisma.attendanceRecord.groupBy({
                by: ["period"],
                where: { date: { gte: start, lte: end } },
                _count: { _all: true }
            }),
            prisma.attendanceRecord.groupBy({
                by: ["period"],
                where: { date: { gte: start, lte: end }, status: "PRESENT" },
                _count: { _all: true }
            })
        ])

        const hourMap: Record<number, string> = { 1: "9AM", 2: "10AM", 3: "11AM", 4: "2PM", 5: "3PM" }
        const presentMap = new Map(presentGroups.map(p => [p.period, p._count._all]))

        const data = allGroups.map(g => ({
            hour: hourMap[g.period] ?? `Period ${g.period}`,
            attendance: g._count._all > 0
                ? Math.round(((presentMap.get(g.period) ?? 0) / g._count._all) * 100)
                : 0
        })).sort((a, b) => {
            const order = ["9AM", "10AM", "11AM", "2PM", "3PM"]
            return order.indexOf(a.hour) - order.indexOf(b.hour)
        })

        return successResponse(data)
    } catch (error) {
        console.error("getHourlyPatternData error:", error)
        return errorResponse("Failed to fetch hourly pattern")
    }
}
