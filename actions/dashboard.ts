"use server"

// ============================================================================
// CAMPUSTRACK - DASHBOARD DATA QUERIES
// ============================================================================
// Centralized queries for dashboard pages (read-only)

import { prisma } from "@/lib/db"
import { getCurrentUser, getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { getPeriodTimeDisplay } from "@/lib/period-times"
import { getDailyAttendanceStatus, DailyAttendanceBlock } from "@/actions/daily-attendance"

// ============================================================================
// STUDENT DASHBOARD QUERIES
// ============================================================================

interface StudentDashboardData {
  user: {
    name: string
    email: string
    avatar?: string | null
    departmentName: string
    semesterNumber: number
  }
  stats: {
    overallAttendance: number
    classesToday: number
    totalSubjects: number
    classesAttended: number
    totalClasses: number
  }
  subjectAttendance: Array<{
    code: string
    name: string
    present: number
    total: number
    percentage: number
  }>
  todaySchedule: Array<{
    period: number
    time: string
    subject: string
    room: string | null
    faculty: string
  }>
  currentCourses: Array<{
    code: string
    name: string
    faculty: string
    progress: number
  }>
  dailyAttendance: DailyAttendanceBlock[]
}

/**
 * Get all data needed for student dashboard
 */
export async function getStudentDashboardData(): Promise<ActionResult<StudentDashboardData>> {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "STUDENT") {
      return errorResponse("Unauthorized", "UNAUTHORIZED")
    }

    // Get student profile with all relations
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        department: { select: { name: true } },
        semester: {
          include: { academicYear: true }
        },
      },
    })

    if (!studentProfile) {
      return errorResponse("Student profile not found", "NOT_FOUND")
    }

    // Get today's day of week
    const today = new Date()
    const dayOfWeek = today.getDay() // 0=Sunday
    today.setHours(0, 0, 0, 0)

    // Get subjects for current semester
    const subjects = await prisma.subject.findMany({
      where: {
        semesterId: studentProfile.semesterId,
        departmentId: studentProfile.departmentId,
      },
      include: {
        facultyAssigned: {
          include: {
            faculty: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
    })

    // Get today's timetable
    let todaySchedule: StudentDashboardData["todaySchedule"] = []
    if (dayOfWeek !== 0) { // No classes on Sunday
      const timetable = await prisma.timetable.findMany({
        where: {
          semesterId: studentProfile.semesterId,
          departmentId: studentProfile.departmentId,
          dayOfWeek: dayOfWeek,
        },
        include: {
          subject: { select: { code: true, name: true } },
          faculty: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { period: "asc" },
      })

      // Period times now use centralized utility with Friday support
      todaySchedule = timetable.map((t) => ({
        period: t.period,
        time: getPeriodTimeDisplay(dayOfWeek, t.period),
        subject: t.subject.name,
        room: t.room,
        faculty: t.faculty.user.name,
      }))
    }

    // Get attendance stats
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: studentProfile.id,
        semesterId: studentProfile.semesterId,
      },
      include: {
        subject: { select: { id: true, code: true, name: true } },
      },
    })

    const totalClasses = attendanceRecords.length
    const presentClasses = attendanceRecords.filter((r) => r.status === "PRESENT").length
    const overallAttendance = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

    // Calculate per-subject attendance
    const subjectStats = new Map<string, { code: string; name: string; present: number; total: number }>()
    for (const record of attendanceRecords) {
      const key = record.subjectId
      if (!subjectStats.has(key)) {
        subjectStats.set(key, {
          code: record.subject.code,
          name: record.subject.name,
          present: 0,
          total: 0,
        })
      }
      const stat = subjectStats.get(key)!
      stat.total++
      if (record.status === "PRESENT") stat.present++
    }

    const subjectAttendance = Array.from(subjectStats.values()).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }))

    // Current courses with faculty
    const currentCourses = subjects.map((s) => ({
      code: s.code,
      name: s.name,
      faculty: s.facultyAssigned[0]?.faculty.user.name || "TBA",
      progress: subjectAttendance.find(sa => sa.code === s.code)?.percentage || 0,
    }))

    // Get today's daily attendance status (5 periods)
    const dailyAttendance = await getDailyAttendanceStatus(studentProfile.id)

    return successResponse({
      user: {
        name: studentProfile.user.name,
        email: studentProfile.user.email,
        avatar: studentProfile.user.avatar,
        departmentName: studentProfile.department.name,
        semesterNumber: studentProfile.semester.number,
      },
      stats: {
        overallAttendance,
        classesToday: todaySchedule.length,
        totalSubjects: subjects.length,
        classesAttended: presentClasses,
        totalClasses,
      },
      subjectAttendance,
      todaySchedule,
      currentCourses,
      dailyAttendance,
    })
  } catch (error) {
    console.error("Student dashboard error:", error)
    return errorResponse("Failed to load dashboard data")
  }
}

// ============================================================================
// FACULTY DASHBOARD QUERIES
// ============================================================================

interface FacultyDashboardData {
  user: {
    name: string
    email: string
    avatar?: string | null
    departmentName: string
    designation: string
    facultyId: string  // For MDC course queries
  }
  stats: {
    totalSubjects: number
    totalStudents: number
    classesToday: number
    attendanceMarkedToday: number
  }
  todayClasses: Array<{
    period: number
    time: string
    subjectId: string      // Added for period view
    subjectCode: string    // Added for period view
    subjectName: string    // Renamed from 'subject'
    room: string | null
    semester: number
    studentCount: number
    attendanceMarked: boolean
  }>
  subjects: Array<{
    id: string
    code: string
    name: string
    semester: number
  }>
  weeklyTimetable: Array<{
    id: string
    dayOfWeek: number
    period: number
    room: string | null
    subject: {
      name: string
      code: string
    }
    semester: {
      number: number
    }
  }>
}

