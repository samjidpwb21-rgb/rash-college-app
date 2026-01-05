// ============================================================================
// CAMPUSTRACK - FACULTY NOTICES PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { getNoticesPageData } from "@/actions/shared/pages"
import { FacultyNoticesClient } from "@/components/dashboard/faculty-notices-client"

export default async function FacultyNoticesPage() {
    // 1. Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "FACULTY") {
        redirect(`/dashboard/${session.user.role.toLowerCase()}`)
    }

    // 2. Get faculty profile
    const facultyProfile = await prisma.facultyProfile.findUnique({
        where: { userId: session.user.id },
        include: { department: { select: { id: true, name: true } } },
    })

    // 3. Fetch notices data
    const result = await getNoticesPageData()

    const user = {
        name: session.user.name || "Faculty",
        departmentName: facultyProfile?.department.name || "Unknown",
        departmentId: facultyProfile?.department.id || "",  // Auto-assigned to notices
    }

    if (!result.success) {
        return <FacultyNoticesClient notices={[]} user={user} />
    }

    // 4. Render with real data
    return <FacultyNoticesClient notices={result.data} user={user} />
}
