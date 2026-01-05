"use server"

// ============================================================================
// CAMPUSTRACK - NOTICE COLOR ASSIGNMENT
// Server-side persistent color mapping for notice board consistency
// Reuses the same color system as subjects
// ============================================================================

import { prisma } from "@/lib/db"
import { getSubjectColor } from "@/lib/subject-colors"

/**
 * Get or assign a persistent color for a notice
 * - Checks colorIndex in Notice record
 * - If colorIndex is 0 or null, assigns next available from global pool
 * - Returns Tailwind CSS classes for the color
 * 
 * @param noticeId - UUID of the notice
 * @returns Tailwind CSS color classes
 */
export async function getOrAssignNoticeColor(noticeId: string): Promise<string> {
    try {
        // 1. Check notice's current colorIndex
        const notice = await prisma.notice.findUnique({
            where: { id: noticeId },
            select: { colorIndex: true },
        })

        if (!notice) {
            return "bg-gray-100 border-l-4 border-gray-400 text-gray-900"
        }

        // 2. If already has a color, return it
        if (notice.colorIndex !== null && notice.colorIndex > 0) {
            return getSubjectColor(notice.colorIndex)
        }

        // 3. Assign new color from global pool
        // Get highest colorIndex from both subjects AND notices
        const [highestSubject, highestNotice] = await Promise.all([
            prisma.subjectColorMap.findFirst({
                orderBy: { colorIndex: "desc" },
                select: { colorIndex: true },
            }),
            prisma.notice.findFirst({
                where: { colorIndex: { not: null } },
                orderBy: { colorIndex: "desc" },
                select: { colorIndex: true },
            }),
        ])

        const maxSubjectIndex = highestSubject?.colorIndex ?? -1
        const maxNoticeIndex = highestNotice?.colorIndex ?? -1
        const nextColorIndex = Math.max(maxSubjectIndex, maxNoticeIndex) + 1

        // 4. Update notice with new color
        await prisma.notice.update({
            where: { id: noticeId },
            data: { colorIndex: nextColorIndex },
        })

        return getSubjectColor(nextColorIndex)
    } catch (error) {
        console.error("Error getting/assigning notice color:", error)
        return "bg-gray-100 border-l-4 border-gray-400 text-gray-900"
    }
}

/**
 * Bulk get colors for multiple notices
 * @param notices - Array of notices with colorIndex
 * @returns Map of noticeId -> color classes
 */
export async function getBulkNoticeColors(
    notices: Array<{ id: string; colorIndex: number | null }>
): Promise<Map<string, string>> {
    const colorMap = new Map<string, string>()

    for (const notice of notices) {
        if (notice.colorIndex !== null && notice.colorIndex > 0) {
            colorMap.set(notice.id, getSubjectColor(notice.colorIndex))
        } else {
            // Assign color on-the-fly if needed
            const color = await getOrAssignNoticeColor(notice.id)
            colorMap.set(notice.id, color)
        }
    }

    return colorMap
}
