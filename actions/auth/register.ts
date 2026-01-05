"use server"

// ============================================================================
// CAMPUSTRACK - REGISTRATION SERVER ACTIONS
// ============================================================================
// Public actions for user registration (no auth required)
// Handles Student, Faculty, and Admin registration with proper validation

import { prisma } from "@/lib/db"
import { hash } from "bcryptjs"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Department } from "@prisma/client"

// ============================================================================
// PUBLIC DEPARTMENT LOOKUP (for registration dropdown)
// ============================================================================

/**
 * Get all departments for dropdown during registration
 * PUBLIC - No authentication required
 */
export async function getPublicDepartments(): Promise<ActionResult<Department[]>> {
    try {
        const departments = await prisma.department.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                code: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return successResponse(departments)
    } catch (error) {
        console.error("Public departments fetch error:", error)
        return errorResponse("Failed to load departments")
    }
}

// ============================================================================
// REGISTRATION ACTIONS
// ============================================================================

interface RegisterStudentInput {
    fullName: string
    email: string
    password: string
    confirmPassword?: string // Optional for server validation
    studentId: string
    departmentId: string
    semesterId: string
}

interface RegisterFacultyInput {
    fullName: string
    email: string
    password: string
    confirmPassword?: string // Optional for server validation
    employeeId: string
    departmentId: string
    designation: string
}

interface RegisterAdminInput {
    fullName: string
    email: string
    password: string
    confirmPassword?: string // Optional for server validation
}

/**
 * Register a new student
 * PUBLIC - No authentication required
 */
export async function registerStudent(
    input: RegisterStudentInput
): Promise<ActionResult<{ userId: string }>> {
    try {
        // 1. Validate input - ALL fields required
        if (!input.fullName || !input.email || !input.password || !input.studentId || !input.departmentId || !input.semesterId) {
            return errorResponse("All fields are required")
        }

        // Server-side password confirmation check (if provided)
        if (input.confirmPassword && input.password !== input.confirmPassword) {
            return errorResponse("Passwords do not match")
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(input.email)) {
            return errorResponse("Invalid email format")
        }

        // Password minimum length
        if (input.password.length < 6) {
            return errorResponse("Password must be at least 6 characters")
        }

        // 2. Check for duplicates
        const existingEmail = await prisma.user.findUnique({
            where: { email: input.email.toLowerCase().trim() },
        })

        if (existingEmail) {
            return errorResponse("Email already registered")
        }

        const existingStudentId = await prisma.studentProfile.findUnique({
            where: { enrollmentNo: input.studentId },
        })

        if (existingStudentId) {
            return errorResponse("Student ID already exists")
        }

        // 3. Hash password
        const passwordHash = await hash(input.password, 10)

        // 4. Create user + student profile in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email: input.email.toLowerCase().trim(),
                    passwordHash,
                    name: input.fullName,
                    role: "STUDENT",
                    isActive: true,
                },
            })

            // Create student profile
            await tx.studentProfile.create({
                data: {
                    userId: user.id,
                    enrollmentNo: input.studentId,
                    departmentId: input.departmentId,
                    semesterId: input.semesterId,
                },
            })

            return { userId: user.id }
        })

        return successResponse(result, "Registration successful! Please log in.")
    } catch (error: any) {
        console.error("Student registration error:", error)

        // Handle Prisma unique constraint violations
        if (error.code === "P2002") {
            const target = error.meta?.target?.[0]
            if (target === "email") {
                return errorResponse("Email already registered")
            } else if (target === "enrollmentNo") {
                return errorResponse("Student ID already exists")
            }
        }

        return errorResponse("Registration failed. Please try again.")
    }
}

/**
 * Register a new faculty member
 * PUBLIC - No authentication required
 */
export async function registerFaculty(
    input: RegisterFacultyInput
): Promise<ActionResult<{ userId: string }>> {
    try {
        // 1. Validate input - ALL fields required
        if (!input.fullName || !input.email || !input.password || !input.employeeId || !input.departmentId || !input.designation) {
            return errorResponse("All fields are required")
        }

        // Server-side password confirmation check (if provided)
        if (input.confirmPassword && input.password !== input.confirmPassword) {
            return errorResponse("Passwords do not match")
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(input.email)) {
            return errorResponse("Invalid email format")
        }

        // Password minimum length
        if (input.password.length < 6) {
            return errorResponse("Password must be at least 6 characters")
        }

        // 2. Check for duplicates
        const existingEmail = await prisma.user.findUnique({
            where: { email: input.email.toLowerCase().trim() },
        })

        if (existingEmail) {
            return errorResponse("Email already registered")
        }

        const existingEmployeeId = await prisma.facultyProfile.findUnique({
            where: { employeeId: input.employeeId },
        })

        if (existingEmployeeId) {
            return errorResponse("Employee ID already exists")
        }

        // 3. Hash password
        const passwordHash = await hash(input.password, 10)

        // 4. Create user + faculty profile in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email: input.email.toLowerCase().trim(),
                    passwordHash,
                    name: input.fullName,
                    role: "FACULTY",
                    isActive: true,
                },
            })

            // Create faculty profile
            await tx.facultyProfile.create({
                data: {
                    userId: user.id,
                    employeeId: input.employeeId,
                    departmentId: input.departmentId,
                    designation: input.designation,
                },
            })

            return { userId: user.id }
        })

        return successResponse(result, "Registration successful! Please log in.")
    } catch (error: any) {
        console.error("Faculty registration error:", error)

        // Handle Prisma unique constraint violations
        if (error.code === "P2002") {
            const target = error.meta?.target?.[0]
            if (target === "email") {
                return errorResponse("Email already registered")
            } else if (target === "employeeId") {
                return errorResponse("Employee ID already exists")
            }
        }

        return errorResponse("Registration failed. Please try again.")
    }
}

/**
 * Register a new admin
 * PUBLIC - No authentication required
 */
export async function registerAdmin(
    input: RegisterAdminInput
): Promise<ActionResult<{ userId: string }>> {
    try {
        // 1. Validate input - ALL fields required
        if (!input.fullName || !input.email || !input.password) {
            return errorResponse("All fields are required")
        }

        // Server-side password confirmation check (if provided)
        if (input.confirmPassword && input.password !== input.confirmPassword) {
            return errorResponse("Passwords do not match")
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(input.email)) {
            return errorResponse("Invalid email format")
        }

        // Password minimum length
        if (input.password.length < 6) {
            return errorResponse("Password must be at least 6 characters")
        }

        // 2. Check for duplicate email
        const existingEmail = await prisma.user.findUnique({
            where: { email: input.email.toLowerCase().trim() },
        })

        if (existingEmail) {
            return errorResponse("Email already registered")
        }

        // 3. Hash password
        const passwordHash = await hash(input.password, 10)

        // 4. Create admin user (no profile needed)
        const user = await prisma.user.create({
            data: {
                email: input.email.toLowerCase().trim(),
                passwordHash,
                name: input.fullName,
                role: "ADMIN",
                isActive: true,
            },
        })

        return successResponse({ userId: user.id }, "Registration successful! Please log in.")
    } catch (error: any) {
        console.error("Admin registration error:", error)

        // Handle Prisma unique constraint violations
        if (error.code === "P2002") {
            return errorResponse("Email already registered")
        }

        return errorResponse("Registration failed. Please try again.")
    }
}
