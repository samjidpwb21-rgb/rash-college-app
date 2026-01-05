// ============================================================================
// CAMPUSTRACK - ADMIN DEPARTMENT TIMETABLE PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { AdminDepartmentTimetableClient } from "@/components/dashboard/admin-department-timetable-client"

export default async function DepartmentTimetablePage({ params }: { params: Promise<{ id: string }> }) {
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
            academicYearId: true,
        },
    })

    // 4. Get current academic year (first year for now)
    const currentAcademicYear = await prisma.academicYear.findFirst({
        orderBy: { year: "asc" },
        select: {
            id: true,
            year: true,
        },
    })

    const user = {
        name: session.user.name || "Admin User",
        email: session.user.email || "admin@university.edu",
        role: "System Administrator",
    }

    return (
        <AdminDepartmentTimetableClient
            department={department}
            semesters={semesters}
            currentAcademicYear={currentAcademicYear}
            user={user}
        />
    )
}
