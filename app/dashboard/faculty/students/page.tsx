import { getFacultyStudentsPageData } from "@/actions/faculty/students"
import { FacultyStudentsClient } from "@/components/dashboard/faculty-students-client"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
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
    <div className="min-h-screen bg-slate-900">
      <DashboardSidebar role="faculty" />

      <div className="lg:ml-64">
        <DashboardHeader title="Students" user={session.user} />

        <main className="p-6">
          <FacultyStudentsClient initialData={initialData} />
        </main>
      </div>
    </div>
  )
}
