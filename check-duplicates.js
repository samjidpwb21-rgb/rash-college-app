const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDuplicates() {
    try {
        console.log('=== CHECKING FOR DUPLICATE ENROLLMENT NUMBERS ===');

        // Get all student profiles
        const students = await prisma.studentProfile.findMany({
            select: { enrollmentNo: true }
        });

        // Count occurrences
        const enrollmentCounts = {};
        students.forEach(s => {
            enrollmentCounts[s.enrollmentNo] = (enrollmentCounts[s.enrollmentNo] || 0) + 1;
        });

        // Find duplicates
        const enrollmentDuplicates = Object.entries(enrollmentCounts)
            .filter(([_, count]) => count > 1);

        if (enrollmentDuplicates.length === 0) {
            console.log('✓ No duplicate enrollmentNo found');
        } else {
            console.log('✗ DUPLICATES FOUND:');
            enrollmentDuplicates.forEach(([id, count]) => {
                console.log(`  - ${id}: ${count} occurrences`);
            });
        }

        console.log('\n=== CHECKING FOR DUPLICATE EMPLOYEE IDs ===');

        // Get all faculty profiles
        const faculty = await prisma.facultyProfile.findMany({
            select: { employeeId: true }
        });

        // Count occurrences
        const employeeCounts = {};
        faculty.forEach(f => {
            employeeCounts[f.employeeId] = (employeeCounts[f.employeeId] || 0) + 1;
        });

        // Find duplicates
        const employeeDuplicates = Object.entries(employeeCounts)
            .filter(([_, count]) => count > 1);

        if (employeeDuplicates.length === 0) {
            console.log('✓ No duplicate employeeId found');
        } else {
            console.log('✗ DUPLICATES FOUND:');
            employeeDuplicates.forEach(([id, count]) => {
                console.log(`  - ${id}: ${count} occurrences`);
            });
        }

        console.log('\n=== SUMMARY ===');
        console.log(`EnrollmentNo duplicates: ${enrollmentDuplicates.length === 0 ? 'NONE' : 'FOUND (' + enrollmentDuplicates.length + ')'}`);
        console.log(`EmployeeId duplicates: ${employeeDuplicates.length === 0 ? 'NONE' : 'FOUND (' + employeeDuplicates.length + ')'}`);
        console.log(`Migration safety: ${enrollmentDuplicates.length === 0 && employeeDuplicates.length === 0 ? 'SAFE TO MIGRATE' : 'BLOCKED (cleanup required)'}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDuplicates();
