"use server"

// ============================================================================
// CAMPUSTRACK - ADMIN ATTENDANCE DATA SERVER ACTIONS
// ============================================================================
// Real data queries for attendance overview (no mock data)

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

/**
 * Get attendance statistics for admin dashboard
 * Returns: overall percentage, classes today, at-risk students, perfect attendance
 */
export async function getAttendanceStats(): Promise<ActionResult<{
    overallAttendance: number
    classesToday: number
    atRiskStudents: number
    perfectAttendance: number
    trend: number
}>> {
    try {
        await requireRole("ADMIN")

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Overall attendance (last 30 days)
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const totalRecords = await prisma.attendanceRecord.count({
            where: {
                date: {
                    gte: thirtyDaysAgo,
                    lte: today
                }
            }
        })

        const presentRecords = await prisma.attendanceRecord.count({
            where: {
                date: {
                    gte: thirtyDaysAgo,
                    lte: today
                },
                status: "PRESENT"
            }
        })

        const overallAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

        // Classes today (unique timetable entries)
        const classesToday = await prisma.timetable.count()

        // At-risk students (< 75% attendance)
        const students = await prisma.studentProfile.findMany({
            include: {
                attendance: {
                    where: {
                        date: {
                            gte: thirtyDaysAgo,
                            lte: today
                        }
                    }
                }
            }
        })

        const atRiskStudents = students.filter(student => {
            const total = student.attendance.length
            if (total === 0) return false
            const present = student.attendance.filter(a => a.status === "PRESENT").length
            return (present / total) < 0.75
        }).length

        // Perfect attendance (100% in last 30 days)
        const perfectAttendance = students.filter(student => {
            const total = student.attendance.length
            if (total === 0) return false
            const present = student.attendance.filter(a => a.status === "PRESENT").length
            return (present / total) === 1.0
        }).length

        // Calculate trend (compare to previous 30 days)
        const sixtyDaysAgo = new Date(today)
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

        const previousTotal = await prisma.attendanceRecord.count({
            where: {
                date: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo
                }
            }
        })

        const previousPresent = await prisma.attendanceRecord.count({
            where: {
                date: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo
                },
                status: "PRESENT"
            }
        })

        const previousAttendance = previousTotal > 0 ? (previousPresent / previousTotal) * 100 : 0
        const trend = overallAttendance - previousAttendance

        return successResponse({
            overallAttendance,
            classesToday,
            atRiskStudents,
            perfectAttendance,
            trend: Math.round(trend * 10) / 10
        })
    } catch (error) {
        console.error("Get attendance stats error:", error)
        return errorResponse("Failed to fetch attendance statistics")
    }
}

/**
 * Get department-wise attendance data
 */
export async function getDepartmentAttendanceData(): Promise<ActionResult<Array<{
    dept: string
    attendance: number
}>>> {
    try {
        await requireRole("ADMIN")

        const departments = await prisma.department.findMany({
            include: {
                students: {
                    include: {
                        attendance: {
                            where: {
                                date: {
                                    gte: new Date(new Date().setDate(new Date().getDate() - 30))
                                }
                            }
                        }
                    }
                }
            }
        })

        const data = departments.map(dept => {
            let totalRecords = 0
            let presentRecords = 0

            dept.students.forEach(student => {
                totalRecords += student.attendance.length
                presentRecords += student.attendance.filter(a => a.status === "PRESENT").length
            })

            const attendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

            return {
                dept: dept.code,
                attendance
            }
        })

        return successResponse(data.filter(d => d.attendance > 0))
    } catch (error) {
        console.error("Get department attendance error:", error)
        return errorResponse("Failed to fetch department attendance")
    }
}

/**
 * Get weekly attendance trend (last 5 weeks)
 */
