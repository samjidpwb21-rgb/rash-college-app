"use server"

// ============================================================================
// CAMPUSTRACK - ADMIN USERS SERVER ACTIONS
// ============================================================================
// ADMIN can create/edit/soft-delete users

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { createUserSchema, updateUserSchema, uuidSchema } from "@/lib/validations"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { User } from "@prisma/client"
import { hash } from "bcryptjs"

type SafeUser = Omit<User, "passwordHash">

/**
 * Create a new user
 * ADMIN only
 */
export async function createUser(
    input: {
        email: string
        password: string
        name: string
        role: "ADMIN" | "FACULTY" | "STUDENT"
        departmentId: string
        semesterId?: string // Required for STUDENT role
    }
): Promise<ActionResult<SafeUser>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = createUserSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        // 3. Validate department is required
        if (!input.departmentId) {
            return errorResponse("Department is required")
        }

        // 4. Verify department exists
        const department = await prisma.department.findUnique({
            where: { id: input.departmentId },
        })

        if (!department) {
            return errorResponse("Invalid department selected")
        }

        // 5. Validate semester for students
        if (input.role === "STUDENT") {
            if (!input.semesterId) {
                return errorResponse("Semester is required for students")
            }

            // Verify semester exists
            const semester = await prisma.semester.findUnique({
                where: { id: input.semesterId }
            })

            if (!semester) {
                return errorResponse("Invalid semester selected")
            }
        }

        // 6. Check for duplicate email
        const existing = await prisma.user.findUnique({
            where: { email: validated.data.email },
        })

        if (existing) {
            return errorResponse("Email already exists", "DUPLICATE")
        }

        // 7. Hash password
        const passwordHash = await hash(validated.data.password, 12)

        // 8. Create user transactions
        const user = await prisma.$transaction(async (tx) => {
            // Create base user
            const newUser = await tx.user.create({
                data: {
                    email: validated.data.email,
                    passwordHash,
                    name: validated.data.name,
                    role: validated.data.role,
                    isActive: true,
                },
            })

            // Create role-specific profile
            if (validated.data.role === "STUDENT") {
                await tx.studentProfile.create({
                    data: {
                        userId: newUser.id,
                        departmentId: input.departmentId,
                        semesterId: input.semesterId!, // Guaranteed by validation above
                        enrollmentNo: `STD${Date.now()}`,
                    },
                })
            } else if (validated.data.role === "FACULTY") {
                await tx.facultyProfile.create({
                    data: {
                        userId: newUser.id,
                        departmentId: input.departmentId,
                        employeeId: `FAC${Date.now()}`,
                        designation: "Faculty",
                    },
                })
            }

            return newUser
        })

        // Return user without password hash
        const { passwordHash: _, ...safeUser } = user

        return successResponse(safeUser, "User created successfully")
    } catch (error) {
        console.error("Create user error:", error)
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to create user")
    }
}

/**
 * Update an existing user
 * ADMIN only
 */
export async function updateUser(
    input: {
        id: string
        name?: string
        email?: string
        isActive?: boolean
    }
): Promise<ActionResult<SafeUser>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = updateUserSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse(validated.error.errors[0].message)
        }

        // 3. Check user exists
        const existing = await prisma.user.findUnique({
            where: { id: validated.data.id },
        })

        if (!existing) {
            return errorResponse("User not found", "NOT_FOUND")
        }

        // 4. Soft-deleted users cannot be mutated
        if (existing.deletedAt !== null) {
            return errorResponse("Cannot modify deleted user", "DELETED")
        }

        // 5. Check for duplicate email if updating email
        if (validated.data.email && validated.data.email !== existing.email) {
            const duplicate = await prisma.user.findUnique({
                where: { email: validated.data.email },
            })
            if (duplicate) {
                return errorResponse("Email already exists", "DUPLICATE")
            }
        }

        // 6. Update user
        const user = await prisma.user.update({
            where: { id: validated.data.id },
            data: {
                name: validated.data.name,
                email: validated.data.email,
                isActive: validated.data.isActive,
            },
        })

        const { passwordHash: _, ...safeUser } = user

        return successResponse(safeUser, "User updated successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to update user")
    }
}

