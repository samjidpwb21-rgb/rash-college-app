"use server"

// ============================================================================
// FORGOT PASSWORD SERVER ACTIONS
// ============================================================================
// Email-based OTP verification for secure password reset
// Reuses existing VerificationToken infrastructure from registration

import { prisma } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import { hash } from "bcryptjs"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

// OTP Configuration (matches registration OTP)
const OTP_EXPIRY_MINUTES = 10
const OTP_LENGTH = 6

/**
 * Generate a secure 6-digit OTP
 */
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Calculate OTP expiration timestamp
 */
function getExpirationTime(): Date {
    const now = new Date()
    now.setMinutes(now.getMinutes() + OTP_EXPIRY_MINUTES)
    return now
}

/**
 * STAGE 1: Initiate password reset request
 * Validates email exists and sends OTP
 * SECURITY: No user enumeration - same response for valid/invalid emails
 */
export async function initiatePasswordReset(
    email: string
): Promise<ActionResult<{ sent: boolean }>> {
    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return errorResponse("Invalid email format")
        }

        const normalizedEmail = email.toLowerCase().trim()

        // Check if user exists (but don't reveal this in response)
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        })

        // SECURITY: Always return success to prevent user enumeration
        // Only send email if user actually exists
        if (user) {
            // Generate OTP
            const otp = generateOTP()
            const expiresAt = getExpirationTime()

            // Delete any existing unverified tokens for this email
            await prisma.verificationToken.deleteMany({
                where: {
                    email: normalizedEmail,
                    verified: false,
                },
            })

            // Store new OTP
            await prisma.verificationToken.create({
                data: {
                    email: normalizedEmail,
                    token: otp,
                    expiresAt,
                    verified: false,
                },
            })

            // Send password reset email
            await sendPasswordResetEmail(normalizedEmail, otp)
        }

        // Always return success (even if user doesn't exist)
        return successResponse(
            { sent: true },
            "If an account exists with this email, a password reset code has been sent."
        )
    } catch (error) {
        console.error("Password reset initiation error:", error)
        return errorResponse("Failed to process request. Please try again.")
    }
}

/**
 * STAGE 2: Verify OTP code
 * Validates OTP is correct and not expired
 */
export async function verifyResetOTP(
    email: string,
    otp: string
): Promise<ActionResult<{ verified: boolean }>> {
    try {
        // Validate inputs
        if (!email || !otp) {
            return errorResponse("Email and verification code are required")
        }

        if (otp.length !== OTP_LENGTH) {
            return errorResponse("Invalid verification code format")
        }

        const normalizedEmail = email.toLowerCase().trim()

        // Find the token
        const token = await prisma.verificationToken.findFirst({
            where: {
                email: normalizedEmail,
                token: otp,
                verified: false,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        if (!token) {
            return errorResponse("Invalid verification code")
        }

        // Check if expired
        if (new Date() > token.expiresAt) {
            // Delete expired token
            await prisma.verificationToken.delete({
                where: { id: token.id },
            })
            return errorResponse("Verification code expired. Please request a new one.")
        }

        // Mark as verified
        await prisma.verificationToken.update({
            where: { id: token.id },
            data: { verified: true },
        })

        return successResponse({ verified: true }, "Code verified successfully!")
    } catch (error) {
        console.error("OTP verification error:", error)
        return errorResponse("Failed to verify code. Please try again.")
    }
}

/**
 * STAGE 3: Reset password
 * Updates user password after OTP verification
 * CRITICAL: Only works if OTP was recently verified
 */
export async function resetPassword(
    email: string,
    newPassword: string
): Promise<ActionResult<{ reset: boolean }>> {
    try {
        // Validate inputs
        if (!email || !newPassword) {
            return errorResponse("Email and new password are required")
        }

        // Password minimum length (matches registration)
        if (newPassword.length < 6) {
            return errorResponse("Password must be at least 6 characters")
        }

        const normalizedEmail = email.toLowerCase().trim()

        // CRITICAL: Verify that OTP was confirmed for this email
        const verifiedToken = await prisma.verificationToken.findFirst({
            where: {
                email: normalizedEmail,
                verified: true,
                expiresAt: { gte: new Date() },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        if (!verifiedToken) {
            return errorResponse(
                "Verification required. Please verify your email first."
            )
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        })

        if (!user) {
            return errorResponse("User not found")
        }

        // Hash the new password
        const passwordHash = await hash(newPassword, 10)

        // Update password in transaction
        await prisma.$transaction(async (tx) => {
            // Update user password
            await tx.user.update({
                where: { id: user.id },
                data: { passwordHash },
            })

            // Delete all verification tokens for this email (security cleanup)
            await tx.verificationToken.deleteMany({
                where: { email: normalizedEmail },
            })
        })

        return successResponse(
            { reset: true },
            "Password reset successfully! You can now log in with your new password."
        )
    } catch (error) {
        console.error("Password reset error:", error)
        return errorResponse("Failed to reset password. Please try again.")
    }
}

/**
 * Resend OTP for password reset
 */
export async function resendResetOTP(
    email: string
): Promise<ActionResult<{ sent: boolean }>> {
    try {
        // Use the same logic as initiatePasswordReset
        return await initiatePasswordReset(email)
    } catch (error) {
        console.error("Resend OTP error:", error)
        return errorResponse("Failed to resend code. Please try again.")
    }
}
