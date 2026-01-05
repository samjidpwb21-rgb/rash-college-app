"use server"

// ============================================================================
// CAMPUSTRACK - MDC ATTENDANCE ACTIONS (FACULTY)
// ============================================================================
// Server actions for MDC attendance marking

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { AttendanceStatus } from "@prisma/client"

// ============================================================================
// SUBMIT MDC ATTENDANCE
// ============================================================================

interface MDCAttendanceSubmission {
    mdcCourseId: string
    date: Date
    period: number
    records: Array<{
        studentId: string
        status: AttendanceStatus
    }>
}

export async function submitMDCAttendance(
    data: MDCAttendanceSubmission
): Promise<ActionResult<void>> {
    try {
        const session = await getSession()

        if (!session?.user || session.user.role !== "FACULTY") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        // Get faculty profile
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        // Verify faculty is assigned to this MDC course
        const mdcCourse = await prisma.mDCCourse.findUnique({
            where: { id: data.mdcCourseId },
            select: { facultyId: true },
        })

        if (!mdcCourse) {
            return errorResponse("MDC course not found", "NOT_FOUND")
        }

        if (mdcCourse.facultyId !== facultyProfile.id) {
            return errorResponse("You are not assigned to this MDC course", "FORBIDDEN")
        }

        // Validate inputs
        if (data.period < 1 || data.period > 5) {
            return errorResponse("Period must be between 1 and 5")
        }

        if (data.records.length === 0) {
            return errorResponse("No attendance records provided")
        }

        // Create attendance records (use upsert to handle duplicates)
        await Promise.all(
            data.records.map((record) =>
                prisma.mDCAttendanceRecord.upsert({
                    where: {
                        mdcCourseId_studentId_date_period: {
                            mdcCourseId: data.mdcCourseId,
                            studentId: record.studentId,
                            date: data.date,
                            period: data.period,
                        },
                    },
                    create: {
                        mdcCourseId: data.mdcCourseId,
                        studentId: record.studentId,
                        date: data.date,
                        period: data.period,
                        status: record.status,
                        markedBy: facultyProfile.id,
                    },
                    update: {
                        status: record.status,
                    },
                })
            )
        )

        revalidatePath("/dashboard/faculty")

        return successResponse(undefined)
    } catch (error) {
        console.error("Error submitting MDC attendance:", error)
        return errorResponse("Failed to submit attendance")
    }
}

// ============================================================================
// GET EXISTING MDC ATTENDANCE
// ============================================================================

export async function getExistingMDCAttendance(
    mdcCourseId: string,
    date: Date,
    period: number
): Promise<
    ActionResult<
        Record<
            string,
            {
                status: AttendanceStatus
            }
        >
    >
> {
    try {
        const session = await getSession()

        if (!session?.user || session.user.role !== "FACULTY") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const records = await prisma.mDCAttendanceRecord.findMany({
            where: {
                mdcCourseId,
                date,
                period,
            },
            select: {
                studentId: true,
                status: true,
            },
        })

        const recordMap: Record<string, { status: AttendanceStatus }> = {}
        records.forEach((r) => {
            recordMap[r.studentId] = { status: r.status }
        })

        return successResponse(recordMap)
    } catch (error) {
        console.error("Error fetching existing MDC attendance:", error)
        return errorResponse("Failed to fetch existing attendance")
    }
}
