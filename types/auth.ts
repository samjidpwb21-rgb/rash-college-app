// ============================================================================
// CAMPUSTRACK - AUTH TYPE DEFINITIONS
// ============================================================================
// TypeScript types for authentication system

// User roles enum (mirrors Prisma enum)
export type UserRole = "ADMIN" | "FACULTY" | "STUDENT"

// Session user object
export interface SessionUser {
    id: string
    email: string
    name: string
    role: UserRole
    avatar?: string | null
}

// Login credentials
export interface LoginCredentials {
    email: string
    password: string
}

// Login result from server action
export interface LoginResult {
    success: boolean
    error?: string
    redirectUrl?: string
}

// Logout result from server action
export interface LogoutResult {
    success: boolean
    redirectUrl: string
}

// Role-based route mapping
export const ROLE_ROUTES: Record<UserRole, string> = {
    ADMIN: "/dashboard/admin",
    FACULTY: "/dashboard/faculty",
    STUDENT: "/dashboard/student",
} as const

// Route access matrix (for reference)
export const ROUTE_ACCESS = {
    "/dashboard/admin": ["ADMIN"] as UserRole[],
    "/dashboard/faculty": ["FACULTY"] as UserRole[],
    "/dashboard/student": ["STUDENT"] as UserRole[],
    "/login": ["PUBLIC"] as const,
    "/": ["PUBLIC"] as const,
} as const
