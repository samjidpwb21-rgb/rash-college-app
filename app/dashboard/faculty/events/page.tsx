// ============================================================================
// CAMPUSTRACK - FACULTY EVENTS PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { FacultyEventsClient } from "@/components/dashboard/faculty-events-client"

export default async function FacultyEventsPage() {
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
        include: { department: { select: { name: true } } },
    })

    // 3. Fetch events data
    const events = await prisma.event.findMany({
        orderBy: { eventDate: "asc" },
        include: {
            author: { select: { name: true } },
        },
    })

    const mappedEvents = events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description || "",
        date: e.eventDate,
        time: e.eventTime?.toISOString().split("T")[1]?.substring(0, 5) || undefined,
        location: e.location || "TBA",
        isAllDay: e.isAllDay,
    }))

    const user = {
        name: session.user.name || "Faculty",
        departmentName: facultyProfile?.department.name || "Unknown",
    }

    // 4. Render with real data
    return <FacultyEventsClient events={mappedEvents} user={user} />
}
