// ============================================================================
// CAMPUSTRACK - ZOD VALIDATION SCHEMAS
// ============================================================================
// Centralized validation schemas for all Server Actions

import { z } from "zod"

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const uuidSchema = z.string().uuid("Invalid ID format")

export const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
})

export const dateSchema = z.string().refine((val) => {
    const date = new Date(val)
    return !isNaN(date.getTime())
}, "Invalid date format")

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const createUserSchema = z.object({
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    role: z.enum(["ADMIN", "FACULTY", "STUDENT"]),
})

export const updateUserSchema = z.object({
    id: uuidSchema,
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    isActive: z.boolean().optional(),
})

// ============================================================================
// DEPARTMENT SCHEMAS
// ============================================================================

export const createDepartmentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    code: z.string().min(2, "Code must be at least 2 characters").max(10).toUpperCase(),
    description: z.string().max(500).optional(),
})

export const updateDepartmentSchema = z.object({
    id: uuidSchema,
    name: z.string().min(2).max(100).optional(),
    code: z.string().min(2).max(10).toUpperCase().optional(),
    description: z.string().max(500).optional(),
})

// ============================================================================
// SUBJECT SCHEMAS
// ============================================================================

export const createSubjectSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters").max(10).toUpperCase(),
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    credits: z.number().int().positive().max(10).default(3),
    type: z.enum(["THEORY", "PRACTICAL"]).default("THEORY"),
    description: z.string().max(500).optional(),
    departmentId: uuidSchema,
    semesterId: uuidSchema,
})

export const updateSubjectSchema = z.object({
    id: uuidSchema,
    code: z.string().min(2).max(10).toUpperCase().optional(),
    name: z.string().min(2).max(100).optional(),
    credits: z.number().int().positive().max(10).optional(),
    type: z.enum(["THEORY", "PRACTICAL"]).optional(),
    description: z.string().max(500).optional(),
})

// ============================================================================
// NOTICE SCHEMAS
// ============================================================================

export const createNoticeSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(200),
    content: z.string().min(10, "Content must be at least 10 characters"),
    isImportant: z.boolean().default(false),
    expiresAt: z.string().datetime().optional(),
})

export const updateNoticeSchema = z.object({
    id: uuidSchema,
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(10).optional(),
    isImportant: z.boolean().optional(),
    expiresAt: z.string().datetime().optional().nullable(),
})

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const createEventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(200),
    description: z.string().max(1000).optional(),
    eventDate: z.string().refine((val) => {
        const date = new Date(val)
        return !isNaN(date.getTime())
    }, "Invalid date format"),
    eventTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z.string().max(100).optional(),
    isAllDay: z.boolean().default(false),
})

export const updateEventSchema = z.object({
    id: uuidSchema,
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(1000).optional(),
    eventDate: z.string().optional(),
    eventTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    location: z.string().max(100).optional(),
    isAllDay: z.boolean().optional(),
})

// ============================================================================
// ATTENDANCE SCHEMAS
// ============================================================================

// Single period attendance
export const attendanceRecordSchema = z.object({
    studentId: uuidSchema,
    period: z.number().int().min(1).max(5),
    status: z.enum(["PRESENT", "ABSENT"]),
})

// Faculty marks attendance for all students, all 5 periods at once
export const markAttendanceSchema = z.object({
    subjectId: uuidSchema,
    date: z.string().refine((val) => {
        const date = new Date(val)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        // Cannot mark future attendance
        return !isNaN(date.getTime()) && date <= today
    }, "Cannot mark attendance for future dates"),
    records: z.array(attendanceRecordSchema).min(1, "At least one record required"),
})

// Student attendance query
export const getStudentAttendanceSchema = z.object({
    date: dateSchema.optional(),
    subjectId: uuidSchema.optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
})

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const createNotificationSchema = z.object({
    userId: uuidSchema,
    type: z.enum(["ATTENDANCE", "NOTICE", "EVENT", "SYSTEM"]),
    title: z.string().max(200),
    message: z.string(),
    link: z.string().max(500).optional(),
})

export const markNotificationReadSchema = z.object({
    notificationId: uuidSchema,
})

// ============================================================================
// TIMETABLE SCHEMAS
// ============================================================================

export const getTimetableSchema = z.object({
    dayOfWeek: z.number().int().min(1).max(6).optional(),
    semesterId: uuidSchema.optional(),
})
