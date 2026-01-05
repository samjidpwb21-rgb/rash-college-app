// ============================================================================
// CAMPUSTRACK - FACULTY SCHEDULE PAGE (SERVER COMPONENT)
// ============================================================================

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { FacultyScheduleClient } from "@/components/dashboard/faculty-schedule-client"

const PERIOD_TIMES = [
  "9:00 AM - 9:50 AM",
  "10:00 AM - 10:50 AM",
  "11:00 AM - 11:50 AM",
  "12:00 PM - 12:50 PM",
  "2:00 PM - 2:50 PM",
]

export default async function FacultySchedulePage() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "FACULTY") {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`)
  }

  // 2. Get faculty profile
  const faculty = await prisma.facultyProfile.findUnique({
    where: { userId: session.user.id },
    include: { department: true },
  })

  if (!faculty) {
    redirect("/login")
  }

  // 3. Fetch timetable
  const timetableEntries = await prisma.timetable.findMany({
    where: { facultyId: faculty.id },
    include: {
      subject: true,
      semester: {
        include: {
          students: true, // To count students per class
        },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
  })

  // 4. Transform data for client
  const dayMap: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  }

  type TimetableData = {
    Monday: any[]
    Tuesday: any[]
    Wednesday: any[]
    Thursday: any[]
    Friday: any[]
    Saturday: any[]
  }

  const timetable: TimetableData = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  }

  for (const entry of timetableEntries) {
    const dayName = dayMap[entry.dayOfWeek] as keyof TimetableData
    if (dayName) {
      timetable[dayName].push({
        period: entry.period,
        time: PERIOD_TIMES[entry.period - 1] || `Period ${entry.period}`,
        subject: entry.subject.name,
        code: entry.subject.code,
        students: entry.semester?.students.length || 0,
        room: entry.room,
      })
    }
  }

  return (
    <FacultyScheduleClient
      user={{
        name: session.user.name || "Faculty",
        departmentName: faculty.department.name,
      }}
      timetable={timetable}
    />
  )
}
