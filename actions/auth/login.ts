"use server"

// ============================================================================
// CAMPUSTRACK - LOGIN SERVER ACTION
// ============================================================================
// Server-side validation before NextAuth authentication
// Actual auth happens via signIn() on client side

export interface LoginResult {
    success: boolean
    error?: string
    redirectUrl?: string
}

/**
 * Server Action: Validate credentials and prepare for login
 * Note: Actual authentication happens via NextAuth client-side signIn
 * This action is for server-side validation and custom logic
 */
export async function loginAction(
    identifier: string,
    password: string
): Promise<LoginResult> {
    // Basic validation
    if (!identifier || !password) {
        return {
            success: false,
            error: "Email/ID and password are required",
        }
    }

    // Identifier can be email OR student/faculty ID - no format validation needed
    // The backend (NextAuth) will determine if it's an email or ID

    // Password minimum length
    if (password.length < 6) {
        return {
            success: false,
            error: "Password must be at least 6 characters",
        }
    }

    // Return success - actual auth will be handled by NextAuth
    return {
        success: true,
    }
}

/**
 * Get role-based redirect URL
 */
export async function getRedirectUrlForRole(
    role: "ADMIN" | "FACULTY" | "STUDENT"
): Promise<string> {
    const roleRoutes = {
        ADMIN: "/dashboard/admin",
        FACULTY: "/dashboard/faculty",
        STUDENT: "/dashboard/student",
    }

    return roleRoutes[role] || "/dashboard/student"
}
