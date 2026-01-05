"use server"

// ============================================================================
// CAMPUSTRACK - TIMETABLE MANAGEMENT SERVER ACTIONS
// Admin-only timetable CRUD with strict department+semester scoping
// ============================================================================

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { z } from "zod"
import { getBulkSubjectColors } from "@/lib/subject-color-assignment"

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const timetableEntrySchema = z.object({
    dayOfWeek: z.number().int().min(1).max(6), // Monday=1, Saturday=6
    period: z.number().int().min(1).max(5), // 5 periods per day
    subjectId: z.string().uuid(),
    facultyId: z.string().uuid(),
    room: z.string().optional(),
    departmentId: z.string().uuid(),
    semesterId: z.string().uuid(),
    academicYearId: z.string().uuid(),
})

// ============================================================================
// GET TIMETABLE FOR DEPARTMENT + SEMESTER
// Admin-only with strict scoping enforcement
// ============================================================================

export async function getDepartmentSemesterTimetable(
    departmentId: string,
    semesterId: string
): Promise<ActionResult<any[]>> {
    try {
        // 1. Validate session and role
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }

        // 2. Validate input
        if (!departmentId || !semesterId) {
            return errorResponse("Department ID and Semester ID are required")
        }

        // 3. Fetch timetable with strict scoping
        const timetable = await prisma.timetable.findMany({
            where: {
                departmentId,
                semesterId,
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                faculty: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                semester: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { dayOfWeek: "asc" },
                { period: "asc" },
            ],
        })

        // 4. Get persistent colors for all subjects in the timetable
        const subjectIds = timetable.map(entry => entry.subject.id)
        const colorMap = await getBulkSubjectColors(subjectIds)

        // 5. Attach colors to timetable response
        const timetableWithColors = timetable.map(entry => ({
            ...entry,
            subjectColor: colorMap.get(entry.subject.id) || "bg-gray-100 border-l-4 border-gray-400 text-gray-900",
        }))

        return successResponse(timetableWithColors)
    } catch (error) {
        console.error("Get timetable error:", error)
        return errorResponse("Failed to fetch timetable")
    }
}

// ============================================================================
// CREATE TIMETABLE ENTRY
// Admin-only with conflict detection
// ============================================================================

