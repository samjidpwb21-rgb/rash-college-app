// ============================================================================
// CAMPUSTRACK - STUDENT EVENTS PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { getEventsPageData } from "@/actions/shared/pages"

// Since the events page has complex calendar UI with modals,
// we'll pass the data and let the existing client component patterns work
// This is a minimal server component wrapper

async function getStudentEventsData() {
    const events = await prisma.event.findMany({
        orderBy: { eventDate: "asc" },
        include: {
            author: { select: { name: true } },
        },
    })

    return events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description || "",
        date: e.eventDate,
        time: e.eventTime?.toISOString().split("T")[1]?.substring(0, 5) || undefined,
        location: e.location || "TBA",
        isAllDay: e.isAllDay,
    }))
}

export default async function StudentEventsPage() {
    // 1. Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "STUDENT") {
        redirect(`/dashboard/${session.user.role.toLowerCase()}`)
    }

    // 2. Fetch events - data available for client hydration
    const events = await getStudentEventsData()

    // 3. Import the events client dynamically to preserve existing complex UI
    // For now, redirect to a simplified version or use the original with data injection
    const { StudentEventsClient } = await import("@/components/dashboard/student-events-client")

    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        include: { department: { select: { name: true } } },
    })

    return (
        <StudentEventsClient
            events={events}
            user={{
                name: session.user.name || "Student",
                departmentName: studentProfile?.department.name || "Unknown",
            }}
        />
    )
}
