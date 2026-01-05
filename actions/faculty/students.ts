"use server"

// ============================================================================
// CAMPUSTRACK - FACULTY STUDENTS SERVER ACTIONS
// ============================================================================
// Faculty can view students of their assigned subjects only

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

interface StudentWithAttendance {
    id: string
    enrollmentNo: string
    user: {
        id: string
        name: string
        email: string
    }
    attendancePercentage?: number
}

/**
 * Get students for a subject
 * FACULTY only - must be assigned to the subject
 */
export async function getStudentsForSubject(
    subjectId: string
): Promise<ActionResult<StudentWithAttendance[]>> {
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

        // 5. Get subject to find semester/department
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
        })

        if (!subject) {
            return errorResponse("Subject not found", "NOT_FOUND")
        }

        // 6. Get students in the subject's semester and department
        const students = await prisma.studentProfile.findMany({
            where: {
                semesterId: subject.semesterId,
                departmentId: subject.departmentId,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, isActive: true },
                },
            },
            orderBy: { enrollmentNo: "asc" },
        })

        // 7. Get attendance stats for each student
        const studentIds = students.map((s) => s.id)

        const attendanceStats = await prisma.attendanceRecord.groupBy({
            by: ["studentId"],
            where: {
                subjectId: subjectId,
                studentId: { in: studentIds },
            },
            _count: { id: true },
        })

        const presentStats = await prisma.attendanceRecord.groupBy({
            by: ["studentId"],
            where: {
                subjectId: subjectId,
                studentId: { in: studentIds },
                status: "PRESENT",
            },
            _count: { id: true },
        })

        // Build stats map
        const totalMap = new Map(attendanceStats.map((s) => [s.studentId, s._count.id]))
        const presentMap = new Map(presentStats.map((s) => [s.studentId, s._count.id]))

        // 8. Combine student data with attendance
        const studentsWithAttendance: StudentWithAttendance[] = students
            .filter((s) => s.user.isActive)
            .map((s) => {
                const total = totalMap.get(s.id) || 0
                const present = presentMap.get(s.id) || 0
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0

                return {
                    id: s.id,
                    enrollmentNo: s.enrollmentNo,
                    user: s.user,
                    attendancePercentage: percentage,
                }
            })

        return successResponse(studentsWithAttendance)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch students")
    }
}

/**
 * Get student details with attendance history
 * FACULTY only - for their assigned subjects
 */
export async function getStudentAttendanceHistory(
    studentId: string,
    subjectId: string
): Promise<ActionResult<unknown>> {
    try {
        // 1. Validate session and role
        const user = await requireRole("FACULTY")

        // 2. Validate inputs
        const studentValid = uuidSchema.safeParse(studentId)
        const subjectValid = uuidSchema.safeParse(subjectId)

        if (!studentValid.success || !subjectValid.success) {
            return errorResponse("Invalid student or subject ID")
        }

        // 3. Get faculty profile
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: user.id },
        })

        if (!facultyProfile) {
            return errorResponse("Faculty profile not found", "NOT_FOUND")
        }

        // 4. Verify faculty assignment
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

        // 5. Get student details
        const student = await prisma.studentProfile.findUnique({
            where: { id: studentId },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        })

        if (!student) {
            return errorResponse("Student not found", "NOT_FOUND")
        }

        // 6. Get attendance history
        const attendance = await prisma.attendanceRecord.findMany({
            where: {
                studentId: studentId,
                subjectId: subjectId,
            },
            orderBy: [{ date: "desc" }, { period: "asc" }],
        })

        // 7. Calculate stats
        const totalRecords = attendance.length
        const presentRecords = attendance.filter((a) => a.status === "PRESENT").length
        const percentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

        return successResponse({
            student: {
                id: student.id,
                enrollmentNo: student.enrollmentNo,
                user: student.user,
            },
            stats: {
                total: totalRecords,
                present: presentRecords,
                absent: totalRecords - presentRecords,
                percentage,
            },
            records: attendance,
        })
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch attendance history")
    }
}
// ... existing code

