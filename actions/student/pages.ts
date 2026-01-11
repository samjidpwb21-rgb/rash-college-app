"use server"

// ============================================================================
// CAMPUSTRACK - STUDENT SCHEDULE & COURSES PAGE QUERIES
// ============================================================================

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { getPeriodTimeDisplay } from "@/lib/period-times"

// ============================================================================
// SCHEDULE PAGE DATA
// ============================================================================

interface TimetableEntry {
    period: number
    time: string
    subject: string
    code: string
    faculty: string
    room: string | null
    type: "theory" | "lab"
}

interface SchedulePageData {
    user: {
        name: string
        departmentName: string
        semesterNumber: number
    }
    timetable: {
        Monday: TimetableEntry[]
        Tuesday: TimetableEntry[]
        Wednesday: TimetableEntry[]
        Thursday: TimetableEntry[]
        Friday: TimetableEntry[]
        Saturday: TimetableEntry[]
    }
}

// Period times now use centralized utility (lib/period-times.ts)

/**
 * Get student timetable for schedule page
 */
export async function getStudentScheduleData(): Promise<ActionResult<SchedulePageData>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "STUDENT") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                user: { select: { name: true } },
                department: { select: { name: true } },
                semester: { select: { number: true } },
            },
        })

        if (!studentProfile) {
            return errorResponse("Student profile not found", "NOT_FOUND")
        }

        // Get timetable entries
        const timetableEntries = await prisma.timetable.findMany({
            where: {
                semesterId: studentProfile.semesterId,
                departmentId: studentProfile.departmentId,
            },
            include: {
                subject: { select: { code: true, name: true, type: true } },
                faculty: {
                    include: { user: { select: { name: true } } },
                },
            },
            orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
        })

        // Group by day
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        const timetable: SchedulePageData["timetable"] = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
        }

        for (const entry of timetableEntries) {
            const dayName = dayNames[entry.dayOfWeek] as keyof typeof timetable
            if (dayName in timetable) {
                timetable[dayName].push({
                    period: entry.period,
                    time: getPeriodTimeDisplay(entry.dayOfWeek, entry.period),
                    subject: entry.subject.name,
                    code: entry.subject.code,
                    faculty: entry.faculty.user.name,
                    room: entry.room,
                    type: entry.subject.type === "PRACTICAL" ? "lab" : "theory",
                })
            }
        }

        return successResponse({
            user: {
                name: studentProfile.user.name,
                departmentName: studentProfile.department.name,
                semesterNumber: studentProfile.semester.number,
            },
            timetable,
        })
    } catch (error) {
        console.error("Schedule data error:", error)
        return errorResponse("Failed to load schedule")
    }
}

// ============================================================================
// COURSES PAGE DATA
// ============================================================================

interface CourseInfo {
    code: string
    name: string
    faculty: string
    semester: number
    progress?: number // Only for current semester
}

interface CoursesPageData {
    user: {
        name: string
        departmentName: string
        semesterNumber: number
    }
    currentSemester: number
    courses: CourseInfo[]
}

/**
 * Get student courses data
 */
export async function getStudentCoursesData(): Promise<ActionResult<CoursesPageData>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "STUDENT") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                user: { select: { name: true } },
                department: { select: { id: true, name: true } },
                semester: { select: { number: true } },
            },
        })

        if (!studentProfile) {
            return errorResponse("Student profile not found", "NOT_FOUND")
        }

        // Get all subjects for this department across all semesters
        const subjects = await prisma.subject.findMany({
            where: {
                departmentId: studentProfile.department.id,
            },
            include: {
                semester: { select: { number: true } },
                facultyAssigned: {
                    include: {
                        faculty: {
                            include: { user: { select: { name: true } } },
                        },
                    },
                },
            },
            orderBy: [{ semester: { number: "asc" } }, { code: "asc" }],
        })

        // Calculate progress for current semester courses
        const currentSemNumber = studentProfile.semester.number

        const courses: CourseInfo[] = await Promise.all(
            subjects.map(async (s) => {
                let progress: number | undefined

                if (s.semester.number === currentSemNumber) {
                    // Calculate progress based on attendance for current semester
                    const totalRecords = await prisma.attendanceRecord.count({
                        where: {
                            studentId: studentProfile.id,
                            subjectId: s.id,
                        },
                    })
                    // Estimate ~50 total classes per subject per semester
                    progress = Math.min(100, Math.round((totalRecords / 50) * 100))
                }

                return {
                    code: s.code,
                    name: s.name,
                    faculty: s.facultyAssigned[0]?.faculty.user.name || "TBA",
                    semester: s.semester.number,
                    progress,
                }
            })
        )

        return successResponse({
            user: {
                name: studentProfile.user.name,
                departmentName: studentProfile.department.name,
                semesterNumber: currentSemNumber,
            },
            currentSemester: currentSemNumber,
            courses,
        })
    } catch (error) {
        console.error("Courses data error:", error)
        return errorResponse("Failed to load courses")
    }
}
