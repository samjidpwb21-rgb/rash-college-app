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
    email: string,
    password: string
): Promise<LoginResult> {
    // Basic validation
    if (!email || !password) {
        return {
            success: false,
            error: "Email and password are required",
        }
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return {
            success: false,
            error: "Invalid email format",
        }
    }

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
