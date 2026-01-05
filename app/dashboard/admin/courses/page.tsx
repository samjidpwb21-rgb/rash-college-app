// ============================================================================
// CAMPUSTRACK - ADMIN COURSES PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminSubjectsData } from "@/actions/admin/pages"
import { getDepartments } from "@/actions/admin/departments"
import { AdminCoursesClient } from "@/components/dashboard/admin-courses-client"
import { prisma } from "@/lib/db"

export default async function CoursesPage() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch subjects data
  const result = await getAdminSubjectsData()

  // 3. Fetch departments
  const deptResult = await getDepartments()

  // 4. Fetch semesters directly (since no action exists)
  const semesters = await prisma.semester.findMany({
    orderBy: { number: "asc" },
    include: {
      academicYear: { select: { year: true } },
    },
  })

  const semesterOptions = semesters.map((s) => ({
    id: s.id,
    number: s.number,
    name: s.name,
    year: s.academicYear.year,
  }))

  const departmentOptions = deptResult.success && deptResult.data
    ? deptResult.data.map((d) => ({ id: d.id, name: d.name, code: d.code }))
    : []

  if (!result.success) {
    return <AdminCoursesClient subjects={[]} departments={departmentOptions} semesters={semesterOptions} />
  }

  // 5. Render with real data
  return <AdminCoursesClient subjects={result.data} departments={departmentOptions} semesters={semesterOptions} />
}
