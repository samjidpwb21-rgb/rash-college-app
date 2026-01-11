"use server"

// ============================================================================
// OTP VERIFICATION SERVER ACTIONS
// ============================================================================
// Generate, send, and verify OTP codes for email verification during registration

import { prisma } from "@/lib/db"
import { sendOTPEmail } from "@/lib/email"
import { ActionResult, successResponse, errorResponse } from "@/types/api"

// OTP Configuration
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
 * Send OTP to email address
 * Invalidates any previous OTPs for the same email
 */
export async function sendOTP(email: string): Promise<ActionResult<{ sent: boolean }>> {
    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return errorResponse("Invalid email format")
        }

        // Generate OTP
        const otp = generateOTP()
        const expiresAt = getExpirationTime()

        // Delete any existing unverified tokens for this email
        await prisma.verificationToken.deleteMany({
            where: {
                email: email.toLowerCase().trim(),
                verified: false,
            },
        })

        // Store new OTP
        await prisma.verificationToken.create({
            data: {
                email: email.toLowerCase().trim(),
                token: otp,
                expiresAt,
                verified: false,
            },
        })

        // Send OTP via email
        const sent = await sendOTPEmail(email, otp)

        if (!sent) {
            return errorResponse("Failed to send verification code. Please try again.")
        }

        return successResponse(
            { sent: true },
            `Verification code sent to ${email}. Please check your inbox.`
        )
    } catch (error) {
        console.error("Send OTP error:", error)
        return errorResponse("Failed to send verification code. Please try again.")
    }
}

/**
 * Verify OTP code
 * Marks token as verified if valid
 */
export async function verifyOTP(
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

        // Find the token
        const token = await prisma.verificationToken.findFirst({
            where: {
                email: email.toLowerCase().trim(),
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

        return successResponse({ verified: true }, "Email verified successfully!")
    } catch (error) {
        console.error("Verify OTP error:", error)
        return errorResponse("Failed to verify code. Please try again.")
    }
}

/**
 * Resend OTP (same as sendOTP but with different messaging)
 */
export async function resendOTP(email: string): Promise<ActionResult<{ sent: boolean }>> {
    try {
        // Use the same logic as sendOTP
        const result = await sendOTP(email)

        if (result.success) {
            return successResponse(
                { sent: true },
                "New verification code sent. Please check your email."
            )
        }

        return result
    } catch (error) {
        console.error("Resend OTP error:", error)
        return errorResponse("Failed to resend verification code. Please try again.")
    }
}

/**
 * Check if email has a verified OTP
 * Used by registration to confirm email ownership
 */
export async function checkEmailVerified(email: string): Promise<boolean> {
    try {
        const verifiedToken = await prisma.verificationToken.findFirst({
            where: {
                email: email.toLowerCase().trim(),
                verified: true,
                expiresAt: { gte: new Date() },
            },
        })

        return !!verifiedToken
    } catch (error) {
        console.error("Check email verified error:", error)
        return false
    }
}
