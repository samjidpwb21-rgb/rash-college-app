// ============================================================================
// CAMPUSTRACK - ADMIN USERS PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminUsersData } from "@/actions/admin/pages"
import { AdminUsersClient } from "@/components/dashboard/admin-users-client"

export default async function UsersPage() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Fetch users data
  const result = await getAdminUsersData()

  if (!result.success) {
    return <AdminUsersClient users={[]} />
  }

  // 3. Render with real data
  return <AdminUsersClient users={result.data} />
}
