// ============================================================================
// CAMPUSTRACK - AUTH UTILITIES
// ============================================================================
// Helper functions for accessing session in Server Actions

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

/**
 * Get current session in Server Actions
 * Returns null if not authenticated
 */
export async function getSession() {
    return await getServerSession(authOptions)
}

/**
 * Get current user from session
 * Throws error if not authenticated
 */
export async function getCurrentUser() {
    const session = await getSession()

    if (!session?.user) {
        throw new Error("Not authenticated")
    }

    return session.user
}

/**
 * Check if current user has required role
 * Returns true/false without throwing
 */
export async function hasRole(requiredRole: "ADMIN" | "FACULTY" | "STUDENT") {
    const session = await getSession()
    return session?.user?.role === requiredRole
}

/**
 * Require specific role - throws if unauthorized
 * Use in Server Actions for role validation
 */
export async function requireRole(requiredRole: "ADMIN" | "FACULTY" | "STUDENT") {
    const session = await getSession()

    if (!session?.user) {
        throw new Error("Not authenticated")
    }

    if (session.user.role !== requiredRole) {
        throw new Error(`Unauthorized: ${requiredRole} role required`)
    }

    return session.user
}

/**
 * Require any of the specified roles
 * Use when multiple roles can access a resource
 */
export async function requireAnyRole(roles: Array<"ADMIN" | "FACULTY" | "STUDENT">) {
    const session = await getSession()

    if (!session?.user) {
        throw new Error("Not authenticated")
    }

    if (!roles.includes(session.user.role)) {
        throw new Error(`Unauthorized: One of ${roles.join(", ")} roles required`)
    }

    return session.user
}