export async function getWeeklyAttendanceTrend(): Promise<ActionResult<Array<{
    week: string
    attendance: number
}>>> {
    try {
        await requireRole("ADMIN")

        const data: Array<{ week: string; attendance: number }> = []
        const today = new Date()

        for (let i = 4; i >= 0; i--) {
            const weekEnd = new Date(today)
            weekEnd.setDate(weekEnd.getDate() - (i * 7))

            const weekStart = new Date(weekEnd)
            weekStart.setDate(weekStart.getDate() - 7)

            const totalRecords = await prisma.attendanceRecord.count({
                where: {
                    date: {
                        gte: weekStart,
                        lt: weekEnd
                    }
                }
            })

            const presentRecords = await prisma.attendanceRecord.count({
                where: {
                    date: {
                        gte: weekStart,
                        lt: weekEnd
                    },
                    status: "PRESENT"
                }
            })

            const attendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

            data.push({
                week: `Week ${5 - i}`,
                attendance
            })
        }

        return successResponse(data)
    } catch (error) {
        console.error("Get weekly trend error:", error)
        return errorResponse("Failed to fetch weekly trend")
    }
}

/**
 * Get students with low attendance (< 75%)
 */
export async function getLowAttendanceStudents(): Promise<ActionResult<Array<{
    id: string
    name: string
    department: string
    attendance: number
    course: string
}>>> {
    try {
        await requireRole("ADMIN")

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const students = await prisma.studentProfile.findMany({
            include: {
                user: true,
                department: true,
                attendance: {
                    where: {
                        date: {
                            gte: thirtyDaysAgo
                        }
                    },
                    include: {
                        subject: true
                    }
                }
            }
        })

        const lowAttendanceStudents = students
            .map(student => {
                const total = student.attendance.length
                if (total === 0) return null

                const present = student.attendance.filter(a => a.status === "PRESENT").length
                const percentage = Math.round((present / total) * 100)

                if (percentage >= 75) return null

                // Get most common subject
                const subjectCounts: Record<string, number> = {}
                student.attendance.forEach(a => {
                    subjectCounts[a.subject.code] = (subjectCounts[a.subject.code] || 0) + 1
                })
                const mostCommonSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"

                return {
                    id: student.enrollmentNo,
                    name: student.user.name,
                    department: student.department.name,
                    attendance: percentage,
                    course: mostCommonSubject
                }
            })
            .filter((s): s is NonNullable<typeof s> => s !== null)
            .sort((a, b) => a.attendance - b.attendance)
            .slice(0, 10) // Top 10 at-risk

        return successResponse(lowAttendanceStudents)
    } catch (error) {
        console.error("Get low attendance students error:", error)
        return errorResponse("Failed to fetch low attendance students")
    }
}

/**
 * Get recent attendance records
 */
export async function getRecentAttendanceRecords(): Promise<ActionResult<Array<{
    date: string
    course: string
    section: string
    present: number
    absent: number
    total: number
    faculty: string
}>>> {
    try {
        await requireRole("ADMIN")

        // Get records from last 7 days, grouped by date + subject + faculty
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const records = await prisma.attendanceRecord.findMany({
            where: {
                date: {
                    gte: sevenDaysAgo
                }
            },
            include: {
                subject: {
                    include: {
                        department: true
                    }
                },
                faculty: {
                    include: {
                        user: true,
                        department: true
                    }
                }
            },
            orderBy: {
                date: "desc"
            }
        })

        // Group by date + subject + faculty
        const grouped = new Map<string, {
            date: Date
            subject: string
            department: string
            faculty: string
            present: number
            absent: number
        }>()

        records.forEach(record => {
            const key = `${record.date.toISOString().split('T')[0]}-${record.subjectId}-${record.markedBy}`

            if (!grouped.has(key)) {
                grouped.set(key, {
                    date: record.date,
                    subject: record.subject.code,
                    department: record.subject.department.code,
                    faculty: record.faculty.user.name,
                    present: 0,
                    absent: 0
                })
            }

            const entry = grouped.get(key)!
            if (record.status === "PRESENT") {
                entry.present++
            } else {
                entry.absent++
            }
        })

        const data = Array.from(grouped.values())
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 10)
            .map(entry => ({
                date: entry.date.toISOString().split('T')[0],
                course: entry.subject,
                section: `${entry.department}-A`,
                present: entry.present,
                absent: entry.absent,
                total: entry.present + entry.absent,
                faculty: entry.faculty
            }))

        return successResponse(data)
    } catch (error) {
        console.error("Get recent records error:", error)
        return errorResponse("Failed to fetch recent attendance records")
    }
}
