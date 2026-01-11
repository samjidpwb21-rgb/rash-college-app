"use server"

// ============================================================================
// DAILY ATTENDANCE STATUS - SERVER ACTION
// ============================================================================
// Fetches today's attendance for a student (5 periods)
// Merges regular attendance + MDC attendance seamlessly

import { prisma } from "@/lib/db"
import { AttendanceStatus } from "@prisma/client"

export interface DailyAttendanceBlock {
    period: number  // 1-5
    status: AttendanceStatus | "NOT_MARKED"
    facultyName: string | null  // null if NOT_MARKED
}

/**
 * Get today's attendance status for a student
 * Returns exactly 5 blocks (one per period)
 * Merges regular attendance + MDC attendance 
 */
export async function getDailyAttendanceStatus(
    studentId: string
): Promise<DailyAttendanceBlock[]> {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Fetch regular attendance for today
        const regularAttendance = await prisma.attendanceRecord.findMany({
            where: {
                studentId,
                date: today,
            },
            include: {
                faculty: {
                    include: {
                        user: { select: { name: true } },
                    },
                },
            },
        })

        // Fetch MDC attendance for today
        const mdcAttendance = await prisma.mDCAttendanceRecord.findMany({
            where: {
                studentId,
                date: today,
            },
            include: {
                faculty: {
                    include: {
                        user: { select: { name: true } },
                    },
                },
            },
        })

        // Create map: period → attendance data
        const attendanceMap = new Map<number, { status: AttendanceStatus; facultyName: string }>()

        // Add regular attendance
        for (const record of regularAttendance) {
            attendanceMap.set(record.period, {
                status: record.status,
                facultyName: record.faculty.user.name,
            })
        }

        // Add MDC attendance (overwrites if duplicate period, but shouldn't happen)
        for (const record of mdcAttendance) {
            attendanceMap.set(record.period, {
                status: record.status,
                facultyName: record.faculty.user.name,
            })
        }

        // Build exactly 5 blocks (periods 1-5)
        const blocks: DailyAttendanceBlock[] = []
        for (let period = 1; period <= 5; period++) {
            const attendance = attendanceMap.get(period)
            if (attendance) {
                blocks.push({
                    period,
                    status: attendance.status,
                    facultyName: attendance.facultyName,
                })
            } else {
                blocks.push({
                    period,
                    status: "NOT_MARKED",
                    facultyName: null,
                })
            }
        }

        return blocks
    } catch (error) {
        console.error("Error fetching daily attendance:", error)
        // Return empty blocks on error
        return Array.from({ length: 5 }, (_, i) => ({
            period: i + 1,
            status: "NOT_MARKED" as const,
            facultyName: null,
        }))
    }
}
