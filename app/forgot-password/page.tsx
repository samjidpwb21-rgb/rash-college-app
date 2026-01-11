"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail } from "lucide-react"
import { initiatePasswordReset } from "@/actions/auth/forgot-password"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess(false)

        try {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                setError("Please enter a valid email address")
                setLoading(false)
                return
            }

            // Call server action
            const result = await initiatePasswordReset(email)

            if (result.success) {
                setSuccess(true)
                // Navigate to OTP verification page after 2 seconds
                setTimeout(() => {
                    router.push(`/forgot-password/verify-otp?email=${encodeURIComponent(email)}`)
                }, 2000)
            } else {
                setError(result.error || "Failed to send reset code. Please try again.")
            }
        } catch (err) {
            setError("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Forgot password?"
            description="Enter your email address and we'll send you a password reset code"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
                        Reset code sent! Redirecting to verification...
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="your.email@university.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            required
                            disabled={success}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Enter the email address associated with your account
                    </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading || success}>
                    {loading ? "Sending..." : "Send Reset Code"}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                </Link>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                    Register here
                </Link>
            </p>
        </AuthLayout>
    )
}