/**
 * Get aggregated student data for the Students page
 * FACULTY only - All students from all assigned subjects
 */
export async function getFacultyStudentsPageData(): Promise<ActionResult<{
    stats: {
        total: number
        atRisk: number
        excellent: number
        avgAttendance: number
    }
    students: {
        id: string
        name: string
        email: string
        course: string
        section: string
        attendance: number
        status: "excellent" | "good" | "warning" | "critical"
        enrollmentNo: string
        avatar?: string | null
    }[]
}>> {
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

        // 3. Get all assigned subjects
        const assignments = await prisma.facultySubject.findMany({
            where: { facultyId: facultyProfile.id },
            include: {
                subject: {
                    select: { id: true, name: true, code: true, semesterId: true, departmentId: true }
                }
            }
        })

        if (assignments.length === 0) {
            return successResponse({
                stats: { total: 0, atRisk: 0, excellent: 0, avgAttendance: 0 },
                students: []
            })
        }

        const subjectIds = assignments.map(a => a.subject.id)
        const semesterIds = assignments.map(a => a.subject.semesterId)

        // 4. Get all students in these semesters
        // Note: Ideally we filter by enrollment in specific subjects if we had student-subject mapping
        // But assuming class-based system where students are in a semester/section
        const students = await prisma.studentProfile.findMany({
            where: {
                semesterId: { in: semesterIds }
            },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                semester: { include: { academicYear: true } },
                department: true,
            }
        })

        // 5. Calculate attendance for each student across ALL assigned subjects
        const attendanceRecords = await prisma.attendanceRecord.groupBy({
            by: ["studentId", "status"],
            where: {
                subjectId: { in: subjectIds },
                studentId: { in: students.map(s => s.id) }
            },
            _count: { id: true }
        })

        // Process attendance
        const studentStats = new Map<string, { total: number, present: number }>()

        attendanceRecords.forEach(record => {
            const current = studentStats.get(record.studentId) || { total: 0, present: 0 }
            current.total += record._count.id
            if (record.status === "PRESENT") {
                current.present += record._count.id
            }
            studentStats.set(record.studentId, current)
        })

        // 6. Shape the data
        const shapedStudents = students.map(student => {
            const stats = studentStats.get(student.id) || { total: 0, present: 0 }
            const attendance = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0 // Default to 0 if no records

            let status: "excellent" | "good" | "warning" | "critical" = "good"
            if (attendance >= 90) status = "excellent"
            else if (attendance >= 75) status = "good"
            else if (attendance >= 60) status = "warning"
            else status = "critical"

            // Find which course they are associated with (simplified: just picking first matching assigned subject)
            // In reality, a student might be in multiple subjects taught by this faculty.
            // For the row display, we might listing one or generic "Multiple"
            const relevantSubject = assignments.find(a => a.subject.semesterId === student.semesterId)?.subject

            return {
                id: student.id,
                name: student.user.name,
                email: student.user.email,
                avatar: student.user.avatar,
                course: relevantSubject ? relevantSubject.code : "N/A",
                section: "N/A", // Section not currently in schema
                attendance,
                status,
                enrollmentNo: student.enrollmentNo
            }
        })

        // 7. Calculate aggregate stats
        const totalUsers = shapedStudents.length
        const totalAvg = totalUsers > 0
            ? Math.round(shapedStudents.reduce((acc, s) => acc + s.attendance, 0) / totalUsers)
            : 0
        const atRisk = shapedStudents.filter(s => s.status === "warning" || s.status === "critical").length
        const excellent = shapedStudents.filter(s => s.status === "excellent").length

        return successResponse({
            stats: {
                total: totalUsers,
                atRisk,
                excellent,
                avgAttendance: totalAvg
            },
            students: shapedStudents
        })

    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Faculty access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch students data")
    }
}
