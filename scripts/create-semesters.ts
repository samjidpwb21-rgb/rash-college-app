/**
 * ONE-TIME SCRIPT: Create Semester Records
 * 
 * This script creates 8 semester records (Semester 1-8) for the current academic year.
 * Semesters are NOT department-specific - they are academic-year-specific.
 * All departments share the same set of semesters.
 * 
 * SAFE TO RUN MULTIPLE TIMES - checks for existing semesters before creating.
 * 
 * Run with: npx tsx scripts/create-semesters.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SEMESTERS = [
    { number: 1, name: 'Semester 1', isOdd: true, year: 1 },
    { number: 2, name: 'Semester 2', isOdd: false, year: 1 },
    { number: 3, name: 'Semester 3', isOdd: true, year: 2 },
    { number: 4, name: 'Semester 4', isOdd: false, year: 2 },
    { number: 5, name: 'Semester 5', isOdd: true, year: 3 },
    { number: 6, name: 'Semester 6', isOdd: false, year: 3 },
    { number: 7, name: 'Semester 7', isOdd: true, year: 4 },
    { number: 8, name: 'Semester 8', isOdd: false, year: 4 },
]

async function main() {
    console.log('🎓 Starting Semester Creation Script...\n')

    try {
        // Step 1: Get or create academic years (1-4)
        const academicYears = await prisma.academicYear.findMany({
            orderBy: { year: 'asc' },
        })

        if (academicYears.length === 0) {
            console.log('📅 No academic years found. Creating all 4 years...')
            const yearsToCreate = [
                { year: 1, name: 'First Year' },
                { year: 2, name: 'Second Year' },
                { year: 3, name: 'Third Year' },
                { year: 4, name: 'Fourth Year' },
            ]

            for (const yearData of yearsToCreate) {
                await prisma.academicYear.create({
                    data: yearData,
                })
                console.log(`✅ Created: ${yearData.name}`)
            }
            console.log()
        } else {
            console.log(`📅 Found ${academicYears.length} academic years\n`)
        }

        // Fetch all academic years for mapping
        const allAcademicYears = await prisma.academicYear.findMany({
            orderBy: { year: 'asc' },
        })

        // Create a map of year number to academic year ID
        const yearMap = new Map(allAcademicYears.map(ay => [ay.year, ay]))

        console.log('📖 Academic Years Loaded:')
        allAcademicYears.forEach(ay => {
            console.log(`  - Year ${ay.year}: ${ay.name} (ID: ${ay.id})`)
        })
        console.log()

        // Step 2: Check existing semesters across all years
        const existingSemesters = await prisma.semester.findMany({
            orderBy: { number: 'asc' },
            include: {
                academicYear: true,
            },
        })

        if (existingSemesters.length === 8) {
            // Check if they're correctly mapped
            const correctlyMapped = existingSemesters.every(sem => {
                const expectedYear = Math.ceil(sem.number / 2)
                return sem.academicYear.year === expectedYear
            })

            if (correctlyMapped) {
                console.log('✅ All 8 semesters already exist with correct mapping!')
                console.log('\nExisting semesters:')
                existingSemesters.forEach((sem) => {
                    console.log(`  - ${sem.name} → ${sem.academicYear.name}`)
                })
                console.log('\n✨ No action needed. Script complete.')
                return
            } else {
                console.log('⚠️  Found 8 semesters but they have incorrect year mapping.')
                console.log('   Deleting existing semesters to recreate with correct mapping...\n')
                await prisma.semester.deleteMany({})
            }
        } else if (existingSemesters.length > 0) {
            console.log(`⚠️  Found ${existingSemesters.length} existing semesters. Deleting to recreate all 8...`)
            await prisma.semester.deleteMany({})
            console.log()
        }

        // Step 3: Create all 8 semesters with correct year mapping
        console.log('📝 Creating 8 semesters with correct year mapping...\n')

        const semestersToCreate = SEMESTERS.map(semData => {
            const academicYear = yearMap.get(semData.year)
            if (!academicYear) {
                throw new Error(`Academic year ${semData.year} not found`)
            }

            return {
                number: semData.number,
                name: semData.name,
                isOdd: semData.isOdd,
                academicYearId: academicYear.id,
            }
        })

        const created = await prisma.$transaction(
            semestersToCreate.map((semData) =>
                prisma.semester.create({
                    data: semData,
                })
            )
        )

        console.log(`✅ Successfully created ${created.length} semesters!\n`)

        // Step 4: Verify all semesters with correct mapping
        const allSemesters = await prisma.semester.findMany({
            orderBy: { number: 'asc' },
            include: {
                academicYear: {
                    select: { year: true, name: true },
                },
            },
        })

        console.log('📊 Final Semester List:\n')
        console.log('Semester     | Academic Year  | ID')
        console.log('-------------|----------------|--------------------------------------')
        allSemesters.forEach((sem) => {
            console.log(
                `${sem.name.padEnd(12)} | ${sem.academicYear.name.padEnd(14)} | ${sem.id}`
            )
        })

        // Step 5: Verify department count (for informational purposes)
        const departmentCount = await prisma.department.count()
        console.log(`\n🏛️  Total departments in system: ${departmentCount}`)
        console.log(
            `✨  All ${departmentCount} departments can now use these ${allSemesters.length} semesters!\n`
        )

        console.log('✅ Semester creation complete!')
        console.log('\n📍 Verification:')
        console.log('   ✓ Semester 1 & 2 → First Year')
        console.log('   ✓ Semester 3 & 4 → Second Year')
        console.log('   ✓ Semester 5 & 6 → Third Year')
        console.log('   ✓ Semester 7 & 8 → Fourth Year')
        console.log('\n📍 Next steps:')
        console.log('   1. Verify dropdowns in Admin → Users → Add Student → Semester')
        console.log('   2. Verify dropdowns in Admin → Courses → Add Course → Semester')
        console.log('   3. Verify dropdowns in Admin → Departments → Timetable → Semester')
    } catch (error) {
        console.error('❌ Error creating semesters:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .then(() => {
        console.log('\n✨ Script finished successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error)
        process.exit(1)
    })