/**
 * Get all data needed for faculty dashboard
 */
export async function getFacultyDashboardData(): Promise<ActionResult<FacultyDashboardData>> {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "FACULTY") {
      return errorResponse("Unauthorized", "UNAUTHORIZED")
    }

    // Get faculty profile
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
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

    // Get today's timetable
    const today = new Date()
    const dayOfWeek = today.getDay()
    today.setHours(0, 0, 0, 0)

    let todayClasses: FacultyDashboardData["todayClasses"] = []
    if (dayOfWeek !== 0) {
      const timetable = await prisma.timetable.findMany({
        where: {
          facultyId: facultyProfile.id,
          dayOfWeek: dayOfWeek,
        },
        include: {
          subject: { select: { id: true, code: true, name: true } },
          semester: { select: { number: true } },
        },
        orderBy: { period: "asc" },
      })

      // Period times use centralized utility with Friday support

      // Check which classes have attendance marked today
      const markedSubjects = await prisma.attendanceRecord.findMany({
        where: {
          markedBy: facultyProfile.id,
          date: today,
        },
        select: { subjectId: true },
        distinct: ["subjectId"],
      })
      const markedSet = new Set(markedSubjects.map((m) => m.subjectId))

      todayClasses = await Promise.all(
        timetable.map(async (t) => {
          // Count students in this semester/department
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
            semester: t.semester.number,
            studentCount,
            attendanceMarked: markedSet.has(t.subjectId),
          }
        })
      )
    }

    // Count total students across all assigned subjects
    const subjectIds = facultyProfile.subjectsAssigned.map((sa) => sa.subjectId)
    const studentCount = await prisma.studentProfile.count({
      where: {
        semester: {
          subjects: {
            some: { id: { in: subjectIds } },
          },
        },
      },
    })

    // Count attendance marked today
    const attendanceMarkedToday = await prisma.attendanceRecord.count({
      where: {
        markedBy: facultyProfile.id,
        date: today,
      },
    })

    const subjects = facultyProfile.subjectsAssigned.map((sa) => ({
      id: sa.subject.id,
      code: sa.subject.code,
      name: sa.subject.name,
      semester: sa.subject.semester.number,
    }))

    // Get full weekly timetable for faculty
    const weeklyTimetable = await prisma.timetable.findMany({
      where: {
        facultyId: facultyProfile.id,
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
        semester: {
          select: {
            number: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: 'asc' },
      ],
    })

    return successResponse({
      user: {
        name: facultyProfile.user.name,
        email: facultyProfile.user.email,
        avatar: facultyProfile.user.avatar,
        departmentName: facultyProfile.department.name,
        designation: facultyProfile.designation,
        facultyId: facultyProfile.id,  // For MDC queries
      },
      stats: {
        totalSubjects: subjectIds.length,
        totalStudents: studentCount,
        classesToday: todayClasses.length,
        attendanceMarkedToday,
      },
      todayClasses,
      subjects,
      weeklyTimetable,
    })
  } catch (error) {
    console.error("Faculty dashboard error:", error)
    return errorResponse("Failed to load dashboard data")
  }
}

// ============================================================================
// ADMIN DASHBOARD QUERIES
// ============================================================================

interface AdminDashboardData {
  user: {
    name: string
    email: string
    avatar?: string | null
    role: string
  }
  stats: {
    totalStudents: number
    totalFaculty: number
    totalSubjects: number
    totalDepartments: number
  }
  userDistribution: Array<{
    name: string
    value: number
    color: string
  }>
  recentNotices: Array<{
    id: string
    title: string
    publishedAt: Date
    isImportant: boolean
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    eventDate: Date
    location: string | null
  }>
}

/**
 * Get all data needed for admin dashboard
 */
export async function getAdminDashboardData(): Promise<ActionResult<AdminDashboardData>> {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return errorResponse("Unauthorized", "UNAUTHORIZED")
    }

    // Count users by role
    const [studentCount, facultyCount, adminCount] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { role: "FACULTY", isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { role: "ADMIN", isActive: true, deletedAt: null } }),
    ])

    // Count subjects and departments
    const [subjectCount, departmentCount] = await Promise.all([
      prisma.subject.count(),
      prisma.department.count(),
    ])

    // Get recent notices
    const recentNotices = await prisma.notice.findMany({
      take: 5,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        isImportant: true,
      },
    })

    // Get upcoming events
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const upcomingEvents = await prisma.event.findMany({
      where: { eventDate: { gte: today } },
      take: 5,
      orderBy: { eventDate: "asc" },
      select: {
        id: true,
        title: true,
        eventDate: true,
        location: true,
      },
    })

    return successResponse({
      user: {
        name: session.user.name || "Admin",
        email: session.user.email || "admin@campustrack.edu",
        avatar: session.user.avatar,
        role: "System Administrator"
      },
      stats: {
        totalStudents: studentCount,
        totalFaculty: facultyCount,
        totalSubjects: subjectCount,
        totalDepartments: departmentCount,
      },
      userDistribution: [
        { name: "Students", value: studentCount, color: "#3b82f6" },
        { name: "Faculty", value: facultyCount, color: "#22c55e" },
        { name: "Admins", value: adminCount, color: "#f59e0b" },
      ],
      recentNotices,
      upcomingEvents,
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    return errorResponse("Failed to load dashboard data")
  }
}
