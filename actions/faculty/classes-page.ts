"use server"

// ============================================================================
// CAMPUSTRACK - FACULTY CLASSES PAGE QUERIES
// ============================================================================

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { getPeriodTimeDisplay } from "@/lib/period-times"
import { sendPushToUser } from "@/lib/push-notifications"

interface FacultyClassesData {
    user: {
        name: string
        departmentName: string
        designation: string
    }
    subjects: Array<{
        id: string
        code: string
        name: string
        semester: number
        totalStudents: number
        avgAttendance: number
    }>
    todayClasses: Array<{
        period: number
        time: string
        subjectId: string
        subjectCode: string
        subjectName: string
        room: string | null
        studentCount: number
        attendanceMarked: boolean
        semester: number // Added for period view
    }>
}

/**
 * Get faculty classes page data
 */
export async function getFacultyClassesData(): Promise<ActionResult<FacultyClassesData>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "FACULTY") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                user: { select: { name: true } },
                department: { select: { name: true } },
                subjectsAssigned: {
                    include: {
                        subject: {
                            include: { semester: true },
                        },
                    },
                },
            },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dayOfWeek = today.getDay()

        // Get subjects with student counts and attendance
        const subjects = await Promise.all(
            facultyProfile.subjectsAssigned.map(async (sa) => {
                // Count students in this semester/department
                const studentCount = await prisma.studentProfile.count({
                    where: {
                        semesterId: sa.subject.semesterId,
                        departmentId: sa.subject.departmentId,
                    },
                })

                // Calculate average attendance
                const totalRecords = await prisma.attendanceRecord.count({
                    where: { subjectId: sa.subjectId },
                })
                const presentRecords = await prisma.attendanceRecord.count({
                    where: { subjectId: sa.subjectId, status: "PRESENT" },
                })
                const avgAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

                return {
                    id: sa.subject.id,
                    code: sa.subject.code,
                    name: sa.subject.name,
                    semester: sa.subject.semester.number,
                    totalStudents: studentCount,
                    avgAttendance,
                }
            })
        )

        // Get today's timetable
        let todayClasses: FacultyClassesData["todayClasses"] = []
        if (dayOfWeek !== 0) {
            const timetable = await prisma.timetable.findMany({
                where: {
                    facultyId: facultyProfile.id,
                    dayOfWeek: dayOfWeek,
                },
                include: {
                    subject: { select: { id: true, code: true, name: true } },
                    semester: { select: { number: true } }, // Added for period view
                },
                orderBy: { period: "asc" },
            })

            const markedSubjects = await prisma.attendanceRecord.findMany({
                where: {
                    markedBy: facultyProfile.id,
                    date: today,
                },
                select: { subjectId: true },
                distinct: ["subjectId"],
            })
            const markedSet = new Set(markedSubjects.map((m) => m.subjectId))

            // Period times use centralized utility with Friday support

            todayClasses = await Promise.all(
                timetable.map(async (t) => {
                    const studentCount = await prisma.studentProfile.count({
                        where: {
                            semesterId: t.semesterId,
                            departmentId: t.departmentId,
                        },
                    })

                    return {
                        period: t.period,
                        time: getPeriodTimeDisplay(dayOfWeek, t.period),
                        subjectId: t.subject.id,
                        subjectCode: t.subject.code,
                        subjectName: t.subject.name,
                        room: t.room,
                        studentCount,
                        attendanceMarked: markedSet.has(t.subjectId),
                        semester: t.semester.number, // Added for period view
                    }
                })
            )
        }

        return successResponse({
            user: {
                name: facultyProfile.user.name,
                departmentName: facultyProfile.department.name,
                designation: facultyProfile.designation,
            },
            subjects,
            todayClasses,
        })
    } catch (error) {
        console.error("Faculty classes error:", error)
        return errorResponse("Failed to load classes data")
    }
}

interface SubjectStudent {
    id: string
    enrollmentNo: string
    name: string
    attendancePercent: number
}

/**
 * Get students for a subject (for attendance marking)
 */
export async function getStudentsForAttendance(subjectId: string): Promise<ActionResult<SubjectStudent[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "FACULTY") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: session.user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        // Verify faculty is assigned to this subject
        const assignment = await prisma.facultySubject.findUnique({
            where: {
                facultyId_subjectId: {
                    facultyId: facultyProfile.id,
                    subjectId: subjectId,
                },
            },
        })

        if (!assignment) {
            return errorResponse("Not assigned to this subject", "FORBIDDEN")
        }

        // Get subject details
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
        })

        if (!subject) {
            return errorResponse("Subject not found", "NOT_FOUND")
        }

        // Get students in this semester/department
        const students = await prisma.studentProfile.findMany({
            where: {
                semesterId: subject.semesterId,
                departmentId: subject.departmentId,
            },
            include: {
                user: { select: { name: true } },
            },
            orderBy: { enrollmentNo: "asc" },
        })

        // Calculate attendance for each student
        const result = await Promise.all(
            students.map(async (s) => {
                const total = await prisma.attendanceRecord.count({
                    where: { studentId: s.id, subjectId },
                })
                const present = await prisma.attendanceRecord.count({
                    where: { studentId: s.id, subjectId, status: "PRESENT" },
                })

                return {
                    id: s.id,
                    enrollmentNo: s.enrollmentNo,
                    name: s.user.name,
                    attendancePercent: total > 0 ? Math.round((present / total) * 100) : 0,
                }
            })
        )

        return successResponse(result)
    } catch (error) {
        console.error("Students for attendance error:", error)
        return errorResponse("Failed to load students")
    }
}

