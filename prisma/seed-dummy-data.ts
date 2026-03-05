import { PrismaClient, Role, AttendanceStatus, SubjectType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper to generate a random number between min and max (inclusive)
function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

// Generate an array of dates roughly representing the last 90 days, excluding weekends
function getLast90DaysWeekdays() {
    const dates: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start roughly 90 days ago
    const currentDate = new Date(today)
    currentDate.setDate(currentDate.getDate() - 90)

    while (currentDate <= today) {
        const day = currentDate.getDay()
        // 0 = Sunday, 6 = Saturday
        if (day !== 0 && day !== 6) {
            dates.push(new Date(currentDate))
        }
        currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
}

async function main() {
    console.log("Starting safe dummy data generation...")

    // 1. Fetch existing departments
    const departments = await prisma.department.findMany()
    if (departments.length === 0) {
        console.log("No departments found. Please run the base seed script first.")
        return
    }

    console.log(`Found ${departments.length} departments.`)

    // 2. Ensure Academic Years and Semesters exist
    let academicYears = await prisma.academicYear.findMany()
    if (academicYears.length === 0) {
        console.log("Creating Academic Years and Semesters...")
        for (let y = 1; y <= 4; y++) {
            const names = ["First Year", "Second Year", "Third Year", "Fourth Year"]
            const year = await prisma.academicYear.create({
                data: {
                    year: y,
                    name: names[y - 1],
                }
            })

            await prisma.semester.create({
                data: {
                    number: y * 2 - 1,
                    name: `Semester ${y * 2 - 1}`,
                    isOdd: true,
                    academicYearId: year.id
                }
            })
            await prisma.semester.create({
                data: {
                    number: y * 2,
                    name: `Semester ${y * 2}`,
                    isOdd: false,
                    academicYearId: year.id
                }
            })
        }
        academicYears = await prisma.academicYear.findMany()
    }
    const semesters = await prisma.semester.findMany()
    const targetSemesters = semesters.filter(s => [1, 3, 5].includes(s.number))

    // Default password for all dummy users
    const defaultPasswordStr = "password123"
    const defaultPasswordHash = await bcrypt.hash(defaultPasswordStr, 10)

    // Data tracking for summary
    let totalStudentsAdded = 0
    let totalFacultyAdded = 0
    let totalSubjectsCreated = 0
    let totalTimetableCreated = 0
    let totalAttendanceGenerated = 0

    // Generate data per department
    for (const dept of departments) {
        console.log(`\nprocessing department: ${dept.name} (${dept.code})`)

        // --- FACULTY GENERATION ---
        const existingFacultyCount = await prisma.facultyProfile.count({ where: { departmentId: dept.id } })
        const facultyToCreate = Math.max(0, 5 - existingFacultyCount)
        const currentFaculty = await prisma.facultyProfile.findMany({ where: { departmentId: dept.id } })
        const facultyIds = currentFaculty.map(f => f.id)
        const facultyUserIds = currentFaculty.map(f => f.userId)

        if (facultyToCreate > 0) {
            console.log(`Generating ${facultyToCreate} faculty for ${dept.code}...`)
            for (let i = 0; i < facultyToCreate; i++) {
                const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
                const empId = `F${dept.code.replace(/\s+/g, '')}${randomStr}${i}`.substring(0, 20)
                const email = `fac_${empId.toLowerCase()}@university.edu`

                let result;
                try {
                    result = await prisma.$transaction(async (tx) => {
                        let user = await tx.user.findUnique({ where: { email } })
                        if (!user) {
                            user = await tx.user.create({
                                data: {
                                    email,
                                    passwordHash: defaultPasswordHash,
                                    name: `Prof. Dummy ${empId}`,
                                    role: Role.FACULTY,
                                }
                            })
                        }
                        let faculty = await tx.facultyProfile.findUnique({ where: { userId: user.id } })
                        if (!faculty) {
                            faculty = await tx.facultyProfile.create({
                                data: {
                                    userId: user.id,
                                    employeeId: empId,
                                    designation: ["Assistant Professor", "Associate Professor", "Professor"][randomInt(0, 2)],
                                    departmentId: dept.id,
                                    phone: "9876543210",
                                }
                            })
                            return faculty
                        }
                        return null
                    })
                } catch (e: any) {
                    console.error("FACULTY CRASH:", e.code, e.meta, e.message)
                    throw e
                }

                if (result) {
                    facultyIds.push(result.id)
                    facultyUserIds.push(result.userId)
                    totalFacultyAdded++
                }
            }
        }

        // --- SUBJECT GENERATION ---
        // For semesters 1, 3, 5
        const deptSubjects = []
        for (const sem of targetSemesters) {
            const existingSubjectsCount = await prisma.subject.count({ where: { departmentId: dept.id, semesterId: sem.id } })
            const subjectsToCreate = Math.max(0, 5 - existingSubjectsCount)

            if (subjectsToCreate > 0) {
                console.log(`Generating ${subjectsToCreate} subjects for ${dept.code} Sem ${sem.number}...`)
                for (let i = 0; i < subjectsToCreate; i++) {
                    const code = `${dept.code}${sem.number}0${i + existingSubjectsCount + 1}`

                    const newSubj = await prisma.subject.create({
                        data: {
                            code,
                            name: `${dept.name} Subject ${code}`,
                            credits: randomInt(3, 4),
                            departmentId: dept.id,
                            semesterId: sem.id,
                            type: SubjectType.THEORY
                        }
                    })
                    totalSubjectsCreated++

                    // Assign 1-2 faculty
                    const assignedFacultyId = Math.random() < 0.5 && facultyIds.length > 0 ? facultyIds[0] : (facultyIds[1] || facultyIds[0])
                    if (assignedFacultyId) {
                        await prisma.facultySubject.create({
                            data: {
                                subjectId: newSubj.id,
                                facultyId: assignedFacultyId
                            }
                        }).catch(() => { }) // Ignore if already mapped
                    }
                }
            }

            // Gather subjects for timetable
            const allSemSubjects = await prisma.subject.findMany({ where: { departmentId: dept.id, semesterId: sem.id } })
            deptSubjects.push({ sem, subjects: allSemSubjects })
        }

        // --- STUDENT GENERATION ---
        const studentProfilesBySem = new Map<string, string[]>() // semId -> studentIds[]
        for (const sem of targetSemesters) {
            const existingStudents = await prisma.studentProfile.findMany({ where: { departmentId: dept.id, semesterId: sem.id } })
            const existingStudentCount = existingStudents.length
            const studentsToCreate = Math.max(0, 20 - existingStudentCount)

            const curStudentIds = existingStudents.map(s => s.id)

            if (studentsToCreate > 0) {
                console.log(`Generating ${studentsToCreate} students for ${dept.code} Sem ${sem.number}...`)
                const admissionYear = 2024 - Math.floor((sem.number - 1) / 2)
                const currentYear = Math.floor((sem.number - 1) / 2) + 1

                for (let i = 0; i < studentsToCreate; i++) {
                    const enrNo = `${dept.code}${admissionYear}${String(existingStudentCount + i + 1).padStart(3, '0')}`
                    const email = `stud_${enrNo.toLowerCase()}@university.edu`

                    const result = await prisma.$transaction(async (tx) => {
                        let user = await tx.user.findUnique({ where: { email } })
                        if (!user) {
                            user = await tx.user.create({
                                data: {
                                    email,
                                    passwordHash: defaultPasswordHash,
                                    name: `Student ${enrNo}`,
                                    role: Role.STUDENT,
                                }
                            })
                        }
                        let profile = await tx.studentProfile.findUnique({ where: { enrollmentNo: enrNo } })
                        if (!profile) {
                            profile = await tx.studentProfile.create({
                                data: {
                                    userId: user.id,
                                    enrollmentNo: enrNo,
                                    departmentId: dept.id,
                                    semesterId: sem.id,
                                    admissionYear,
                                    currentYear
                                }
                            })
                            return profile
                        }
                        return null
                    })
                    if (result) {
                        curStudentIds.push(result.id)
                        totalStudentsAdded++
                    }
                }
            }
            studentProfilesBySem.set(sem.id, curStudentIds)
        }

        // --- TIMETABLE GENERATION ---
        // For each semester, generate 5 periods/day for Monday to Friday (days 1 to 5)
        for (const { sem, subjects } of deptSubjects) {
            if (subjects.length === 0) continue

            console.log(`Generating timetable for ${dept.code} Sem ${sem.number}...`)
            const existingTimetable = await prisma.timetable.count({
                where: { departmentId: dept.id, semesterId: sem.id }
            })

            // Only generate if no timetable exists to avoid conflict
            if (existingTimetable === 0) {
                // Fetch assigned faculty for these subjects
                const mappings = await prisma.facultySubject.findMany({
                    where: { subjectId: { in: subjects.map(s => s.id) } }
                })
                const subjectFacultyMap = new Map<string, string>() // subjectId -> facultyId
                for (const m of mappings) {
                    subjectFacultyMap.set(m.subjectId, m.facultyId)
                }

                // For unassigned subjects, just pick a default faculty
                const defaultFacultyId = facultyIds[0]

                for (let day = 1; day <= 5; day++) {
                    for (let period = 1; period <= 5; period++) {
                        // Pick a random subject for this slot
                        const subject = subjects[randomInt(0, subjects.length - 1)]
                        const facId = subjectFacultyMap.get(subject.id) || defaultFacultyId

                        // Wait, faculty cannot teach two classes at the same day+period
                        // Let's just catch and ignore overlaps (not perfect layout, but safe)
                        if (!facId) continue

                        try {
                            await prisma.timetable.create({
                                data: {
                                    dayOfWeek: day,
                                    period,
                                    subjectId: subject.id,
                                    facultyId: facId,
                                    departmentId: dept.id,
                                    academicYearId: sem.academicYearId,
                                    semesterId: sem.id,
                                    room: `Room ${randomInt(100, 199)}`
                                }
                            })
                            totalTimetableCreated++
                        } catch (e: any) {
                            if (e.code !== 'P2002') {
                                console.error(e)
                            }
                        }
                    }
                }
            }
        }

        // --- ATTENDANCE HISTORY GENERATION ---
        const dates = getLast90DaysWeekdays()

        for (const { sem } of deptSubjects) {
            const studentIds = studentProfilesBySem.get(sem.id) || []
            if (studentIds.length === 0) continue

            // Get timetable for this semester
            const timetables = await prisma.timetable.findMany({
                where: { departmentId: dept.id, semesterId: sem.id }
            })
            if (timetables.length === 0) continue

            // Check if attendance already exists completely (skip if already seeded)
            const existingCount = await prisma.attendanceRecord.count({
                where: { studentId: studentIds[0], semesterId: sem.id }
            })

            if (existingCount > 0) {
                console.log(`Attendance for ${dept.code} Sem ${sem.number} already exists, skipping...`)
                continue
            }

            console.log(`Generating attendance for ${dept.code} Sem ${sem.number} over past 90 days...`)

            // Process in date batches for speed
            for (const date of dates) {
                const dayOfWeek = date.getDay()
                const dayTimetable = timetables.filter(t => t.dayOfWeek === dayOfWeek)
                if (dayTimetable.length === 0) continue

                // Batch all attendance records for this day
                const attendanceData = []
                for (const entry of dayTimetable) {
                    for (const stId of studentIds) {
                        const status = Math.random() < 0.75 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT
                        attendanceData.push({
                            studentId: stId,
                            subjectId: entry.subjectId,
                            semesterId: sem.id,
                            date,
                            period: entry.period,
                            status,
                            markedBy: entry.facultyId
                        })
                    }
                }

                if (attendanceData.length > 0) {
                    try {
                        const result = await prisma.attendanceRecord.createMany({
                            data: attendanceData,
                            skipDuplicates: true
                        })
                        totalAttendanceGenerated += result.count
                    } catch (e: any) {
                        // Skip constraint errors silently
                        if (e.code !== 'P2002') {
                            console.error(`Failed attendance gen at ${date.toISOString()}:`, e.message)
                        }
                    }
                }
            }
        }
    }

    console.log("\n==============================================")
    console.log("SEED DUMMY DATA COMPLETE")
    console.log(`Total Students Added:        ${totalStudentsAdded}`)
    console.log(`Total Faculty Added:         ${totalFacultyAdded}`)
    console.log(`Total Subjects Created:      ${totalSubjectsCreated}`)
    console.log(`Total Timetable Entries:     ${totalTimetableCreated}`)
    console.log(`Total Attendance Records:    ${totalAttendanceGenerated}`)
    console.log("================================================\n")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
