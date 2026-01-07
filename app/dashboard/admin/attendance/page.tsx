// ============================================================================
// CAMPUSTRACK - ADMIN ATTENDANCE PAGE (SERVER COMPONENT)
// ============================================================================
// Real data from database - no mock data

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import {
  getAttendanceStats,
  getDepartmentAttendanceData,
  getWeeklyAttendanceTrend,
  getLowAttendanceStudents,
  getRecentAttendanceRecords
} from "@/actions/admin/attendance-data"
import { AttendanceOverviewClient } from "@/components/dashboard/admin-attendance-client"

export default async function AdminAttendancePage() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch all real data
  const [statsResult, deptResult, trendResult, lowAttResult, recentResult] = await Promise.all([
    getAttendanceStats(),
    getDepartmentAttendanceData(),
    getWeeklyAttendanceTrend(),
    getLowAttendanceStudents(),
    getRecentAttendanceRecords()
  ])

  const stats = statsResult.success ? statsResult.data : null
  const departmentAttendance = deptResult.success ? deptResult.data : []
  const weeklyTrend = trendResult.success ? trendResult.data : []
  const lowAttendanceStudents = lowAttResult.success ? lowAttResult.data : []
  const recentRecords = recentResult.success ? recentResult.data : []

  // 3. Render with real data
  return (
    <AttendanceOverviewClient
      stats={stats}
      departmentAttendance={departmentAttendance}
      weeklyTrend={weeklyTrend}
      lowAttendanceStudents={lowAttendanceStudents}
      recentRecords={recentRecords}
    />
  )
}
