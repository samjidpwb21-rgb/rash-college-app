import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const {
            courseCode,
            courseName,
            section,
            date,
            timeSlot,
            classType,
            room,
            students,
            facultyId
        } = body

        // Validate required fields
        if (!courseCode || !section || !date || !students || students.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // In a real implementation, this would:
        // 1. Check if attendance already exists for this class/date/time
        // 2. Update if exists, create if not
        // 3. Save to database using Prisma or your ORM

        // For now, simulate successful save
        // You would replace this with actual database operations
        const attendanceRecord = {
            id: Date.now().toString(),
            courseCode,
            courseName,
            section,
            date,
            timeSlot,
            classType,
            room,
            facultyId: facultyId || "faculty-1", // Default for demo
            students: students.map((student: any) => ({
                rollNo: student.rollNo,
                name: student.name,
                status: student.status
            })),
            presentCount: students.filter((s: any) => s.status === "present" || s.status === "late").length,
            absentCount: students.filter((s: any) => s.status === "absent").length,
            totalStudents: students.length,
            attendancePercentage: Math.round(
                (students.filter((s: any) => s.status === "present" || s.status === "late").length / students.length) * 100
            ),
            submittedAt: new Date().toISOString()
        }

        // Store in localStorage for persistence across page reloads (demo purposes)
        // In production, this would be stored in your database

        return NextResponse.json({
            success: true,
            message: "Attendance submitted successfully",
            data: attendanceRecord
        }, { status: 200 })

    } catch (error) {
        console.error("Error submitting attendance:", error)
        return NextResponse.json(
            { error: "Failed to submit attendance" },
            { status: 500 }
        )
    }
}
