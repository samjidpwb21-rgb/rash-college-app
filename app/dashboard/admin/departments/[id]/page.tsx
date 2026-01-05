// ============================================================================
// CAMPUSTRACK - ADMIN DEPARTMENT DETAILS PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminDepartmentDetails } from "@/actions/admin/pages"
import { AdminDepartmentDetailsClient } from "@/components/dashboard/admin-department-details-client"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // 1. Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect(`/dashboard/${session.user.role.toLowerCase()}`)
    }

    const user = {
        name: session.user.name || "Admin User",
        email: session.user.email || "admin@university.edu",
        role: "System Administrator",
    }

    // 2. Fetch department data
    const department = await getAdminDepartmentDetails(id)

    // 3. Handle case where department doesn't exist
    if (!department) {
        return (
            <div className="min-h-screen bg-slate-900">
                <DashboardSidebar role="admin" />
                <div className="lg:ml-64">
                    <DashboardHeader title="Department Not Found" user={user} />
                    <main className="p-6">
                        <Card>
                            <CardContent className="p-6 text-center space-y-4">
                                <p className="text-muted-foreground">Department not found.</p>
                                <Link href="/dashboard/admin/departments">
                                    <Button>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Departments
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div>
        )
    }

    // 4. Render with real data
    return <AdminDepartmentDetailsClient department={department} user={user} />
}
