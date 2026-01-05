// ============================================================================
// CAMPUSTRACK - STUDENT NOTICES PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { getNoticesPageData } from "@/actions/shared/pages"
import { StudentNoticesClient } from "@/components/dashboard/student-notices-client"

export default async function StudentNoticesPage() {
    // 1. Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "STUDENT") {
        redirect(`/dashboard/${session.user.role.toLowerCase()}`)
    }

    // 2. Get student profile for header
    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        include: { department: { select: { name: true } } },
    })

    // 3. Fetch notices data
    const result = await getNoticesPageData()

    const user = {
        name: session.user.name || "Student",
        departmentName: studentProfile?.department.name || "Unknown",
    }

    if (!result.success) {
        return <StudentNoticesClient notices={[]} user={user} />
    }

    // 4. Render with real data
    return <StudentNoticesClient notices={result.data} user={user} />
}
