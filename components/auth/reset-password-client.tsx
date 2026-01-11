"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react"
import { resetPassword } from "@/actions/auth/forgot-password"

export function ResetPasswordClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get("email") || ""

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [passwordMatch, setPasswordMatch] = useState(true)

    // Redirect if no email provided
    useEffect(() => {
        if (!email) {
            router.push("/forgot-password")
        }
    }, [email, router])

    // Check password match in real-time
    useEffect(() => {
        if (confirmPassword) {
            setPasswordMatch(newPassword === confirmPassword)
        } else {
            setPasswordMatch(true)
        }
    }, [newPassword, confirmPassword])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // Validate passwords match
            if (newPassword !== confirmPassword) {
                setError("Passwords do not match")
                setLoading(false)
                return
            }

            // Validate password length
            if (newPassword.length < 6) {
                setError("Password must be at least 6 characters")
                setLoading(false)
                return
            }

            // Reset password
            const result = await resetPassword(email, newPassword)

            if (result.success) {
                // Navigate to success page
                router.push("/forgot-password/success")
            } else {
                setError(result.error || "Failed to reset password")
            }
        } catch (err) {
            setError("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (!email) {
        return null // Will redirect
    }

    return (
        <AuthLayout
            title="Create new password"
            description="Enter a new password for your account"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`pl-10 pr-10 ${!passwordMatch && confirmPassword
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                                }`}
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {!passwordMatch && confirmPassword && (
                        <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                    {passwordMatch && confirmPassword && (
                        <p className="text-xs text-green-600 dark:text-green-400">Passwords match ✓</p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !passwordMatch || !newPassword || !confirmPassword}
                >
                    {loading ? "Resetting password..." : "Reset Password"}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Start over
                </Link>
            </div>
        </AuthLayout>
    )
}
