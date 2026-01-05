// ============================================================================
// CAMPUSTRACK - NEXTAUTH CONFIGURATION OPTIONS
// ============================================================================
// Credentials Provider with JWT session strategy
// Role injected into session for RBAC
// Role-strict login enforcement: Users can only log in through their role section

import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"

// Extend NextAuth types for role support
declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: "ADMIN" | "FACULTY" | "STUDENT"
            avatar?: string | null
        }
    }

    interface User {
        id: string
        email: string
        name: string
        role: "ADMIN" | "FACULTY" | "STUDENT"
        avatar?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        email: string
        name: string
        role: "ADMIN" | "FACULTY" | "STUDENT"
        avatar?: string | null
    }
}

export const authOptions: NextAuthOptions = {
    // Use JWT strategy (no database sessions)
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },

    // Custom pages
    pages: {
        signIn: "/login",
        error: "/login",
    },

    // Credentials Provider - email/password authentication
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                expectedRole: { label: "Expected Role", type: "text" }, // UI tab selection
            },

            async authorize(credentials) {
                // Validate input - accept "identifier" (email OR ID) and password
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email/ID and password are required")
                }

                const identifier = credentials.email.toLowerCase().trim()
                const expectedRole = credentials.expectedRole // From UI tab selection
                let user = null

                // Check if identifier is an email (contains @)
                const isEmail = identifier.includes("@")

                if (isEmail) {
                    // Login with email
                    user = await prisma.user.findUnique({
                        where: { email: identifier },
                    })
                } else {
                    // Login with Student ID or Employee ID
                    // Try to find student by enrollmentNo
                    const studentProfile = await prisma.studentProfile.findUnique({
                        where: { enrollmentNo: identifier },
                        include: { user: true },
                    })

                    if (studentProfile) {
                        user = studentProfile.user
                    } else {
                        // Try to find faculty by employeeId
                        const facultyProfile = await prisma.facultyProfile.findUnique({
                            where: { employeeId: identifier },
                            include: { user: true },
                        })

                        if (facultyProfile) {
                            user = facultyProfile.user
                        }
                    }
                }

                // User not found
                if (!user) {
                    throw new Error("Invalid email/ID or password")
                }

                // Check if user is active (not soft-deleted)
                if (!user.isActive || user.deletedAt !== null) {
                    throw new Error("Account is deactivated. Contact administrator.")
                }

                // Verify password
                const isPasswordValid = await compare(credentials.password, user.passwordHash)

                if (!isPasswordValid) {
                    throw new Error("Invalid email/ID or password")
                }

                // ========================================================
                // CRITICAL: Role-Strict Login Enforcement
                // ========================================================
                // User can ONLY log in through their registered role section
                // If expectedRole (from UI tab) doesn't match actualRole (from DB), reject login

                if (expectedRole && user.role !== expectedRole) {
                    // Map role to user-friendly labels
                    const roleLabels: Record<string, string> = {
                        STUDENT: "Student",
                        FACULTY: "Faculty",
                        ADMIN: "Admin",
                    }

                    const actualRoleLabel = roleLabels[user.role] || user.role
                    const expectedRoleLabel = roleLabels[expectedRole] || expectedRole

                    throw new Error(
                        `You are registered as a ${actualRoleLabel.toUpperCase()}. Please sign in using the ${actualRoleLabel} section.`
                    )
                }

                // Return user object (will be passed to JWT callback)
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar,
                }
            },
        }),
    ],

    // Callbacks for JWT and Session
    callbacks: {
        // JWT callback - called when JWT is created or updated
        async jwt({ token, user }) {
            // First sign in - add user data to token
            if (user) {
                token.id = user.id
                token.email = user.email
                token.name = user.name
                token.role = user.role
                token.avatar = user.avatar
            }
            return token
        },

        // Session callback - called when session is accessed
        async session({ session, token }) {
            // Add token data to session
            session.user = {
                id: token.id,
                email: token.email,
                name: token.name,
                role: token.role,
                avatar: token.avatar,
            }
            return session
        },
    },

    // Security options
    secret: process.env.NEXTAUTH_SECRET,

    // Debug in development
    debug: process.env.NODE_ENV === "development",
}
