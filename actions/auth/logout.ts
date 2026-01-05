"use server"

// ============================================================================
// CAMPUSTRACK - LOGOUT SERVER ACTION
// ============================================================================
// Handles session termination

import { getSession } from "@/lib/auth"

/**
 * Server Action: Logout user
 * Clears session and returns redirect URL
 */
export async function logoutAction(): Promise<{
    success: boolean
    redirectUrl: string
}> {
    // Get current session to verify user is logged in
    const session = await getSession()

    if (!session) {
        return {
            success: true,
            redirectUrl: "/login",
        }
    }

    // Session will be cleared by NextAuth signOut on client
    // This action just confirms the logout intent
    return {
        success: true,
        redirectUrl: "/login",
    }
}
