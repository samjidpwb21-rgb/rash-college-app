// ============================================================================
// CAMPUSTRACK - MDC DEPARTMENT SELECTOR PAGE (SERVER COMPONENT)
// ============================================================================
// This page allows Admin to select which department's MDC courses to configure

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { MDCDepartmentSelector } from "@/components/admin/mdc-department-selector"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function MDCDepartmentSelectorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: homeDeptId } = await params

    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect(`/dashboard/${session.user.role.toLowerCase()}`)
    }

    // Fetch home department
    const homeDepartment = await prisma.department.findUnique({
        where: { id: homeDeptId },
        select: {
            id: true,
            name: true,
            code: true,
        },
    })

    if (!homeDepartment) {
        redirect("/dashboard/admin/departments")
    }

    // Fetch all departments (for MDC selection)
    const allDepartments = await prisma.department.findMany({
        select: {
            id: true,
            name: true,
            code: true,
            description: true,
        },
        orderBy: {
            name: "asc",
        },
    })

    // Filter out the home department - students can't take MDC from their own department
    const mdcDepartments = allDepartments.filter(dept => dept.id !== homeDeptId)

    const user = {
        name: session.user.name || "Admin User",
        email: session.user.email || "admin@university.edu",
        role: "System Administrator",
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />
            <div className="lg:ml-64">
                <DashboardHeader title="MDC Configuration" user={user} />
                <MDCDepartmentSelector
                    homeDepartment={homeDepartment}
                    departments={mdcDepartments}
                />
            </div>
        </div>
    )
}
