// ============================================================================
// CAMPUSTRACK - ADMIN ANALYTICS PAGE (SERVER COMPONENT)
// ============================================================================
// Real data from database - no mock data

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import {
  getAnalyticsStats,
  getSemesterTrendData,
  getDepartmentComparisonData,
  getAttendanceByDayData,
  getAttendanceDistributionData,
  getHourlyPatternData
} from "@/actions/admin/analytics-data"
import { AnalyticsClient } from "@/components/dashboard/admin-analytics-client"

export default async function AnalyticsPage() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch all real analytics data
  const [statsResult, trendResult, deptResult, dayResult, distResult, hourlyResult] = await Promise.all([
    getAnalyticsStats(),
    getSemesterTrendData(),
    getDepartmentComparisonData(),
    getAttendanceByDayData(),
    getAttendanceDistributionData(),
    getHourlyPatternData()
  ])

  const stats = statsResult.success ? statsResult.data : null
  const semesterTrend = trendResult.success ? trendResult.data : []
  const departmentComparison = deptResult.success ? deptResult.data : []
  const attendanceByDay = dayResult.success ? dayResult.data : []
  const attendanceDistribution = distResult.success ? distResult.data : []
  const hourlyPattern = hourlyResult.success ? hourlyResult.data : []

  // 3. Render with real data
  return (
    <AnalyticsClient
      stats={stats}
      semesterTrend={semesterTrend}
      departmentComparison={departmentComparison}
      attendanceByDay={attendanceByDay}
      attendanceDistribution={attendanceDistribution}
      hourlyPattern={hourlyPattern}
    />
  )
}
