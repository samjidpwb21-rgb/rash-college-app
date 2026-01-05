"use server"

// ============================================================================
// CAMPUSTRACK - FACULTY ATTENDANCE SERVER ACTIONS (CRITICAL)
// ============================================================================
// Faculty marks attendance for assigned subjects
// - All 5 periods submitted together
// - Uses Prisma upsert for auto-update on edit
// - Subject must be in faculty's assignments
// - Creates notifications for students

import { prisma } from "@/lib/db"
import { getCurrentUser, requireRole } from "@/lib/auth"
import { markAttendanceSchema, uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { AttendanceRecord } from "@prisma/client"

interface AttendanceInput {
    studentId: string
    period: number
    status: "PRESENT" | "ABSENT"
}

interface MarkAttendanceInput {
    subjectId: string
    date: string
    records: AttendanceInput[]
}

/**
 * Mark attendance for a subject
 * FACULTY only
 * 
 * BUSINESS RULES:
 * - Faculty must be assigned to the subject
 * - Subject must exist in timetable for that date's day
 * - Cannot mark future dates
 * - All 5 periods can be marked at once
 * - Uses upsert to handle edits (duplicate = update)
 * - Creates notifications for affected students
 */
export async function markAttendance(
    input: MarkAttendanceInput
): Promise<ActionResult<{ count: number; date: string }>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("FACULTY")

        // 2. Validate input
        const validated = markAttendanceSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        const { subjectId, date, records } = validated.data
        const attendanceDate = new Date(date)

        // 3. Get faculty profile
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        // 4. Check faculty is assigned to this subject
        const assignment = await prisma.facultySubject.findUnique({
            where: {
                facultyId_subjectId: {
                    facultyId: facultyProfile.id,
                    subjectId: subjectId,
                },
            },
        })

        if (!assignment) {
            return errorResponse("You are not assigned to this subject", "UNAUTHORIZED")
        }

        // 5. Verify subject exists and get semester info
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: { semester: true },
        })

        if (!subject) {
            return errorResponse("Subject not found", "NOT_FOUND")
        }

        // 6. Check subject exists in timetable for this day
        const dayOfWeek = attendanceDate.getDay() // 0=Sunday, 1=Monday, etc.
        // Convert to our system: 1=Monday, 6=Saturday, no Sunday
        const adjustedDay = dayOfWeek === 0 ? 0 : dayOfWeek

        if (adjustedDay === 0) {
            return errorResponse("No classes on Sunday", "INVALID_DAY")
        }

        const timetableEntry = await prisma.timetable.findFirst({
            where: {
                subjectId: subjectId,
                dayOfWeek: adjustedDay,
                semesterId: subject.semesterId,
            },
        })

        if (!timetableEntry) {
            return errorResponse("Subject not scheduled for this day", "NOT_IN_TIMETABLE")
        }

        // 7. Validate all students exist and belong to the subject's semester
        const studentIds = [...new Set(records.map((r) => r.studentId))]
        const students = await prisma.studentProfile.findMany({
            where: {
                id: { in: studentIds },
                semesterId: subject.semesterId,
            },
            include: {
                user: { select: { id: true } },
            },
        })

        if (students.length !== studentIds.length) {
            return errorResponse("Some students not found or not in this semester", "INVALID_STUDENTS")
        }

        // 8. Upsert attendance records (auto-update on edit)
        const upsertPromises = records.map((record) =>
            prisma.attendanceRecord.upsert({
                where: {
                    studentId_subjectId_date_period: {
                        studentId: record.studentId,
                        subjectId: subjectId,
                        date: attendanceDate,
                        period: record.period,
                    },
                },
                update: {
                    status: record.status,
                    markedBy: facultyProfile.id,
                    updatedAt: new Date(),
                },
                create: {
                    studentId: record.studentId,
                    subjectId: subjectId,
                    date: attendanceDate,
                    period: record.period,
                    status: record.status,
                    markedBy: facultyProfile.id,
                    semesterId: subject.semesterId,
                },
            })
        )

        await prisma.$transaction(upsertPromises)

        // 9. Create notifications for students
        const studentUserIds = students.map((s) => s.user.id)
        const notificationData = studentUserIds.map((userId) => ({
            userId,
            type: "ATTENDANCE" as const,
            title: "Attendance Marked",
            message: `Attendance for ${subject.name} on ${attendanceDate.toLocaleDateString()} has been recorded`,
            link: "/dashboard/student/attendance",
        }))

        await prisma.notification.createMany({
            data: notificationData,
        })

        return successResponse(
            { count: records.length, date: date },
            `Attendance marked for ${records.length} records`
        )
    } catch (error) {
        console.error("Mark attendance error:", error)
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to mark attendance")
    }
}

