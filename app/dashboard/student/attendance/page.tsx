// ============================================================================
// CAMPUSTRACK - STUDENT ATTENDANCE PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getStudentAttendancePageData } from "@/actions/student/attendance-page"
import { StudentAttendanceClient } from "@/components/dashboard/student-attendance-client"

export default async function MyAttendancePage() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "STUDENT") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch attendance data
  const result = await getStudentAttendancePageData()

  if (!result.success) {
    // Handle error - show empty state
    const emptyData = {
      user: {
        name: session.user.name || "Student",
        departmentName: "Unknown",
        semesterNumber: 1,
      },
      stats: {
        totalPresent: 0,
        totalAbsent: 0,
        attendanceRate: 0,
      },
      subjectStats: [],
      attendanceDates: { present: [], absent: [] },
      currentSemester: 1,
    }
    return <StudentAttendanceClient data={emptyData} />
  }

  // 3. Render with real data
  return <StudentAttendanceClient data={result.data} />
}
