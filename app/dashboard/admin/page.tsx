// ============================================================================
// CAMPUSTRACK - ADMIN DASHBOARD (SERVER COMPONENT)
// ============================================================================
// Fetches real data from database and passes to client component

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminDashboardData } from "@/actions/dashboard"
import { AdminDashboardClient } from "@/components/dashboard/admin-dashboard-client"

export default async function AdminDashboard() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch dashboard data
  const result = await getAdminDashboardData()

  if (!result.success) {
    // Handle error - show empty state
    const emptyData = {
      user: {
        name: session.user.name || "Admin",
        email: session.user.email || "admin@campustrack.edu",
        role: "System Administrator"
      },
      stats: {
        totalStudents: 0,
        totalFaculty: 0,
        totalSubjects: 0,
        totalDepartments: 0,
      },
      userDistribution: [
        { name: "Students", value: 0, color: "#3b82f6" },
        { name: "Faculty", value: 0, color: "#22c55e" },
        { name: "Admins", value: 0, color: "#f59e0b" },
      ],
      recentNotices: [],
      upcomingEvents: [],
    }
    return <AdminDashboardClient data={emptyData} />
  }

  // 3. Render with real data
  return <AdminDashboardClient data={result.data} />
}
