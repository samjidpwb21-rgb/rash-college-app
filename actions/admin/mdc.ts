"use server"

// ============================================================================
// CAMPUSTRACK - MDC ADMIN ACTIONS
// ============================================================================
// Server actions for MDC course management (Admin only)

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

// ============================================================================
// CREATE OR UPDATE MDC COURSE
// ============================================================================

interface CreateOrUpdateMDCCourseData {
    homeDepartmentId: string
    mdcDepartmentId: string
    year: number
    semester: number
    courseName: string
    studentIds: string[]
    facultyId: string | null
}

export async function createOrUpdateMDCCourse(
    data: CreateOrUpdateMDCCourseData
): Promise<ActionResult<{ id: string }>> {
    try {
        const session = await getSession()

        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        // Validate inputs
        if (!data.courseName.trim()) {
            return errorResponse("Course name is required")
        }

        if (data.year < 1 || data.year > 4) {
            return errorResponse("Year must be between 1 and 4")
        }

        if (data.semester < 1 || data.semester > 2) {
            return errorResponse("Semester must be 1 or 2")
        }

        if (data.studentIds.length === 0) {
            return errorResponse("At least one student must be selected")
        }

        // Check if MDC course already exists for this combo
        const existing = await prisma.mDCCourse.findUnique({
            where: {
                homeDepartmentId_mdcDepartmentId_year_semester: {
                    homeDepartmentId: data.homeDepartmentId,
                    mdcDepartmentId: data.mdcDepartmentId,
                    year: data.year,
                    semester: data.semester,
                },
            },
        })

        let result

        if (existing) {
            // Update existing course
            result = await prisma.mDCCourse.update({
                where: { id: existing.id },
                data: {
                    courseName: data.courseName.trim(),
                    studentIds: data.studentIds,
                    facultyId: data.facultyId || null,
                },
            })
        } else {
            // Create new course
            result = await prisma.mDCCourse.create({
                data: {
                    courseName: data.courseName.trim(),
                    homeDepartmentId: data.homeDepartmentId,
                    mdcDepartmentId: data.mdcDepartmentId,
                    year: data.year,
                    semester: data.semester,
                    studentIds: data.studentIds,
                    facultyId: data.facultyId || null,
                },
            })
        }

        // Revalidate the configuration page
        revalidatePath(`/dashboard/admin/departments/${data.homeDepartmentId}/mdc/${data.mdcDepartmentId}`)

        return successResponse({ id: result.id })
    } catch (error) {
        console.error("Error creating/updating MDC course:", error)
        return errorResponse("Failed to save MDC course")
    }
}

// ============================================================================
// DELETE MDC COURSE
// ============================================================================

export async function deleteMDCCourse(id: string): Promise<ActionResult<void>> {
    try {
        const session = await getSession()

        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        await prisma.mDCCourse.delete({
            where: { id },
        })

        return successResponse(undefined)
    } catch (error) {
        console.error("Error deleting MDC course:", error)
        return errorResponse("Failed to delete MDC course")
    }
}

// ============================================================================
// GET MDC COURSES FOR FACULTY
// ============================================================================

export async function getMDCCoursesForFaculty(facultyId: string): Promise<
    ActionResult<
        Array<{
            id: string
            courseName: string
            year: number
            semester: number
            studentCount: number
            homeDepartment: {
                name: string
                code: string
            }
            mdcDepartment: {
                name: string
                code: string
            }
        }>
    >
> {
    try {
        const session = await getSession()

        if (!session?.user || session.user.role !== "FACULTY") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const courses = await prisma.mDCCourse.findMany({
            where: {
                facultyId,
            },
            select: {
                id: true,
                courseName: true,
                year: true,
                semester: true,
                studentIds: true,
                homeDepartment: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
                mdcDepartment: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: [{ year: "asc" }, { semester: "asc" }],
        })

        const formattedCourses = courses.map((course) => ({
            id: course.id,
            courseName: course.courseName,
            year: course.year,
            semester: course.semester,
            studentCount: course.studentIds.length,
            homeDepartment: course.homeDepartment,
            mdcDepartment: course.mdcDepartment,
        }))

        return successResponse(formattedCourses)
    } catch (error) {
        console.error("Error fetching MDC courses for faculty:", error)
        return errorResponse("Failed to fetch MDC courses")
    }
}

// ============================================================================
// GET MDC STUDENTS FOR ATTENDANCE
// ============================================================================

export async function getMDCStudentsForAttendance(courseId: string): Promise<
    ActionResult<
        Array<{
            id: string
            name: string
            enrollmentNo: string
            email: string
        }>
    >
> {
    try {
        const session = await getSession()

        if (!session?.user || session.user.role !== "FACULTY") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        // Get MDC course
        const course = await prisma.mDCCourse.findUnique({
            where: { id: courseId },
            select: {
                studentIds: true,
                facultyId: true,
            },
        })

        if (!course) {
            return errorResponse("MDC course not found", "NOT_FOUND")
        }

        // Verify faculty is assigned to this course
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        })

        if (!facultyProfile || course.facultyId !== facultyProfile.id) {
            return errorResponse("You are not assigned to this MDC course", "FORBIDDEN")
        }

        // Fetch student details
        const students = await prisma.studentProfile.findMany({
            where: {
                id: { in: course.studentIds },
            },
            select: {
                id: true,
                enrollmentNo: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                user: { name: "asc" },
            },
        })

        const formattedStudents = students.map((s) => ({
            id: s.id,
            name: s.user.name,
            enrollmentNo: s.enrollmentNo,
            email: s.user.email,
        }))

        return successResponse(formattedStudents)
    } catch (error) {
        console.error("Error fetching MDC students:", error)
        return errorResponse("Failed to fetch students")
    }
}
