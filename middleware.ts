// ============================================================================
// CAMPUSTRACK - MIDDLEWARE (ROUTE PROTECTION & RBAC)
// ============================================================================
// Runs BEFORE every request to protected routes
// Enforces authentication and role-based access control

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Define role-based route access
const ROLE_ROUTES = {
    ADMIN: "/dashboard/admin",
    FACULTY: "/dashboard/faculty",
    STUDENT: "/dashboard/student",
} as const

type Role = keyof typeof ROLE_ROUTES

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Get JWT token from request
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    })

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC ROUTES - Allow access without authentication
    // ─────────────────────────────────────────────────────────────────────────

    // Login page - redirect to dashboard if already authenticated
    if (pathname === "/login") {
        if (token) {
            const role = token.role as Role
            const redirectUrl = ROLE_ROUTES[role] || "/dashboard/student"
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
        return NextResponse.next()
    }

    // API auth routes - always public (NextAuth handles these)
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next()
    }

    // Root page - redirect based on auth status
    if (pathname === "/") {
        if (token) {
            const role = token.role as Role
            const redirectUrl = ROLE_ROUTES[role] || "/dashboard/student"
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
        return NextResponse.redirect(new URL("/login", request.url))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROTECTED ROUTES - Require authentication
    // ─────────────────────────────────────────────────────────────────────────

    // Check if accessing any dashboard route
    if (pathname.startsWith("/dashboard")) {
        // Not authenticated - redirect to login
        if (!token) {
            const loginUrl = new URL("/login", request.url)
            loginUrl.searchParams.set("callbackUrl", pathname)
            return NextResponse.redirect(loginUrl)
        }

        const userRole = token.role as Role

        // ─────────────────────────────────────────────────────────────────────
        // ROLE-BASED ACCESS CONTROL (RBAC)
        // ─────────────────────────────────────────────────────────────────────

        // Admin routes - ADMIN only
        if (pathname.startsWith("/dashboard/admin")) {
            if (userRole !== "ADMIN") {
                // Redirect to user's own dashboard (prevent role escalation)
                return NextResponse.redirect(new URL(ROLE_ROUTES[userRole], request.url))
            }
        }

        // Faculty routes - FACULTY only
        if (pathname.startsWith("/dashboard/faculty")) {
            if (userRole !== "FACULTY") {
                return NextResponse.redirect(new URL(ROLE_ROUTES[userRole], request.url))
            }
        }

        // Student routes - STUDENT only
        if (pathname.startsWith("/dashboard/student")) {
            if (userRole !== "STUDENT") {
                return NextResponse.redirect(new URL(ROLE_ROUTES[userRole], request.url))
            }
        }

        // Authenticated and authorized - allow access
        return NextResponse.next()
    }

    // All other routes - allow (static files, etc.)
    return NextResponse.next()
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE MATCHER
// ─────────────────────────────────────────────────────────────────────────────
// Only run middleware on these routes (improves performance)

export const config = {
    matcher: [
        // Match root
        "/",
        // Match login
        "/login",
        // Match all dashboard routes
        "/dashboard/:path*",
        // Match API routes (for auth)
        "/api/:path*",
    ],
}
