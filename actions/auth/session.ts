"use server"

// ============================================================================
// CAMPUSTRACK - SESSION SERVER ACTION
// ============================================================================
// Session utilities for Server Components and Actions

import { getSession, getCurrentUser } from "@/lib/auth"

/**
 * Get current session data safely
 * Returns null if not authenticated
 */
export async function getSessionAction() {
    const session = await getSession()

    if (!session?.user) {
        return null
    }

    return {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        avatar: session.user.avatar,
    }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticatedAction(): Promise<boolean> {
    const session = await getSession()
    return !!session?.user
}

/**
 * Check if user has specific role
 */
export async function hasRoleAction(
    role: "ADMIN" | "FACULTY" | "STUDENT"
): Promise<boolean> {
    const session = await getSession()
    return session?.user?.role === role
}
