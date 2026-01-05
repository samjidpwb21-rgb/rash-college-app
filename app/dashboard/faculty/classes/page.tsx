// ============================================================================
// CAMPUSTRACK - FACULTY CLASSES PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getFacultyClassesData } from "@/actions/faculty/classes-page"
import { FacultyClassesClient } from "@/components/dashboard/faculty-classes-client"

export default async function MyClassesPage() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "FACULTY") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch classes data
  const result = await getFacultyClassesData()

  if (!result.success) {
    return (
      <FacultyClassesClient
        user={{ name: session.user.name || "Faculty", departmentName: "Unknown", designation: "Faculty" }}
        subjects={[]}
        todayClasses={[]}
      />
    )
  }

  // 3. Render with real data
  return (
    <FacultyClassesClient
      user={result.data.user}
      subjects={result.data.subjects}
      todayClasses={result.data.todayClasses}
    />
  )
}
