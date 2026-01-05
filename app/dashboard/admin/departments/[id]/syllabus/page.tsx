// ============================================================================
// CAMPUSTRACK - ADMIN SYLLABUS MANAGEMENT PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { AdminSyllabusManagerClient } from "@/components/dashboard/admin-syllabus-manager-client"

export default async function SyllabusManagementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // 1. Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect(`/dashboard/${session.user.role.toLowerCase()}`)
    }

    // 2. Fetch department data
    const department = await prisma.department.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            code: true,
        },
    })

    if (!department) {
        redirect("/dashboard/admin/departments")
    }

    // 3. Fetch all semesters
    const semesters = await prisma.semester.findMany({
        orderBy: { number: "asc" },
        select: {
            id: true,
            number: true,
            name: true,
        },
    })

    // 4. Fetch existing syllabi
    const syllabi = await prisma.syllabus.findMany({
        where: { departmentId: id },
        include: {
            semester: {
                select: {
                    id: true,
                    number: true,
                    name: true,
                },
            },
        },
        orderBy: {
            semester: {
                number: "asc",
            },
        },
    })

    const user = {
        name: session.user.name || "Admin User",
        email: session.user.email || "admin@university.edu",
        role: "System Administrator",
    }

    return (
        <AdminSyllabusManagerClient
            department={department}
            semesters={semesters}
            initialSyllabi={syllabi}
            user={user}
        />
    )
}
