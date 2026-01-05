"use server"

// ============================================================================
// CAMPUSTRACK - ADMIN PAGE DATA QUERIES
// ============================================================================

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

// ============================================================================
// USERS PAGE DATA
// ============================================================================

export interface UserData {
    id: string
    name: string
    email: string
    role: "student" | "faculty" | "admin"
    department: string
    status: "active" | "inactive" | "suspended"
}

/**
 * Get all users for admin users page
 */
export async function getAdminUsersData(): Promise<ActionResult<UserData[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const users = await prisma.user.findMany({
            where: { deletedAt: null }, // Only fetch non-deleted users
            orderBy: [{ role: "asc" }, { name: "asc" }],
            include: {
                studentProfile: {
                    include: { department: { select: { name: true } } },
                },
                facultyProfile: {
                    include: { department: { select: { name: true } } },
                },
            },
        })

        return successResponse(
            users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role.toLowerCase() as "student" | "faculty" | "admin",
                department:
                    u.studentProfile?.department.name ||
                    u.facultyProfile?.department.name ||
                    "Administration",
                status: u.deletedAt
                    ? "suspended"
                    : u.isActive
                        ? "active"
                        : "inactive",
            }))
        )
    } catch (error) {
        console.error("Admin users error:", error)
        return errorResponse("Failed to load users")
    }
}

/**
 * Get single department details with faculty, students, and courses
 * ADMIN only
 */
export async function getAdminDepartmentDetails(id: string) {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return null
        }

        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                faculty: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                isActive: true,
                                deletedAt: true,
                            },
                        },
                    },
                },
                students: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                isActive: true,
                                deletedAt: true,
                            },
                        },
                        semester: {
                            select: {
                                number: true,
                                academicYear: {
                                    select: { year: true },
                                },
                            },
                        },
                    },
                },
                subjects: {
                    include: {
                        semester: {
                            select: { number: true },
                        },
                    },
                    orderBy: { code: "asc" },
                },
            },
        })

        return department
    } catch (error) {
        console.error("Admin department details error:", error)
        return null
    }
}

// ============================================================================
// DEPARTMENTS PAGE DATA
// ============================================================================

export interface DepartmentData {
    id: string
    code: string
    name: string
    head: string
    students: number
    faculty: number
    courses: number
    avgAttendance: number
    status: "active" | "inactive"
}

/**
 * Get all departments for admin departments page
 */
export async function getAdminDepartmentsData(): Promise<ActionResult<DepartmentData[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const departments = await prisma.department.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: {
                        students: true,
                        faculty: true,
                        subjects: true,
                    },
                },
            },
        })

        // Calculate avg attendance per department
        const result = await Promise.all(
            departments.map(async (d) => {
                // Get attendance stats for this department
                const studentIds = await prisma.studentProfile.findMany({
                    where: { departmentId: d.id },
                    select: { id: true },
                })

                const totalRecords = await prisma.attendanceRecord.count({
                    where: { studentId: { in: studentIds.map((s) => s.id) } },
                })
                const presentRecords = await prisma.attendanceRecord.count({
                    where: {
                        studentId: { in: studentIds.map((s) => s.id) },
                        status: "PRESENT",
                    },
                })
                const avgAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

                // Get department head (first faculty)
                const head = await prisma.facultyProfile.findFirst({
                    where: { departmentId: d.id },
                    include: { user: { select: { name: true } } },
                })

                return {
                    id: d.id,
                    code: d.code,
                    name: d.name,
                    head: head?.user.name || "TBA",
                    students: d._count.students,
                    faculty: d._count.faculty,
                    courses: d._count.subjects,
                    avgAttendance,
                    status: "active" as const,
                }
            })
        )

        return successResponse(result)
    } catch (error) {
        console.error("Admin departments error:", error)
        return errorResponse("Failed to load departments")
    }
}

// ============================================================================
// COURSES/SUBJECTS PAGE DATA
// ============================================================================

export interface SubjectData {
    id: string
    code: string
    name: string
    departmentName: string
    semester: number
    type: "theory" | "practical"
    facultyName: string
    credits: number
}

/**
 * Get all subjects for admin courses page
 */
export async function getAdminSubjectsData(): Promise<ActionResult<SubjectData[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const subjects = await prisma.subject.findMany({
            orderBy: [{ department: { name: "asc" } }, { semester: { number: "asc" } }, { code: "asc" }],
            include: {
                department: { select: { name: true } },
                semester: { select: { number: true } },
                facultyAssigned: {
                    include: {
                        faculty: {
                            include: { user: { select: { name: true } } },
                        },
                    },
                },
            },
        })

        return successResponse(
            subjects.map((s) => ({
                id: s.id,
                code: s.code,
                name: s.name,
                departmentName: s.department.name,
                semester: s.semester.number,
                type: s.type.toLowerCase() as "theory" | "practical",
                facultyName: s.facultyAssigned[0]?.faculty.user.name || "TBA",
                credits: s.credits,
            }))
        )
    } catch (error) {
        console.error("Admin subjects error:", error)
        return errorResponse("Failed to load subjects")
    }
}

// ============================================================================
// ADMIN NOTICES PAGE DATA
// ============================================================================

export interface AdminNoticeData {
    id: string
    title: string
    content: string
    isImportant: boolean
    publishedAt: Date
    authorName: string
    type: "ACADEMIC" | "EVENT" | "EXAM" | "GENERAL"
    department?: { id: string; name: string; code: string } | null
    imageUrl?: string | null
}

/**
 * Get all notices for admin notices page
 */
export async function getAdminNoticesPageData(): Promise<ActionResult<AdminNoticeData[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const notices = await prisma.notice.findMany({
            orderBy: [{ isImportant: "desc" }, { publishedAt: "desc" }],
            include: {
                author: { select: { name: true } },
                department: { select: { id: true, name: true, code: true } },
            },
        })

        return successResponse(
            notices.map((n) => ({
                id: n.id,
                title: n.title,
                content: n.content,
                isImportant: n.isImportant,
                publishedAt: n.publishedAt,
                authorName: n.author.name,
                type: n.type,
                department: n.department,
                imageUrl: n.imageUrl,
            }))
        )
    } catch (error) {
        console.error("Admin notices error:", error)
        return errorResponse("Failed to load notices")
    }
}

// ============================================================================
// ADMIN EVENTS PAGE DATA
// ============================================================================

export interface AdminEventData {
    id: string
    title: string
    description: string | null
    eventDate: Date
    location: string | null
    isAllDay: boolean
    authorName: string
}

/**
 * Get all events for admin events page
 */
export async function getAdminEventsPageData(): Promise<ActionResult<AdminEventData[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const events = await prisma.event.findMany({
            orderBy: { eventDate: "desc" },
            include: {
                author: { select: { name: true } },
            },
        })

        return successResponse(
            events.map((e) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                eventDate: e.eventDate,
                location: e.location,
                isAllDay: e.isAllDay,
                authorName: e.author.name,
            }))
        )
    } catch (error) {
        console.error("Admin events error:", error)
        return errorResponse("Failed to load events")
    }
}
