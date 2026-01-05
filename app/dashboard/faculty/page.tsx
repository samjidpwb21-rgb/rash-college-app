// ============================================================================
// CAMPUSTRACK - FACULTY DASHBOARD (SERVER COMPONENT)
// ============================================================================
// Fetches real data from database and passes to client component

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getFacultyDashboardData } from "@/actions/dashboard"
import FacultyWrapper from "./wrapper"

export default async function FacultyDashboard() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "FACULTY") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch dashboard data
  const result = await getFacultyDashboardData()

  if (!result.success) {
    // Handle error - show empty state
    const emptyData = {
      user: {
        name: session.user.name || "Faculty",
        email: session.user.email || "",
        departmentName: "Unknown",
        designation: "Faculty",
        facultyId: "unknown",
      },
      stats: {
        totalSubjects: 0,
        totalStudents: 0,
        classesToday: 0,
        attendanceMarkedToday: 0,
      },
      todayClasses: [],
      subjects: [],
    }
    return (
      <Suspense fallback={null}>
        <FacultyWrapper data={emptyData} />
      </Suspense>
    )
  }

  // 3. Render with real data
  return (
    <Suspense fallback={null}>
      <FacultyWrapper data={result.data} />
    </Suspense>
  )
}
