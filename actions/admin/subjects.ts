"use server"

// ============================================================================
// CAMPUSTRACK - ADMIN SUBJECTS SERVER ACTIONS
// ============================================================================
// ADMIN can create/edit/delete subjects (courses)

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { createSubjectSchema, updateSubjectSchema, uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Subject } from "@prisma/client"

/**
 * Create a new subject
 * ADMIN only
 */
export async function createSubject(
    input: {
        code: string
        name: string
        credits?: number
        type?: "THEORY" | "PRACTICAL"
        isMDC?: boolean
        description?: string
        departmentId: string
        semesterId: string
    }
): Promise<ActionResult<Subject>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = createSubjectSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        // 3. Check for duplicate code
        const existing = await prisma.subject.findUnique({
            where: { code: validated.data.code },
        })

        if (existing) {
            return errorResponse("Subject code already exists", "DUPLICATE")
        }

        // 4. Verify department exists
        const department = await prisma.department.findUnique({
            where: { id: validated.data.departmentId },
        })

        if (!department) {
            return errorResponse("Department not found", "NOT_FOUND")
        }

        // 5. Verify semester exists
        const semester = await prisma.semester.findUnique({
            where: { id: validated.data.semesterId },
        })

        if (!semester) {
            return errorResponse("Semester not found", "NOT_FOUND")
        }

        // 6. Create subject
        const subject = await prisma.subject.create({
            data: {
                code: validated.data.code,
                name: validated.data.name,
                credits: validated.data.credits ?? 3,
                type: validated.data.type ?? "THEORY",
                isMDC: validated.data.isMDC ?? false,
                description: validated.data.description,
                departmentId: validated.data.departmentId,
                semesterId: validated.data.semesterId,
            },
        })

        return successResponse(subject, "Subject created successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to create subject")
    }
}

/**
 * Update an existing subject
 * ADMIN only - subjects are editable after creation
 */
export async function updateSubject(
    input: {
        id: string
        code?: string
        name?: string
        credits?: number
        type?: "THEORY" | "PRACTICAL"
        description?: string
    }
): Promise<ActionResult<Subject>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = updateSubjectSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        // 3. Check subject exists
        const existing = await prisma.subject.findUnique({
            where: { id: validated.data.id },
        })

        if (!existing) {
            return errorResponse("Subject not found", "NOT_FOUND")
        }

        // 4. Check for duplicate code if updating code
        if (validated.data.code && validated.data.code !== existing.code) {
            const duplicate = await prisma.subject.findUnique({
                where: { code: validated.data.code },
            })
            if (duplicate) {
                return errorResponse("Subject code already exists", "DUPLICATE")
            }
        }

        // 5. Update subject
        const subject = await prisma.subject.update({
            where: { id: validated.data.id },
            data: {
                code: validated.data.code,
                name: validated.data.name,
                credits: validated.data.credits,
                type: validated.data.type,
                description: validated.data.description,
            },
        })

        return successResponse(subject, "Subject updated successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to update subject")
    }
}

/**
 * Delete a subject
 * ADMIN only - only if no attendance records
 */
export async function deleteSubject(id: string): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid subject ID")
        }

        // 3. Check subject exists
        const existing = await prisma.subject.findUnique({
            where: { id: validated.data },
            include: {
                _count: {
                    select: { attendance: true, timetable: true },
                },
            },
        })

        if (!existing) {
            return errorResponse("Subject not found", "NOT_FOUND")
        }

        // 4. Check for attendance records (data preservation)
        if (existing._count.attendance > 0) {
            return errorResponse("Cannot delete subject with attendance records", "HAS_DEPENDENCIES")
        }

        // 5. Delete subject (will cascade to timetable and faculty assignments)
        await prisma.subject.delete({
            where: { id: validated.data },
        })

        return successResponse({ id: validated.data }, "Subject deleted successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to delete subject")
    }
}

/**
 * Get all subjects
 * ADMIN only
 */
export async function getSubjects(): Promise<ActionResult<Subject[]>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Fetch all subjects with relations
        const subjects = await prisma.subject.findMany({
            orderBy: { code: "asc" },
            include: {
                department: { select: { id: true, name: true, code: true } },
                semester: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                        academicYear: { select: { id: true, year: true, name: true } },
                    },
                },
                _count: {
                    select: { facultyAssigned: true, attendance: true },
                },
            },
        })

        return successResponse(subjects)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch subjects")
    }
}

/**
 * Get single subject by ID
 * ADMIN only
 */
export async function getSubject(id: string): Promise<ActionResult<Subject>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid subject ID")
        }

        // 3. Fetch subject
        const subject = await prisma.subject.findUnique({
            where: { id: validated.data },
            include: {
                department: true,
                semester: {
                    include: { academicYear: true },
                },
                facultyAssigned: {
                    include: {
                        faculty: {
                            include: {
                                user: { select: { id: true, name: true, email: true } },
                            },
                        },
                    },
                },
            },
        })

        if (!subject) {
            return errorResponse("Subject not found", "NOT_FOUND")
        }

        return successResponse(subject)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch subject")
    }
}

/**
 * Assign faculty to subject
 * ADMIN only
 */
export async function assignFacultyToSubject(
    facultyProfileId: string,
    subjectId: string
): Promise<ActionResult<{ facultyId: string; subjectId: string }>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate inputs
        const facultyValid = uuidSchema.safeParse(facultyProfileId)
        const subjectValid = uuidSchema.safeParse(subjectId)

        if (!facultyValid.success || !subjectValid.success) {
            return errorResponse("Invalid faculty or subject ID")
        }

        // 3. Verify faculty exists
        const faculty = await prisma.facultyProfile.findUnique({
            where: { id: facultyProfileId },
        })

        if (!faculty) {
            return errorResponse("Faculty not found", "NOT_FOUND")
        }

        // 4. Verify subject exists
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
        })

        if (!subject) {
            return errorResponse("Subject not found", "NOT_FOUND")
        }

        // 5. Create assignment (upsert to handle duplicates)
        await prisma.facultySubject.upsert({
            where: {
                facultyId_subjectId: {
                    facultyId: facultyProfileId,
                    subjectId: subjectId,
                },
            },
            update: {},
            create: {
                facultyId: facultyProfileId,
                subjectId: subjectId,
            },
        })

        return successResponse(
            { facultyId: facultyProfileId, subjectId },
            "Faculty assigned to subject successfully"
        )
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to assign faculty")
    }
}

/**
 * Remove faculty from subject
 * ADMIN only
 */
export async function removeFacultyFromSubject(
    facultyProfileId: string,
    subjectId: string
): Promise<ActionResult<{ facultyId: string; subjectId: string }>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Delete assignment
        await prisma.facultySubject.delete({
            where: {
                facultyId_subjectId: {
                    facultyId: facultyProfileId,
                    subjectId: subjectId,
                },
            },
        })

        return successResponse(
            { facultyId: facultyProfileId, subjectId },
            "Faculty removed from subject successfully"
        )
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to remove faculty")
    }
}
