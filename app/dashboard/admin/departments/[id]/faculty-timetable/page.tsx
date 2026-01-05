// ============================================================================
// CAMPUSTRACK - ADMIN FACULTY TIMETABLE PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { AdminFacultyTimetableClient } from "@/components/dashboard/admin-faculty-timetable-client"

export default async function FacultyTimetablePage({ params }: { params: Promise<{ id: string }> }) {
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

    // 3. Fetch faculty members from this department
    const faculty = await prisma.facultyProfile.findMany({
        where: {
            departmentId: id,
            user: {
                deletedAt: null,
                isActive: true,
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            user: {
                name: "asc",
            },
        },
    })

    const user = {
        name: session.user.name || "Admin User",
        email: session.user.email || "admin@university.edu",
        role: "System Administrator",
    }

    return (
        <AdminFacultyTimetableClient
            department={department}
            facultyList={faculty}
            user={user}
        />
    )
}