interface AttendanceSubmission {
    subjectId: string
    date: string // ISO date string
    records: Array<{
        studentId: string
        period: number
        status: "PRESENT" | "ABSENT"
    }>
}

/**
 * Submit attendance for all 5 periods
 */
export async function submitAttendance(data: AttendanceSubmission): Promise<ActionResult<{ count: number }>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "FACULTY") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: session.user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        // Verify faculty is assigned to this subject
        const assignment = await prisma.facultySubject.findUnique({
            where: {
                facultyId_subjectId: {
                    facultyId: facultyProfile.id,
                    subjectId: data.subjectId,
                },
            },
        })

        if (!assignment) {
            return errorResponse("Not assigned to this subject", "FORBIDDEN")
        }

        const attendanceDate = new Date(data.date)
        attendanceDate.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (attendanceDate > today) {
            return errorResponse("Cannot mark attendance for future dates")
        }

        // Get subject for semesterId
        const subject = await prisma.subject.findUnique({
            where: { id: data.subjectId },
        })

        if (!subject) {
            return errorResponse("Subject not found", "NOT_FOUND")
        }

        // Upsert all records
        const upsertPromises = data.records.map((record) =>
            prisma.attendanceRecord.upsert({
                where: {
                    studentId_subjectId_date_period: {
                        studentId: record.studentId,
                        subjectId: data.subjectId,
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
                    subjectId: data.subjectId,
                    date: attendanceDate,
                    period: record.period,
                    status: record.status,
                    markedBy: facultyProfile.id,
                    semesterId: subject.semesterId,
                },
            })
        )

        await prisma.$transaction(upsertPromises)

        // Create in-app notifications for students
        const uniqueStudents = [...new Set(data.records.map((r) => r.studentId))]
        const notificationPromises = uniqueStudents.map(async (studentId) => {
            const student = await prisma.studentProfile.findUnique({
                where: { id: studentId },
                select: { userId: true },
            })

            if (student) {
                return prisma.notification.create({
                    data: {
                        userId: student.userId,
                        type: "ATTENDANCE",
                        title: "Attendance Updated",
                        message: `Your attendance for ${subject.name} on ${attendanceDate.toLocaleDateString()} has been marked.`,
                        link: "/dashboard/student/attendance",
                    },
                })
            }
        })

        const createdNotifications = await Promise.all(notificationPromises.filter(Boolean))

        // NEW: Send push notifications (additive, non-blocking)
        // This runs in the background and doesn't affect the response
        Promise.all(
            uniqueStudents.map(async (studentId) => {
                const student = await prisma.studentProfile.findUnique({
                    where: { id: studentId },
                    select: { userId: true },
                })
                if (student) {
                    await sendPushToUser(student.userId, {
                        title: "Attendance Updated",
                        message: `Your attendance for ${subject.name} on ${attendanceDate.toLocaleDateString()} has been marked.`,
                        link: "/dashboard/student/attendance",
                        type: "ATTENDANCE",
                    })
                }
            })
        ).catch((error) => {
            // Log push errors but don't fail the request
            console.error('[Push] Error sending attendance push notifications:', error)
        })

        return successResponse({ count: data.records.length })
    } catch (error) {
        console.error("Submit attendance error:", error)
        return errorResponse("Failed to submit attendance")
    }
}

/**
 * Get existing attendance for a subject on a date (for editing)
 */
export async function getExistingAttendance(
    subjectId: string,
    dateStr: string
): Promise<ActionResult<Map<string, Map<number, "PRESENT" | "ABSENT">>>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "FACULTY") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: session.user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)

        const records = await prisma.attendanceRecord.findMany({
            where: {
                subjectId,
                date,
                markedBy: facultyProfile.id,
            },
        })

        // Convert to nested map: studentId -> period -> status
        const result = new Map<string, Map<number, "PRESENT" | "ABSENT">>()
        for (const r of records) {
            if (!result.has(r.studentId)) {
                result.set(r.studentId, new Map())
            }
            result.get(r.studentId)!.set(r.period, r.status)
        }

        // Convert Maps to serializable format
        const serializable = Object.fromEntries(
            Array.from(result.entries()).map(([k, v]) => [k, Object.fromEntries(v)])
        )

        return successResponse(serializable as any)
    } catch (error) {
        console.error("Get existing attendance error:", error)
        return errorResponse("Failed to load existing attendance")
    }
}
