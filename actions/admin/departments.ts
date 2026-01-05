"use server"

// ============================================================================
// CAMPUSTRACK - ADMIN DEPARTMENTS SERVER ACTIONS
// ============================================================================
// ADMIN can create/edit/delete departments

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { createDepartmentSchema, updateDepartmentSchema, uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Department } from "@prisma/client"

/**
 * Create a new department
 * ADMIN only
 */
export async function createDepartment(
    input: { name: string; code: string; description?: string }
): Promise<ActionResult<Department>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = createDepartmentSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        // 3. Check for duplicate code
        const existing = await prisma.department.findUnique({
            where: { code: validated.data.code },
        })

        if (existing) {
            return errorResponse("Department code already exists", "DUPLICATE")
        }

        // 4. Create department
        const department = await prisma.department.create({
            data: {
                name: validated.data.name,
                code: validated.data.code,
                description: validated.data.description,
            },
        })

        return successResponse(department, "Department created successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to create department")
    }
}

/**
 * Update an existing department
 * ADMIN only
 */
export async function updateDepartment(
    input: { id: string; name?: string; code?: string; description?: string }
): Promise<ActionResult<Department>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = updateDepartmentSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        // 3. Check department exists
        const existing = await prisma.department.findUnique({
            where: { id: validated.data.id },
        })

        if (!existing) {
            return errorResponse("Department not found", "NOT_FOUND")
        }

        // 4. Check for duplicate code if updating code
        if (validated.data.code && validated.data.code !== existing.code) {
            const duplicate = await prisma.department.findUnique({
                where: { code: validated.data.code },
            })
            if (duplicate) {
                return errorResponse("Department code already exists", "DUPLICATE")
            }
        }

        // 5. Update department
        const department = await prisma.department.update({
            where: { id: validated.data.id },
            data: {
                name: validated.data.name,
                code: validated.data.code,
                description: validated.data.description,
            },
        })

        return successResponse(department, "Department updated successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to update department")
    }
}

/**
 * Delete a department and ALL related data (CASCADE)
 * ADMIN only - permanently deletes department, students, faculty, courses, attendance
 * Uses transaction for atomic operation
 */
export async function deleteDepartment(id: string): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid department ID")
        }

        // 3. Check department exists
        const existing = await prisma.department.findUnique({
            where: { id: validated.data },
        })

        if (!existing) {
            return errorResponse("Department not found", "NOT_FOUND")
        }

        // 4. CASCADE DELETE - all related data in transaction
        await prisma.$transaction(async (tx) => {
            // Step 1: Delete attendance records for all students in department
            const studentIds = await tx.studentProfile.findMany({
                where: { departmentId: validated.data },
                select: { id: true },
            })

            if (studentIds.length > 0) {
                await tx.attendanceRecord.deleteMany({
                    where: { studentId: { in: studentIds.map(s => s.id) } },
                })
            }

            // Step 2: Delete timetable entries for department
            await tx.timetable.deleteMany({
                where: { departmentId: validated.data },
            })

            // Step 3: Delete subjects (FacultySubject will auto-cascade)
            await tx.subject.deleteMany({
                where: { departmentId: validated.data },
            })

            // Step 4: Delete student profiles and their user accounts
            const students = await tx.studentProfile.findMany({
                where: { departmentId: validated.data },
                select: { userId: true },
            })

            await tx.studentProfile.deleteMany({
                where: { departmentId: validated.data },
            })

            if (students.length > 0) {
                await tx.user.deleteMany({
                    where: { id: { in: students.map(s => s.userId) } },
                })
            }

            // Step 5: Delete faculty profiles and their user accounts
            const faculty = await tx.facultyProfile.findMany({
                where: { departmentId: validated.data },
                select: { userId: true },
            })

            await tx.facultyProfile.deleteMany({
                where: { departmentId: validated.data },
            })

            if (faculty.length > 0) {
                await tx.user.deleteMany({
                    where: { id: { in: faculty.map(f => f.userId) } },
                })
            }

            // Step 6: Finally, delete the department itself
            await tx.department.delete({
                where: { id: validated.data },
            })
        })

        return successResponse(
            { id: validated.data },
            "Department and all related data deleted successfully"
        )
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        console.error("Department cascade delete error:", error)
        return errorResponse("Failed to delete department: " + (error instanceof Error ? error.message : "Unknown error"))
    }
}

/**
 * Get all departments
 * ADMIN only
 */
export async function getDepartments(): Promise<ActionResult<Department[]>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Fetch all departments with counts
        const departments = await prisma.department.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { students: true, faculty: true, subjects: true },
                },
            },
        })

        return successResponse(departments)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch departments")
    }
}

/**
 * Get single department by ID
 * ADMIN only
 */
export async function getDepartment(id: string): Promise<ActionResult<Department>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid department ID")
        }

        // 3. Fetch department
        const department = await prisma.department.findUnique({
            where: { id: validated.data },
            include: {
                _count: {
                    select: { students: true, faculty: true, subjects: true },
                },
            },
        })

        if (!department) {
            return errorResponse("Department not found", "NOT_FOUND")
        }

        return successResponse(department)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch department")
    }
}
