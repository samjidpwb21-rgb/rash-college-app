// ============================================================================
// CAMPUSTRACK - STUDENT COURSES PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getStudentCoursesData } from "@/actions/student/pages"
import { StudentCoursesClient } from "@/components/dashboard/student-courses-client"

export default async function MyCoursesPage() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "STUDENT") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch courses data
  const result = await getStudentCoursesData()

  if (!result.success) {
    return (
      <StudentCoursesClient
        user={{ name: session.user.name || "Student", departmentName: "Unknown", semesterNumber: 1 }}
        currentSemester={1}
        courses={[]}
      />
    )
  }

  // 3. Render with real data
  return (
    <StudentCoursesClient
      user={result.data.user}
      currentSemester={result.data.currentSemester}
      courses={result.data.courses}
    />
  )
}
