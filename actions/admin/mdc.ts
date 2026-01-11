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

        if (data.semester < 1 || data.semester > 8) {
            return errorResponse("Semester must be between 1 and 8")
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
// UPDATE MDC COURSE FACULTY (From Timetable)
// ============================================================================

export async function updateMDCCourseFaculty(
    departmentId: string,
    semester: number,
    facultyId: string
): Promise<ActionResult<void>> {
    try {
        const session = await getSession()

        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        // Find MDC course where this department OFFERS the MDC
        const mdcCourse = await prisma.mDCCourse.findFirst({
            where: {
                mdcDepartmentId: departmentId,  // The department that OFFERS this MDC
                semester: semester,
            },
        })

        if (!mdcCourse) {
            return errorResponse("No MDC course found for this department and semester")
        }

        // Update the faculty assignment
        await prisma.mDCCourse.update({
            where: { id: mdcCourse.id },
            data: { facultyId },
        })

        return successResponse(undefined)
    } catch (error) {
        console.error("Error updating MDC course faculty:", error)
        return errorResponse("Failed to update MDC faculty")
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

// ============================================================================
// GET MDC COURSE FOR TIMETABLE (Auto-fill)
// ============================================================================

export async function getMDCCourseForTimetable(
    departmentId: string,
    semester: number
): Promise<
    ActionResult<{
        courseName: string
        subjectId: string | null
        facultyId: string | null
        facultyName: string | null
    } | null>
> {
    try {
        const session = await getSession()

        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        // Get department info to build MDC course name
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            select: { name: true, code: true },
        })

        if (!department) {
            return errorResponse("Department not found")
        }

        // Find MDC subject that belongs to this department for this semester
        // MDC subjects have isMDC: true flag set when created
        const mdcSubject = await prisma.subject.findFirst({
            where: {
                departmentId: departmentId,
                isMDC: true,
                semester: {
                    number: semester,
                },
            },
            select: {
                id: true,
                name: true,
            },
        })

        if (mdcSubject) {
            // Found MDC subject for this department
            // Check if there's a faculty already assigned via MDCCourse
            const mdcCourse = await prisma.mDCCourse.findFirst({
                where: {
                    mdcDepartmentId: departmentId,
                    semester: semester,
                },
                select: {
                    facultyId: true,
                    faculty: {
                        select: {
                            user: { select: { name: true } },
                        },
                    },
                },
            })

            return successResponse({
                courseName: mdcSubject.name,
                subjectId: mdcSubject.id,
                facultyId: mdcCourse?.facultyId || null,
                facultyName: mdcCourse?.faculty?.user.name || null,
            })
        }

        // Fallback: Look for any MDC course where this dept is the provider
        const mdcCourse = await prisma.mDCCourse.findFirst({
            where: {
                mdcDepartmentId: departmentId,
                semester: semester,
            },
            select: {
                id: true,
                courseName: true,
                facultyId: true,
                faculty: {
                    select: {
                        user: { select: { name: true } },
                    },
                },
            },
        })

        if (mdcCourse) {
            return successResponse({
                courseName: mdcCourse.courseName,
                subjectId: null,
                facultyId: mdcCourse.facultyId,
                facultyName: mdcCourse.faculty?.user.name || null,
            })
        }

        // No MDC found - return null to indicate no MDC is configured
        return successResponse(null)
    } catch (error) {
        console.error("Error fetching MDC course for timetable:", error)
        return errorResponse("Failed to fetch MDC course")
    }
}
