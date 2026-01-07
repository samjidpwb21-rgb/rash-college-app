/**
 * Update Student Semester (Manual Override)
 * 
 * Admin-only action to manually change a student's semester.
 * Useful for corrections, holds, or special cases.
 * Logs to audit trail.
 */

"use server"

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import type { ActionResult } from "@/types/api"

export async function updateStudentSemester(
    studentId: string,
    newSemesterId: string,
    reason?: string
): Promise<ActionResult<{ studentId: string; newSemester: string }>> {
    try {
        // 1. Verify admin access
        const admin = await requireRole("ADMIN")

        // 2. Validate student exists
        const student = await prisma.studentProfile.findUnique({
            where: { id: studentId },
            include: {
                user: true,
                semester: {
                    include: {
                        academicYear: true,
                    },
                },
            },
        })

        if (!student) {
            return {
                success: false,
                error: "Student not found",
                code: "NOT_FOUND",
            }
        }

        if (student.user.deletedAt) {
            return {
                success: false,
                error: "Cannot update deleted student",
                code: "DELETED",
            }
        }

        // 3. Validate new semester exists
        const newSemester = await prisma.semester.findUnique({
            where: { id: newSemesterId },
            include: {
                academicYear: true,
            },
        })

        if (!newSemester) {
            return {
                success: false,
                error: "Invalid semester selected",
                code: "INVALID_SEMESTER",
            }
        }

        // 4. Check if already in this semester
        if (student.semesterId === newSemesterId) {
            return {
                success: false,
                error: "Student is already in this semester",
                code: "NO_CHANGE",
            }
        }

        // 5. Update student semester in transaction
        await prisma.$transaction(async (tx) => {
            // Update student profile
            await tx.studentProfile.update({
                where: { id: studentId },
                data: {
                    semesterId: newSemesterId,
                    currentYear: newSemester.academicYear.year,
                },
            })

            // Log to history
            await tx.studentSemesterHistory.create({
                data: {
                    studentId,
                    semesterId: newSemesterId,
                    changedBy: admin.id,
                    reason: reason || `Manual Update: ${student.semester.name} → ${newSemester.name}`,
                },
            })
        })

        return {
            success: true,
            data: {
                studentId,
                newSemester: newSemester.name,
            },
            message: `Student semester updated to ${newSemester.name}`,
        }
    } catch (error) {
        console.error("Update student semester error:", error)

        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return {
                success: false,
                error: "Unauthorized: Admin access required",
                code: "UNAUTHORIZED",
            }
        }

        return {
            success: false,
            error: "Failed to update student semester",
            code: "UPDATE_FAILED",
        }
    }
}

/**
 * Get student semester history
 */
export async function getStudentSemesterHistory(
    studentId: string
): Promise<ActionResult<Array<{
    semesterName: string
    changedAt: Date
    changedBy: string
    reason: string | null
}>>> {
    try {
        await requireRole("ADMIN")

        const history = await prisma.studentSemesterHistory.findMany({
            where: { studentId },
            include: {
                semester: true,
                admin: {
                    select: { name: true },
                },
            },
            orderBy: { changedAt: 'desc' },
        })

        const formatted = history.map(h => ({
            semesterName: h.semester.name,
            changedAt: h.changedAt,
            changedBy: h.admin.name,
            reason: h.reason,
        }))

        return {
            success: true,
            data: formatted,
        }
    } catch (error) {
        console.error("Get semester history error:", error)
        return {
            success: false,
            error: "Failed to fetch semester history",
            code: "FETCH_FAILED",
        }
    }
}
