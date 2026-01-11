// Quick Fix Script: Update Existing MDC Courses
// Run this to set isMDC = true for existing MDC courses

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixMDCCourses() {
    console.log('🔍 Finding courses with "MDC" in their name...')

    // Find courses that have "MDC" in the name but isMDC is false
    const mdcCourses = await prisma.subject.findMany({
        where: {
            name: {
                contains: 'MDC',
                mode: 'insensitive',
            },
            isMDC: false,
        },
        select: {
            id: true,
            name: true,
            code: true,
            department: {
                select: {
                    name: true,
                    code: true,
                },
            },
        },
    })

    console.log(`📊 Found ${mdcCourses.length} courses to update:`)
    mdcCourses.forEach(course => {
        console.log(`   - ${course.code}: ${course.name} (${course.department.name})`)
    })

    if (mdcCourses.length === 0) {
        console.log('✅ No courses need updating!')
        return
    }

    // Update them
    console.log('\n🔧 Updating courses...')
    const result = await prisma.subject.updateMany({
        where: {
            name: {
                contains: 'MDC',
                mode: 'insensitive',
            },
            isMDC: false,
        },
        data: {
            isMDC: true,
        },
    })

    console.log(`✅ Updated ${result.count} courses!`)

    // Verify
    console.log('\n🔍 Verifying...')
    const verifyCount = await prisma.subject.count({
        where: {
            isMDC: true,
        },
    })

    console.log(`✅ Total MDC courses in database: ${verifyCount}`)
}

fixMDCCourses()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
