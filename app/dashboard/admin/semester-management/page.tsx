/**
 * Semester Management Page (Server Component)
 * 
 * Admin-only page for managing semester progressions and batch transitions.
 * Fetches data server-side and passes to client component.
 */

import { requireRole } from "@/lib/auth"
import { getProgressionStats } from "@/actions/admin/semester-progression"
import { prisma } from "@/lib/db"
import SemesterManagementClient from "@/components/dashboard/admin-semester-management-client"

export const metadata = {
    title: "Semester Management | Admin Dashboard",
    description: "Manage student semester progressions and batch transitions",
}

export default async function SemesterManagementPage() {
    // Verify admin access
    await requireRole("ADMIN")

    // Fetch all semesters with academic year info
    const semesters = await prisma.semester.findMany({
        include: {
            academicYear: true,
        },
        orderBy: { number: 'asc' },
    })

    // Fetch all departments for filtering
    const departments = await prisma.department.findMany({
        orderBy: { name: 'asc' },
    })

    // Get progression statistics
    const statsResult = await getProgressionStats()
    const stats = statsResult.success ? statsResult.data : {
        semesterDistribution: [],
        pendingGraduations: 0,
    }

    return (
        <SemesterManagementClient
            semesters={semesters}
            departments={departments}
            initialStats={stats}
        />
    )
}