/**
 * Get subjects assigned to faculty
 * FACULTY only
 */
export async function getFacultySubjects(): Promise<ActionResult<unknown[]>> {
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

        // 3. Get assigned subjects
        const assignments = await prisma.facultySubject.findMany({
            where: { facultyId: facultyProfile.id },
            include: {
                subject: {
                    include: {
                        department: { select: { id: true, name: true, code: true } },
                        semester: {
                            include: { academicYear: { select: { id: true, year: true, name: true } } },
                        },
                    },
                },
            },
        })

        const subjects = assignments.map((a) => a.subject)

        return successResponse(subjects)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch subjects")
    }
}

/**
 * Get attendance for a subject on a specific date
 * FACULTY only - only assigned subjects
 */
export async function getSubjectAttendance(
    subjectId: string,
    date: string
): Promise<ActionResult<AttendanceRecord[]>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("FACULTY")

        // 2. Validate inputs
        const subjectValid = uuidSchema.safeParse(subjectId)
        if (!subjectValid.success) {
            return errorResponse("Invalid subject ID")
        }

        const attendanceDate = new Date(date)
        if (isNaN(attendanceDate.getTime())) {
            return errorResponse("Invalid date")
        }

        // 3. Get faculty profile
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        // 4. Check faculty is assigned to this subject
        const assignment = await prisma.facultySubject.findUnique({
            where: {
                facultyId_subjectId: {
                    facultyId: facultyProfile.id,
                    subjectId: subjectId,
                },
            },
        })

        if (!assignment) {
            return errorResponse("You are not assigned to this subject", "UNAUTHORIZED")
        }

        // 5. Get attendance records
        const records = await prisma.attendanceRecord.findMany({
            where: {
                subjectId: subjectId,
                date: attendanceDate,
            },
            include: {
                student: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
            orderBy: [{ period: "asc" }],
        })

        return successResponse(records)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch attendance")
    }
}

/**
 * Get students for a subject (for attendance marking)
 * FACULTY only - only assigned subjects
 */
export async function getSubjectStudents(
    subjectId: string
): Promise<ActionResult<unknown[]>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("FACULTY")

        // 2. Validate input
        const subjectValid = uuidSchema.safeParse(subjectId)
        if (!subjectValid.success) {
            return errorResponse("Invalid subject ID")
        }

        // 3. Get faculty profile
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        // 4. Check faculty is assigned to this subject
        const assignment = await prisma.facultySubject.findUnique({
            where: {
                facultyId_subjectId: {
                    facultyId: facultyProfile.id,
                    subjectId: subjectId,
                },
            },
        })

        if (!assignment) {
            return errorResponse("You are not assigned to this subject", "UNAUTHORIZED")
        }

        // 5. Get subject to find semester
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
        })

        if (!subject) {
            return errorResponse("Subject not found", "NOT_FOUND")
        }

        // 6. Get all students in the subject's semester and department
        const students = await prisma.studentProfile.findMany({
            where: {
                semesterId: subject.semesterId,
                departmentId: subject.departmentId,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { enrollmentNo: "asc" },
        })

        return successResponse(students)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch students")
    }
}

/**
 * Get attendance summary for a subject
 * FACULTY only
 */
export async function getSubjectAttendanceSummary(
    subjectId: string
): Promise<ActionResult<{ totalClasses: number; averageAttendance: number }>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("FACULTY")

        // 2. Validate input
        const subjectValid = uuidSchema.safeParse(subjectId)
        if (!subjectValid.success) {
            return errorResponse("Invalid subject ID")
        }

        // 3. Get faculty profile and verify assignment
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        const assignment = await prisma.facultySubject.findUnique({
            where: {
                facultyId_subjectId: {
                    facultyId: facultyProfile.id,
                    subjectId: subjectId,
                },
            },
        })

        if (!assignment) {
            return errorResponse("You are not assigned to this subject", "UNAUTHORIZED")
        }

        // 4. Get attendance stats
        const totalRecords = await prisma.attendanceRecord.count({
            where: { subjectId },
        })

        const presentRecords = await prisma.attendanceRecord.count({
            where: { subjectId, status: "PRESENT" },
        })

        // Get unique dates (classes)
        const uniqueDates = await prisma.attendanceRecord.groupBy({
            by: ["date"],
            where: { subjectId },
        })

        const avgAttendance = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0

        return successResponse({
            totalClasses: uniqueDates.length,
            averageAttendance: Math.round(avgAttendance * 100) / 100,
        })
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch summary")
    }
}
