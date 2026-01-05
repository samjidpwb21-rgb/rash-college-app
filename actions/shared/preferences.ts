"use server"

// ============================================================================
// CAMPUSTRACK - USER PREFERENCES SERVER ACTIONS
// ============================================================================
// Manage user settings like dark mode and notifications
// Automatically creates preferences record if missing

import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { z } from "zod"

// Validation schemas
const updatePreferencesSchema = z.object({
    darkMode: z.boolean().optional(),
    notificationsEnabled: z.boolean().optional(),
})

export type UserPreferencesData = {
    darkMode: boolean
    notificationsEnabled: boolean
}

/**
 * Get current user's preferences
 * Auto-creates default preferences if they don't exist
 */
export async function getMyPreferences(): Promise<ActionResult<UserPreferencesData>> {
    try {
        const user = await getCurrentUser()

        let prefs = await prisma.userPreferences.findUnique({
            where: { userId: user.id },
        })

        // Auto-create if missing
        if (!prefs) {
            prefs = await prisma.userPreferences.create({
                data: {
                    userId: user.id,
                    darkMode: false, // Default to light mode
                    notificationsEnabled: true,
                },
            })
        }

        return successResponse({
            darkMode: prefs.darkMode,
            notificationsEnabled: prefs.notificationsEnabled,
        })
    } catch (error) {
        if (error instanceof Error && error.message.includes("Not authenticated")) {
            return errorResponse("Not authenticated", "UNAUTHORIZED")
        }
        console.error("Failed to fetch preferences:", error)
        return errorResponse("Failed to load preferences")
    }
}

/**
 * Update user preferences
 */
export async function updatePreferences(
    input: z.infer<typeof updatePreferencesSchema>
): Promise<ActionResult<UserPreferencesData>> {
    try {
        const user = await getCurrentUser()

        const validated = updatePreferencesSchema.safeParse(input)
        if (!validated.success) {
            return errorResponse("Invalid input data")
        }

        const prefs = await prisma.userPreferences.upsert({
            where: { userId: user.id },
            update: validated.data,
            create: {
                userId: user.id,
                darkMode: validated.data.darkMode ?? false,
                notificationsEnabled: validated.data.notificationsEnabled ?? true,
            },
        })

        return successResponse({
            darkMode: prefs.darkMode,
            notificationsEnabled: prefs.notificationsEnabled,
        })
    } catch (error) {
        console.error("Failed to update preferences:", error)
        return errorResponse("Failed to update settings")
    }
}
