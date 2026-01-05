import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Seeding database...")

    // Clear existing data
    console.log("Clearing existing data...")
    await prisma.notification.deleteMany()
    await prisma.attendanceRecord.deleteMany()
    await prisma.timetable.deleteMany()
    await prisma.facultySubject.deleteMany()
    await prisma.subject.deleteMany()
    await prisma.studentProfile.deleteMany()
    await prisma.facultyProfile.deleteMany()
    await prisma.semester.deleteMany()
    await prisma.academicYear.deleteMany()
    await prisma.department.deleteMany()
    await prisma.event.deleteMany()
    await prisma.notice.deleteMany()
    await prisma.user.deleteMany()

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash("admin123", 10)
    const facultyPasswordHash = await bcrypt.hash("faculty123", 10)
    const studentPasswordHash = await bcrypt.hash("student123", 10)

    // Create Admin
    const admin = await prisma.user.create({
        data: {
            email: "admin@university.edu",
            passwordHash: adminPasswordHash,
            name: "Admin User",
            role: "ADMIN",
            isActive: true,
        },
    })
    console.log("✅ Admin:", admin.email)

    // Create Department
    const csDept = await prisma.department.create({
        data: {
            code: "CS",
            name: "Computer Science",
        },
    })
    console.log("✅ Department:", csDept.name)

    // Create Academic Years (1-4)
    const academicYears = await Promise.all(
        [
            { year: 1, name: "First Year" },
            { year: 2, name: "Second Year" },
            { year: 3, name: "Third Year" },
            { year: 4, name: "Fourth Year" },
        ].map((y) =>
            prisma.academicYear.create({
                data: { year: y.year, name: y.name },
            })
        )
    )
    console.log("✅ Academic Years: 4")

    // Create Semesters (1-8)
    const semesters = await Promise.all(
        [1, 2, 3, 4, 5, 6, 7, 8].map((num) =>
            prisma.semester.create({
                data: {
                    number: num,
                    name: `Semester ${num}`,
                    isOdd: num % 2 === 1,
                    academicYearId: academicYears[Math.floor((num - 1) / 2)].id,
                },
            })
        )
    )
    console.log("✅ Semesters: 8")

    const currentSemester = semesters[4] // Semester 5 (3rd year, 1st sem)
    const currentYear = academicYears[2] // 3rd year

    // Create Faculty
    const facultyUser = await prisma.user.create({
        data: {
            email: "faculty@university.edu",
            passwordHash: facultyPasswordHash,
            name: "Dr. Sarah Wilson",
            role: "FACULTY",
            isActive: true,
        },
    })

    const faculty = await prisma.facultyProfile.create({
        data: {
            userId: facultyUser.id,
            employeeId: "FAC001",
            departmentId: csDept.id,
            designation: "Professor",
        },
    })
    console.log("✅ Faculty:", facultyUser.name)

    // Create Student
    const studentUser = await prisma.user.create({
        data: {
            email: "student@university.edu",
            passwordHash: studentPasswordHash,
            name: "Alex Johnson",
            role: "STUDENT",
            isActive: true,
        },
    })

    const student = await prisma.studentProfile.create({
        data: {
            userId: studentUser.id,
            enrollmentNo: "STU2024001",
            departmentId: csDept.id,
            semesterId: currentSemester.id,
        },
    })
    console.log("✅ Student:", studentUser.name)

    // Create Subjects
    const subjects = await Promise.all(
        [
            { code: "CS301", name: "Data Structures", credits: 4 },
            { code: "CS302", name: "Database Systems", credits: 4 },
            { code: "CS303", name: "Web Development", credits: 3 },
            { code: "CS304", name: "Operating Systems", credits: 4 },
            { code: "CS305", name: "Networks", credits: 3 },
        ].map((s) =>
            prisma.subject.create({
                data: {
                    code: s.code,
                    name: s.name,
                    credits: s.credits,
                    departmentId: csDept.id,
                    semesterId: currentSemester.id,
                    type: "THEORY",
                },
            })
        )
    )
    console.log("✅ Subjects: 5")

    // Assign faculty
    await Promise.all(
        subjects.map((s) =>
            prisma.facultySubject.create({
                data: { facultyId: faculty.id, subjectId: s.id },
            })
        )
    )
    console.log("✅ Faculty assigned to subjects")

    // Create Timetable (Mon-Fri)
    for (let day = 1; day <= 5; day++) {
        for (let period = 1; period <= 5; period++) {
            await prisma.timetable.create({
                data: {
                    dayOfWeek: day,
                    period: period,
                    subjectId: subjects[(period - 1 + day) % 5].id,
                    facultyId: faculty.id,
                    semesterId: currentSemester.id,
                    departmentId: csDept.id,
                    academicYearId: currentYear.id,
                    room: `Room ${100 + period}`,
                },
            })
        }
    }
    console.log("✅ Timetable created")

    // Sample attendance (last 10 days)
    const today = new Date()
    for (let i = 0; i < 10; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        for (const subject of subjects.slice(0, 3)) {
            for (let period = 1; period <= 2; period++) {
                await prisma.attendanceRecord.create({
                    data: {
                        studentId: student.id,
                        subjectId: subject.id,
                        date: date,
                        period: period,
                        status: Math.random() > 0.2 ? "PRESENT" : "ABSENT",
                        semesterId: currentSemester.id,
                        markedBy: faculty.id,
                    },
                })
            }
        }
    }
    console.log("✅ Attendance records created")

    // Sample notice
    await prisma.notice.create({
        data: {
            title: "Welcome to New Semester",
            content: "Classes start January 2nd. Check your schedules.",
            authorId: admin.id,
            isImportant: true,
            publishedAt: new Date(),
        },
    })
    console.log("✅ Notice created")

    // Sample event
    await prisma.event.create({
        data: {
            title: "Orientation Day",
            description: "Annual orientation for new students.",
            eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            location: "Main Auditorium",
            authorId: admin.id,
            isAllDay: true,
        },
    })
    console.log("✅ Event created")

    console.log(`
🎉 Seeding complete!

Test Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Admin:    admin@university.edu    / admin123
👨‍🏫 Faculty:  faculty@university.edu / faculty123
🎓 Student:  student@university.edu  / student123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
