/**
 * Backfill Script: Set admission years for existing students
 * 
 * This script updates admission_year for students based on their account creation date.
 * It's safe to run multiple times (idempotent).
 * 
 * Run with: npx tsx scripts/backfill-admission-years.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🎓 Backfilling Admission Years for Existing Students...\n')

    try {
        // Get all students with default admission year (2024)
        const students = await prisma.studentProfile.findMany({
            where: {
                admissionYear: 2024,  // Default value
            },
            include: {
                user: {
                    select: {
                        createdAt: true,
                        name: true,
                    },
                },
                semester: {
                    include: {
                        academicYear: true,
                    },
                },
            },
        })

        console.log(`Found ${students.length} students with default admission year\n`)

        if (students.length === 0) {
            console.log('✅ No students need backfilling!')
            return
        }

        // Update each student's admission year based on creation date
        let updated = 0
        let errors = 0

        for (const student of students) {
            try {
                // Calculate admission year from user creation date
                const createdYear = student.user.createdAt.getFullYear()

                // Calculate current year based on semester
                const currentYear = student.semester.academicYear.year

                await prisma.studentProfile.update({
                    where: { id: student.id },
                    data: {
                        admissionYear: createdYear,
                        currentYear: currentYear,
                    },
                })

                console.log(
                    `✓ Updated ${student.user.name}: admissionYear=${createdYear}, currentYear=${currentYear}`
                )
                updated++
            } catch (error) {
                console.error(`✗ Failed to update student ${student.id}:`, error)
                errors++
            }
        }

        console.log(`\n📊 Backfill Summary:`)
        console.log(`   ✅ Updated: ${updated}`)
        console.log(`   ❌ Errors: ${errors}`)
        console.log(`   ✓ Success rate: ${((updated / students.length) * 100).toFixed(1)}%`)

        if (updated > 0) {
            console.log('\n✅ Admission years backfilled successfully!')
        }
    } catch (error) {
        console.error('❌ Error during backfill:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .then(() => {
        console.log('\n✨ Backfill script complete!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Backfill script failed:', error)
        process.exit(1)
    })
