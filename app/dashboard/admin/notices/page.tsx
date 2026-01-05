// ============================================================================
// CAMPUSTRACK - ADMIN NOTICES PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminNoticesPageData } from "@/actions/admin/pages"
import { AdminNoticesClient } from "@/components/dashboard/admin-notices-client"

export default async function AdminNoticesPage() {
    // 1. Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect(`/dashboard/${session.user.role.toLowerCase()}`)
    }

    // 2. Fetch notices data
    const result = await getAdminNoticesPageData()

    if (!result.success) {
        return <AdminNoticesClient notices={[]} />
    }

    // 3. Render with real data
    return <AdminNoticesClient notices={result.data} />
}