export async function createTimetableEntry(data: z.infer<typeof timetableEntrySchema>): Promise<ActionResult<any>> {
    try {
        // 1. Validate session and role
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }

        // 2. Validate input
        const validated = timetableEntrySchema.safeParse(data)
        if (!validated.success) {
            return errorResponse("Invalid timetable data: " + validated.error.message)
        }

        // 3. Check for existing entry in this slot
        const existing = await prisma.timetable.findFirst({
            where: {
                dayOfWeek: validated.data.dayOfWeek,
                period: validated.data.period,
                departmentId: validated.data.departmentId,
                semesterId: validated.data.semesterId,
                academicYearId: validated.data.academicYearId,
            },
        })

        if (existing) {
            return errorResponse(
                "Slot already occupied. Please delete the existing entry first.",
                "CONFLICT"
            )
        }

        // 4. Verify subject belongs to this department+semester
        const subject = await prisma.subject.findFirst({
            where: {
                id: validated.data.subjectId,
                departmentId: validated.data.departmentId,
                semesterId: validated.data.semesterId,
            },
        })

        if (!subject) {
            return errorResponse("Subject not found in this department/semester")
        }

        // 5. Verify faculty belongs to this department
        const faculty = await prisma.facultyProfile.findFirst({
            where: {
                id: validated.data.facultyId,
                departmentId: validated.data.departmentId,
            },
        })

        if (!faculty) {
            return errorResponse("Faculty not found in this department")
        }

        // 6. Create timetable entry
        const entry = await prisma.timetable.create({
            data: validated.data,
            include: {
                subject: true,
                faculty: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        // 7. Auto-sync: Ensure FacultySubject mapping exists
        // This allows Faculty portal to see the assigned subject
        await prisma.facultySubject.upsert({
            where: {
                facultyId_subjectId: {
                    facultyId: validated.data.facultyId,
                    subjectId: validated.data.subjectId,
                },
            },
            update: {}, // Already exists, no changes needed
            create: {
                facultyId: validated.data.facultyId,
                subjectId: validated.data.subjectId,
            },
        })

        return successResponse(entry, "Timetable entry created successfully")
    } catch (error) {
        console.error("Create timetable entry error:", error)
        return errorResponse("Failed to create timetable entry")
    }
}

// ============================================================================
// UPDATE TIMETABLE ENTRY
// Admin-only
// ============================================================================

export async function updateTimetableEntry(
    id: string,
    data: Partial<z.infer<typeof timetableEntrySchema>>
): Promise<ActionResult<any>> {
    try {
        // 1. Validate session and role
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }

        // 2. Check entry exists
        const existing = await prisma.timetable.findUnique({
            where: { id },
        })

        if (!existing) {
            return errorResponse("Timetable entry not found", "NOT_FOUND")
        }

        // 3. Update entry
        const entry = await prisma.timetable.update({
            where: { id },
            data,
            include: {
                subject: true,
                faculty: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        // 4. Auto-sync: If faculty or subject changed, ensure new FacultySubject mapping exists
        if (data.facultyId || data.subjectId) {
            const newFacultyId = data.facultyId || existing.facultyId
            const newSubjectId = data.subjectId || existing.subjectId

            await prisma.facultySubject.upsert({
                where: {
                    facultyId_subjectId: {
                        facultyId: newFacultyId,
                        subjectId: newSubjectId,
                    },
                },
                update: {}, // Already exists, no changes needed
                create: {
                    facultyId: newFacultyId,
                    subjectId: newSubjectId,
                },
            })

            // 5. Cleanup: If faculty changed, check if we should remove old mapping
            if (data.facultyId && data.facultyId !== existing.facultyId) {
                // Only delete old mapping if no other timetable entries use it
                const otherEntries = await prisma.timetable.count({
                    where: {
                        facultyId: existing.facultyId,
                        subjectId: existing.subjectId,
                        id: { not: id }, // Exclude the entry we just updated
                    },
                })

                if (otherEntries === 0) {
                    await prisma.facultySubject.deleteMany({
                        where: {
                            facultyId: existing.facultyId,
                            subjectId: existing.subjectId,
                        },
                    })
                }
            }
        }

        return successResponse(entry, "Timetable entry updated successfully")
    } catch (error) {
        console.error("Update timetable entry error:", error)
        return errorResponse("Failed to update timetable entry")
    }
}

// ============================================================================
// DELETE TIMETABLE ENTRY
// Admin-only
// ============================================================================

export async function deleteTimetableEntry(id: string): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Validate session and role
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }

        // 2. Check entry exists
        const existing = await prisma.timetable.findUnique({
            where: { id },
        })

        if (!existing) {
            return errorResponse("Timetable entry not found", "NOT_FOUND")
        }

        // 3. Delete entry
        await prisma.timetable.delete({
            where: { id },
        })

        // 4. Auto-sync cleanup: Check if we should remove FacultySubject mapping
        // Only delete if this was the last timetable entry for this faculty-subject pair
        const otherEntries = await prisma.timetable.count({
            where: {
                facultyId: existing.facultyId,
                subjectId: existing.subjectId,
            },
        })

        if (otherEntries === 0) {
            // Safe to delete FacultySubject mapping since no other timetable entries exist
            await prisma.facultySubject.deleteMany({
                where: {
                    facultyId: existing.facultyId,
                    subjectId: existing.subjectId,
                },
            })
        }

        return successResponse({ id }, "Timetable entry deleted successfully")
    } catch (error) {
        console.error("Delete timetable entry error:", error)
        return errorResponse("Failed to delete timetable entry")
    }
}

// ============================================================================
// GET DEPARTMENT SUBJECTS BY SEMESTER
// Helper for populating subject dropdown
// ============================================================================

export async function getDepartmentSubjects(
    departmentId: string,
    semesterId: string
): Promise<ActionResult<any[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const subjects = await prisma.subject.findMany({
            where: {
                departmentId,
                semesterId,
            },
            select: {
                id: true,
                code: true,
                name: true,
                credits: true,
                type: true,
            },
            orderBy: { code: "asc" },
        })

        return successResponse(subjects)
    } catch (error) {
        console.error("Get department subjects error:", error)
        return errorResponse("Failed to fetch subjects")
    }
}

// ============================================================================
// GET DEPARTMENT FACULTY
// Helper for populating faculty dropdown
// ============================================================================

export async function getDepartmentFaculty(departmentId: string): Promise<ActionResult<any[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const faculty = await prisma.facultyProfile.findMany({
            where: {
                departmentId,
                user: {
                    deletedAt: null,
                    isActive: true,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                user: {
                    name: "asc",
                },
            },
        })

        return successResponse(faculty)
    } catch (error) {
        console.error("Get department faculty error:", error)
        return errorResponse("Failed to fetch faculty")
    }
}
