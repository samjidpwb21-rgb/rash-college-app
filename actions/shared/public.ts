"use server"

// ============================================================================
// CAMPUSTRACK - PUBLIC DATA FOR REGISTRATION
// ============================================================================
// Public actions to fetch reference data for registration form

import { prisma } from "@/lib/db"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { Semester } from "@prisma/client"

/**
 * Get all semesters for dropdown during registration
 * PUBLIC - No authentication required
 */
export async function getPublicSemesters(): Promise<ActionResult<Semester[]>> {
    try {
        const semesters = await prisma.semester.findMany({
            orderBy: { number: "asc" },
            include: {
                academicYear: {
                    select: { name: true },
                },
            },
        })

        return successResponse(semesters)
    } catch (error) {
        console.error("Public semesters fetch error:", error)
        return errorResponse("Failed to load semesters")
    }
}
