// ============================================================================
// CAMPUSTRACK - STUDENT DASHBOARD (SERVER COMPONENT)
// ============================================================================
// Fetches real data from database and passes to client component

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getStudentDashboardData } from "@/actions/dashboard"
import { StudentDashboardClient } from "@/components/dashboard/student-dashboard-client"

export default async function StudentDashboard() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "STUDENT") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch dashboard data
  const result = await getStudentDashboardData()

  if (!result.success) {
    // Handle error - show empty state
    const emptyData = {
      user: {
        name: session.user.name || "Student",
        email: session.user.email || "",
        departmentName: "Unknown",
        semesterNumber: 1,
      },
      stats: {
        overallAttendance: 0,
        classesToday: 0,
        totalSubjects: 0,
        classesAttended: 0,
        totalClasses: 0,
      },
      subjectAttendance: [],
      todaySchedule: [],
      currentCourses: [],
      dailyAttendance: [],
    }
    return <StudentDashboardClient data={emptyData} />
  }

  // 3. Render with real data
  return <StudentDashboardClient data={result.data} />
}
