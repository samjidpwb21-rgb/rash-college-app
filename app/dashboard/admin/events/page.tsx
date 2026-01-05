// ============================================================================
// CAMPUSTRACK - ADMIN EVENTS PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminEventsPageData } from "@/actions/admin/pages"
import { AdminEventsClient } from "@/components/dashboard/admin-events-client"

export default async function AdminEventsPage() {
    // 1. Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect(`/dashboard/${session.user.role.toLowerCase()}`)
    }

    // 2. Fetch events data
    const result = await getAdminEventsPageData()

    if (!result.success) {
        return <AdminEventsClient events={[]} />
    }

    // 3. Render with real data
    return <AdminEventsClient events={result.data} />
}
