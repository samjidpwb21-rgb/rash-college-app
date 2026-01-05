"use server"

// ============================================================================
// CAMPUSTRACK - SEMESTER MANAGEMENT SERVER ACTIONS
// ============================================================================

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

/**
 * Get all semesters with academic year info
 * ADMIN only
 */
export async function getAllSemesters(): Promise<ActionResult<any[]>> {
    try {
        const session = await getSession()
        if (!session?.user || session.user.role !== "ADMIN") {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        const semesters = await prisma.semester.findMany({
            include: {
                academicYear: true,
            },
            orderBy: {
                number: "asc",
            },
        })

        return successResponse(semesters)
    } catch (error) {
        console.error("Get semesters error:", error)
        return errorResponse("Failed to fetch semesters")
    }
}