/**
 * Soft delete a user
 * ADMIN only - sets deletedAt and isActive=false
 */
export async function deleteUser(id: string): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Validate session and role
        const admin = await requireRole("ADMIN")

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid user ID")
        }

        // 3. Prevent self-deletion
        if (validated.data === admin.id) {
            return errorResponse("Cannot delete yourself", "SELF_DELETE")
        }

        // 4. Check user exists
        const existing = await prisma.user.findUnique({
            where: { id: validated.data },
        })

        if (!existing) {
            return errorResponse("User not found", "NOT_FOUND")
        }

        // 5. Already deleted
        if (existing.deletedAt !== null) {
            return errorResponse("User already deleted", "ALREADY_DELETED")
        }

        // 6. Soft delete (set deletedAt and isActive=false)
        await prisma.user.update({
            where: { id: validated.data },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        })

        return successResponse({ id: validated.data }, "User deleted successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to delete user")
    }
}

/**
 * Restore a soft-deleted user
 * ADMIN only
 */
export async function restoreUser(id: string): Promise<ActionResult<SafeUser>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid user ID")
        }

        // 3. Check user exists
        const existing = await prisma.user.findUnique({
            where: { id: validated.data },
        })

        if (!existing) {
            return errorResponse("User not found", "NOT_FOUND")
        }

        // 4. Not deleted
        if (existing.deletedAt === null) {
            return errorResponse("User is not deleted", "NOT_DELETED")
        }

        // 5. Restore user
        const user = await prisma.user.update({
            where: { id: validated.data },
            data: {
                deletedAt: null,
                isActive: true,
            },
        })

        const { passwordHash: _, ...safeUser } = user

        return successResponse(safeUser, "User restored successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to restore user")
    }
}

/**
 * Get all users
 * ADMIN only
 */
export async function getUsers(
    options?: { role?: "ADMIN" | "FACULTY" | "STUDENT"; includeDeleted?: boolean }
): Promise<ActionResult<SafeUser[]>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Build query
        const where: Record<string, unknown> = {}

        if (options?.role) {
            where.role = options.role
        }

        if (!options?.includeDeleted) {
            where.deletedAt = null
        }

        // 3. Fetch users
        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                isActive: true,
                deletedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return successResponse(users as SafeUser[])
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch users")
    }
}

/**
 * Get single user by ID
 * ADMIN only
 */
export async function getUser(id: string): Promise<ActionResult<SafeUser>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const validated = uuidSchema.safeParse(id)
        if (!validated.success) {
            return errorResponse("Invalid user ID")
        }

        // 3. Fetch user with profile
        const user = await prisma.user.findUnique({
            where: { id: validated.data },
            include: {
                studentProfile: {
                    include: {
                        department: true,
                        semester: {
                            include: { academicYear: true },
                        },
                    },
                },
                facultyProfile: {
                    include: { department: true },
                },
            },
        })

        if (!user) {
            return errorResponse("User not found", "NOT_FOUND")
        }

        const { passwordHash: _, ...safeUser } = user

        return successResponse(safeUser as SafeUser)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to fetch user")
    }
}

/**
 * Reset user password
 * ADMIN only
 */
export async function resetUserPassword(
    id: string,
    newPassword: string
): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Validate session and role
        await requireRole("ADMIN")

        // 2. Validate input
        const idValid = uuidSchema.safeParse(id)
        if (!idValid.success) {
            return errorResponse("Invalid user ID")
        }

        if (!newPassword || newPassword.length < 6) {
            return errorResponse("Password must be at least 6 characters")
        }

        // 3. Check user exists
        const existing = await prisma.user.findUnique({
            where: { id: idValid.data },
        })

        if (!existing) {
            return errorResponse("User not found", "NOT_FOUND")
        }

        if (existing.deletedAt !== null) {
            return errorResponse("Cannot modify deleted user", "DELETED")
        }

        // 4. Hash new password
        const passwordHash = await hash(newPassword, 12)

        // 5. Update password
        await prisma.user.update({
            where: { id: idValid.data },
            data: { passwordHash },
        })

        return successResponse({ id: idValid.data }, "Password reset successfully")
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }
        return errorResponse("Failed to reset password")
    }
}
