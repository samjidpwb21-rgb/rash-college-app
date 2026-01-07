/**
 * Semester Progression Actions
 * 
 * Admin-only actions for managing semester progressions and batch transitions.
 * Includes dry-run mode for safety and audit trail logging.
 */

"use server"

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import type { ActionResult } from "@/types/api"

// ============================================================================
// TYPES
// ============================================================================

export interface ProgressionCriteria {
    currentSemesterIds: string[]    // Semesters to progress from
    departmentId?: string           // Optional: filter by department
    excludeStudentIds?: string[]    // Manual exclusions (holds, failed students)
}

export interface StudentProgressionPreview {
    studentId: string
    name: string
    enrollmentNo: string
    currentSemester: {
        id: string
        name: string
        number: number
    }
    nextSemester: {
        id: string
        name: string
        number: number
    } | null  // null if graduating
    admissionYear: number
    isGraduating: boolean
}

export interface ProgressionResult {
    affected: number
    progressed: number
    graduating: number
    preview: StudentProgressionPreview[]
    warnings: string[]
}

// ============================================================================
// PROGRESSION ACTIONS
// ============================================================================

/**
 * Progress students to next semester (Dry-run or Execute)
 * 
 * @param criteria - Which students to progress
 * @param dryRun - If true, only preview without executing (default: true)
 * @returns Preview or execution results
 */
export async function progressStudents(
    criteria: ProgressionCriteria,
    dryRun: boolean = true
): Promise<ActionResult<ProgressionResult>> {
    try {
        // 1. Verify admin access
        const admin = await requireRole("ADMIN")

        // 2. Validate input
        if (!criteria.currentSemesterIds || criteria.currentSemesterIds.length === 0) {
            return {
                success: false,
                error: "At least one semester must be selected",
                code: "INVALID_INPUT",
            }
        }

        // 3. Get all semesters for mapping
        const allSemesters = await prisma.semester.findMany({
            include: {
                academicYear: true,
            },
            orderBy: { number: 'asc' },
        })

        // Create semester map for quick lookup
        const semesterMap = new Map(allSemesters.map(s => [s.id, s]))
        const semesterByNumber = new Map(allSemesters.map(s => [s.number, s]))

        // 4. Find students matching criteria
        const students = await prisma.studentProfile.findMany({
            where: {
                semesterId: { in: criteria.currentSemesterIds },
                departmentId: criteria.departmentId || undefined,
                id: criteria.excludeStudentIds
                    ? { notIn: criteria.excludeStudentIds }
                    : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    },
                },
                semester: {
                    include: {
                        academicYear: true,
                    },
                },
            },
        })

        // Filter out inactive users
        const activeStudents = students.filter(s => s.user.isActive)

        const warnings: string[] = []
        if (students.length > activeStudents.length) {
            warnings.push(
                `${students.length - activeStudents.length} inactive students were automatically excluded`
            )
        }

        // 5. Build progression preview
        const preview: StudentProgressionPreview[] = []
        let graduatingCount = 0

        for (const student of activeStudents) {
            const currentSem = student.semester
            const isGraduating = currentSem.number === 8

            let nextSem = null
            if (!isGraduating) {
                nextSem = semesterByNumber.get(currentSem.number + 1) || null
            }

            if (!isGraduating && !nextSem) {
                warnings.push(
                    `Student ${student.enrollmentNo} (${student.user.name}) cannot progress: Semester ${currentSem.number + 1} not found`
                )
                continue
            }

            preview.push({
                studentId: student.id,
                name: student.user.name,
                enrollmentNo: student.enrollmentNo,
                currentSemester: {
                    id: currentSem.id,
                    name: currentSem.name,
                    number: currentSem.number,
                },
                nextSemester: nextSem ? {
                    id: nextSem.id,
                    name: nextSem.name,
                    number: nextSem.number,
                } : null,
                admissionYear: student.admissionYear,
                isGraduating,
            })

            if (isGraduating) {
                graduatingCount++
            }
        }

        // 6. If dry-run, return preview only
        if (dryRun) {
            return {
                success: true,
                data: {
                    affected: preview.length,
                    progressed: 0,  // Not executed yet
                    graduating: graduatingCount,
                    preview,
                    warnings,
                },
            }
        }

        // 7. Execute progression (transaction for safety)
        let progressedCount = 0

        await prisma.$transaction(async (tx) => {
            for (const item of preview) {
                if (item.isGraduating) {
                    // Mark as graduated (keep in Sem 8, could add graduated flag later)
                    // Log to history
                    await tx.studentSemesterHistory.create({
                        data: {
                            studentId: item.studentId,
                            semesterId: item.currentSemester.id,
                            changedBy: admin.id,
                            reason: "Graduation - Completed Semester 8",
                        },
                    })
                } else if (item.nextSemester) {
                    // Progress to next semester
                    const nextAcademicYear = semesterByNumber.get(item.nextSemester.number)?.academicYear.year || 1

                    await tx.studentProfile.update({
                        where: { id: item.studentId },
                        data: {
                            semesterId: item.nextSemester.id,
                            currentYear: nextAcademicYear,
                        },
                    })

                    // Log to history
                    await tx.studentSemesterHistory.create({
                        data: {
                            studentId: item.studentId,
                            semesterId: item.nextSemester.id,
                            changedBy: admin.id,
                            reason: `Semester Progression: ${item.currentSemester.name} → ${item.nextSemester.name}`,
                        },
                    })

                    progressedCount++
                }
            }
        })

        // 8. Return execution results
        return {
            success: true,
            data: {
                affected: preview.length,
                progressed: progressedCount,
                graduating: graduatingCount,
                preview,
                warnings,
            },
        }
    } catch (error) {
        console.error("Semester progression error:", error)

        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return {
                success: false,
                error: "Unauthorized: Admin access required",
                code: "UNAUTHORIZED",
            }
        }

        return {
            success: false,
            error: "Failed to progress students. No changes were made.",
            code: "PROGRESSION_FAILED",
        }
    }
}

/**
 * Get progression statistics (for dashboard display)
 */
export async function getProgressionStats(): Promise<ActionResult<{
    semesterDistribution: Array<{
        semester: string
        count: number
        semesterNumber: number
    }>
    pendingGraduations: number
}>> {
    try {
        await requireRole("ADMIN")

        // Get distribution across semesters
        const distribution = await prisma.studentProfile.groupBy({
            by: ['semesterId'],
            _count: true,
            where: {
                user: {
                    isActive: true,
                    deletedAt: null,
                },
            },
        })

        const semesters = await prisma.semester.findMany({
            include: {
                academicYear: true,
            },
        })

        const semesterMap = new Map(semesters.map(s => [s.id, s]))

        const semesterDistribution = distribution.map(d => {
            const sem = semesterMap.get(d.semesterId)
            return {
                semester: sem?.name || 'Unknown',
                count: d._count,
                semesterNumber: sem?.number || 0,
            }
        }).sort((a, b) => a.semesterNumber - b.semesterNumber)

        // Count students in Semester 8 (pending graduation)
        const sem8 = semesters.find(s => s.number === 8)
        const pendingGraduations = distribution.find(d => d.semesterId === sem8?.id)?._count || 0

        return {
            success: true,
            data: {
                semesterDistribution,
                pendingGraduations,
            },
        }
    } catch (error) {
        console.error("Get progression stats error:", error)
        return {
            success: false,
            error: "Failed to fetch progression statistics",
            code: "STATS_FAILED",
        }
    }
}
