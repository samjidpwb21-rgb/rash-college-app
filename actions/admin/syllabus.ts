"use server"

// ============================================================================
// CAMPUSTRACK - SYLLABUS MANAGEMENT SERVER ACTIONS
// Admin-only syllabus upload/delete with strict validation
// ============================================================================

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { existsSync, mkdirSync } from "fs"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "syllabus")
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPE = "application/pdf"

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true })
}

// ============================================================================
// UPLOAD SYLLABUS
// Admin-only, validates PDF, max size, and enforces unique constraint
// ============================================================================

export async function uploadSyllabus(
    departmentId: string,
    semesterId: string,
    formData: FormData
): Promise<ActionResult<any>> {
    try {
        // 1. Validate session and role
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }

        // 2. Get file from form data
        const file = formData.get("file") as File | null
        if (!file) {
            return errorResponse("No file provided")
        }

        // 3. Validate file type
        if (file.type !== ALLOWED_TYPE) {
            return errorResponse("Invalid file type. Only PDF files are allowed.")
        }

        // 4. Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return errorResponse(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
        }

        // 5. Validate department exists
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            select: { id: true, code: true, name: true },
        })

        if (!department) {
            return errorResponse("Department not found", "NOT_FOUND")
        }

        // 6. Validate semester exists
        const semester = await prisma.semester.findUnique({
            where: { id: semesterId },
            select: { id: true, number: true, name: true },
        })

        if (!semester) {
            return errorResponse("Semester not found", "NOT_FOUND")
        }

        // 7. Check for existing syllabus
        const existing = await prisma.syllabus.findUnique({
            where: {
                departmentId_semesterId: {
                    departmentId,
                    semesterId,
                },
            },
        })

        // If exists, delete old file first
        if (existing) {
            const oldFilePath = join(process.cwd(), "public", existing.fileUrl)
            try {
                if (existsSync(oldFilePath)) {
                    await unlink(oldFilePath)
                }
            } catch (error) {
                console.error("Error deleting old file:", error)
                // Continue anyway - DB will be updated
            }
        }

        // 8. Generate filename
        const timestamp = Date.now()
        const fileName = `${department.code}_SEM${semester.number}_${timestamp}.pdf`
        const filePath = join(UPLOAD_DIR, fileName)
        const fileUrl = `/uploads/syllabus/${fileName}`

        // 9. Save file to disk
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // 10. Save/Update database record
        const syllabus = await prisma.syllabus.upsert({
            where: {
                departmentId_semesterId: {
                    departmentId,
                    semesterId,
                },
            },
            update: {
                fileName,
                fileUrl,
                uploadedBy: session.user.id || "",
                uploadedAt: new Date(),
            },
            create: {
                departmentId,
                semesterId,
                fileName,
                fileUrl,
                uploadedBy: session.user.id || "",
            },
            include: {
                department: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
                semester: {
                    select: {
                        number: true,
                        name: true,
                    },
                },
            },
        })

        return successResponse(
            syllabus,
            existing ? "Syllabus replaced successfully" : "Syllabus uploaded successfully"
        )
    } catch (error) {
        console.error("Upload syllabus error:", error)
        return errorResponse("Failed to upload syllabus")
    }
}

// ============================================================================
// GET SYLLABUS FOR DEPARTMENT (ALL SEMESTERS)
// Admin-only
// ============================================================================

export async function getDepartmentSyllabi(departmentId: string): Promise<ActionResult<any[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const syllabi = await prisma.syllabus.findMany({
            where: { departmentId },
            include: {
                semester: {
                    select: {
                        id: true,
                        number: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                semester: {
                    number: "asc",
                },
            },
        })

        return successResponse(syllabi)
    } catch (error) {
        console.error("Get syllabi error:", error)
        return errorResponse("Failed to fetch syllabi")
    }
}

// ============================================================================
// GET SINGLE SYLLABUS
// Accessible by Admin, Faculty, and Students (with role-based filtering)
// ============================================================================

export async function getSyllabus(
    departmentId: string,
    semesterId: string
): Promise<ActionResult<any>> {
    try {
        const session = await getSession()
        if (!session?.user) {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        // For students - verify they belong to this department and semester
        if (session.user.role === "STUDENT") {
            const student = await prisma.studentProfile.findFirst({
                where: {
                    userId: session.user.id,
                    departmentId,
                    semesterId,
                },
            })

            if (!student) {
                return errorResponse("Access denied: Not your semester", "FORBIDDEN")
            }
        }

        // For faculty - verify they teach in this department
        if (session.user.role === "FACULTY") {
            const faculty = await prisma.facultyProfile.findFirst({
                where: {
                    userId: session.user.id,
                    departmentId,
                },
            })

            if (!faculty) {
                return errorResponse("Access denied: Not your department", "FORBIDDEN")
            }
        }

        const syllabus = await prisma.syllabus.findUnique({
            where: {
                departmentId_semesterId: {
                    departmentId,
                    semesterId,
                },
            },
            include: {
                department: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
                semester: {
                    select: {
                        number: true,
                        name: true,
                    },
                },
            },
        })

        if (!syllabus) {
            return errorResponse("Syllabus not found", "NOT_FOUND")
        }

        return successResponse(syllabus)
    } catch (error) {
        console.error("Get syllabus error:", error)
        return errorResponse("Failed to fetch syllabus")
    }
}

// ============================================================================
// DELETE SYLLABUS
// Admin-only, removes file and database record
// ============================================================================

export async function deleteSyllabus(syllabusId: string): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Validate session and role
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized: Admin access required", "UNAUTHORIZED")
        }

        // 2. Get syllabus record
        const syllabus = await prisma.syllabus.findUnique({
            where: { id: syllabusId },
        })

        if (!syllabus) {
            return errorResponse("Syllabus not found", "NOT_FOUND")
        }

        // 3. Delete file from disk
        const filePath = join(process.cwd(), "public", syllabus.fileUrl)
        try {
            if (existsSync(filePath)) {
                await unlink(filePath)
            }
        } catch (error) {
            console.error("Error deleting file:", error)
            // Continue with DB deletion even if file deletion fails
        }

        // 4. Delete database record
        await prisma.syllabus.delete({
            where: { id: syllabusId },
        })

        return successResponse({ id: syllabusId }, "Syllabus deleted successfully")
    } catch (error) {
        console.error("Delete syllabus error:", error)
        return errorResponse("Failed to delete syllabus")
    }
}
