"use server"

// ============================================================================
// CAMPUSTRACK - SUBJECT COLOR ASSIGNMENT
// Server-side persistent color mapping for timetable consistency
// ============================================================================

import { prisma } from "@/lib/db"
import { getSubjectColor } from "@/lib/subject-colors"

/**
 * Get or assign a persistent color for a subject
 * - Checks database for existing color mapping
 * - If not found, assigns next available color index
 * - Returns Tailwind CSS classes for the color
 * 
 * @param subjectId - UUID of the subject
 * @returns Tailwind CSS color classes (e.g., "bg-blue-100 border-l-4 border-blue-400")
 */
export async function getOrAssignSubjectColor(subjectId: string): Promise<string> {
    try {
        // 1. Check for existing color assignment
        let colorMapping = await prisma.subjectColorMap.findUnique({
            where: { subjectId },
        })

        // 2. If no mapping exists, assign a new color
        if (!colorMapping) {
            // Get the highest colorIndex currently in use
            const highestMapping = await prisma.subjectColorMap.findFirst({
                orderBy: { colorIndex: "desc" },
                select: { colorIndex: true },
            })

            // Assign next sequential color index (starts at 0)
            const nextColorIndex = highestMapping ? highestMapping.colorIndex + 1 : 0

            // Create the mapping (atomic operation)
            colorMapping = await prisma.subjectColorMap.create({
                data: {
                    subjectId,
                    colorIndex: nextColorIndex,
                },
            })
        }

        // 3. Return the color classes
        return getSubjectColor(colorMapping.colorIndex)
    } catch (error) {
        console.error("Error getting/assigning subject color:", error)
        // Fallback to default color on error
        return "bg-gray-100 border-l-4 border-gray-400 text-gray-900"
    }
}

/**
 * Bulk get colors for multiple subjects
 * Optimized to reduce database queries
 * 
 * @param subjectIds - Array of subject UUIDs
 * @returns Map of subjectId -> color classes
 */
export async function getBulkSubjectColors(subjectIds: string[]): Promise<Map<string, string>> {
    const colorMap = new Map<string, string>()

    try {
        // Fetch all existing mappings in one query
        const existingMappings = await prisma.subjectColorMap.findMany({
            where: {
                subjectId: {
                    in: subjectIds,
                },
            },
        })

        // Map existing colors
        const existingSubjectIds = new Set<string>()
        for (const mapping of existingMappings) {
            colorMap.set(mapping.subjectId, getSubjectColor(mapping.colorIndex))
            existingSubjectIds.add(mapping.subjectId)
        }

        // Find subjects without colors
        const missingSubjectIds = subjectIds.filter(id => !existingSubjectIds.has(id))

        // Assign colors to missing subjects
        if (missingSubjectIds.length > 0) {
            // Get highest existing color index
            const highestMapping = await prisma.subjectColorMap.findFirst({
                orderBy: { colorIndex: "desc" },
                select: { colorIndex: true },
            })

            let nextColorIndex = highestMapping ? highestMapping.colorIndex + 1 : 0

            // Create mappings for all missing subjects
            for (const subjectId of missingSubjectIds) {
                const newMapping = await prisma.subjectColorMap.create({
                    data: {
                        subjectId,
                        colorIndex: nextColorIndex,
                    },
                })

                colorMap.set(subjectId, getSubjectColor(newMapping.colorIndex))
                nextColorIndex++
            }
        }

        return colorMap
    } catch (error) {
        console.error("Error getting bulk subject colors:", error)
        // Return empty map on error
        return colorMap
    }
}
