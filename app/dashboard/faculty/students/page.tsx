import { getFacultyStudentsPageData } from "@/actions/faculty/students"
import { FacultyStudentsClient } from "@/components/dashboard/faculty-students-client"
import { FacultyStudentsPageWrapper } from "@/components/dashboard/faculty-students-page-wrapper"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function StudentsPage() {
  const session = await getSession()
  if (!session?.user || session.user.role !== "FACULTY") {
    redirect("/login")
  }

  const result = await getFacultyStudentsPageData()

  // Default empty state if fetch fails or no data
  const initialData = result.success ? result.data : {
    stats: { total: 0, atRisk: 0, excellent: 0, avgAttendance: 0 },
    students: []
  }

  return (
    <FacultyStudentsPageWrapper user={session.user}>
      <FacultyStudentsClient initialData={initialData} />
    </FacultyStudentsPageWrapper>
  )
}
