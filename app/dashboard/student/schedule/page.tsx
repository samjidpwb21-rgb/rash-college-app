// ============================================================================
// CAMPUSTRACK - STUDENT SCHEDULE PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getStudentScheduleData } from "@/actions/student/pages"
import { StudentScheduleClient } from "@/components/dashboard/student-schedule-client"

export default async function ClassSchedulePage() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "STUDENT") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch schedule data
  const result = await getStudentScheduleData()

  if (!result.success) {
    return (
      <StudentScheduleClient
        user={{ name: session.user.name || "Student", departmentName: "Unknown", semesterNumber: 1 }}
        timetable={{ Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] }}
      />
    )
  }

  // 3. Render with real data
  return <StudentScheduleClient user={result.data.user} timetable={result.data.timetable} />
}
