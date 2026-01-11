"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, KeyRound } from "lucide-react"
import { verifyResetOTP, resendResetOTP } from "@/actions/auth/forgot-password"

export default function VerifyOTPPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get("email") || ""

    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [resending, setResending] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds

    // Redirect if no email provided
    useEffect(() => {
        if (!email) {
            router.push("/forgot-password")
        }
    }, [email, router])

    // Countdown timer for OTP expiration
    useEffect(() => {
        if (timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft])

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return

        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [resendCooldown])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // Validate OTP format
            if (otp.length !== 6) {
                setError("Please enter a valid 6-digit code")
                setLoading(false)
                return
            }

            // Verify OTP
            const result = await verifyResetOTP(email, otp)

            if (result.success) {
                // Navigate to password reset page
                router.push(`/forgot-password/reset-password?email=${encodeURIComponent(email)}`)
            } else {
                setError(result.error || "Invalid verification code")
            }
        } catch (err) {
            setError("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResending(true)
        setError("")

        try {
            const result = await resendResetOTP(email)

            if (result.success) {
                setResendCooldown(60) // 60 second cooldown
                setTimeLeft(600) // Reset timer
                setOtp("")
            } else {
                setError(result.error || "Failed to resend code")
            }
        } catch (err) {
            setError("Failed to resend code. Please try again.")
        } finally {
            setResending(false)
        }
    }

    if (!email) {
        return null // Will redirect
    }

    return (
        <AuthLayout
            title="Verify your email"
            description={`We sent a 6-digit code to ${email}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="otp"
                            type="text"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                                setOtp(value)
                            }}
                            className="pl-10 text-center text-2xl tracking-widest font-mono"
                            maxLength={6}
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            Code expires in: <span className="font-medium">{formatTime(timeLeft)}</span>
                        </span>
                        {timeLeft <= 0 && (
                            <span className="text-destructive font-medium">Code expired!</span>
                        )}
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || timeLeft <= 0}>
                    {loading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="text-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResend}
                        disabled={resending || resendCooldown > 0}
                        className="text-sm"
                    >
                        {resending
                            ? "Sending..."
                            : resendCooldown > 0
                                ? `Resend code in ${resendCooldown}s`
                                : "Resend code"}
                    </Button>
                </div>
            </form>

            <div className="mt-6 text-center">
                <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Use different email
                </Link>
            </div>
        </AuthLayout>
    )
}
