// ============================================================================
// CAMPUSTRACK - ADMIN DEPARTMENTS PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminDepartmentsData } from "@/actions/admin/pages"
import { AdminDepartmentsClient } from "@/components/dashboard/admin-departments-client"

export default async function DepartmentsPage() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch departments data
  const result = await getAdminDepartmentsData()

  if (!result.success) {
    return <AdminDepartmentsClient departments={[]} />
  }

  // 3. Render with real data
  return <AdminDepartmentsClient departments={result.data} />
}
