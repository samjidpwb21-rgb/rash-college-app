"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { AuthLayout } from "@/components/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Shield } from "lucide-react"
import { useLoading } from "@/contexts/loading-context"

export default function AdminLoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { startLoading, finishLoading } = useLoading()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        // Start global loading animation
        const loaderId = startLoading("admin-auth")

        try {
            // Use NextAuth signIn with Admin role
            const result = await signIn("credentials", {
                email,
                password,
                expectedRole: "ADMIN", // Only Admin login allowed
                redirect: false,
            })

            if (result?.error) {
                // Check if error is role-mismatch
                if (result.error.includes("registered as")) {
                    setError(result.error)
                } else {
                    setError("Invalid email or password")
                }
                setLoading(false)
                finishLoading(loaderId)
                return
            }

            // Get user's actual role from session
            const response = await fetch("/api/auth/session")
            const session = await response.json()

            if (session?.user?.role === "ADMIN") {
                // Redirect to Admin dashboard
                router.push("/dashboard/admin")
                router.refresh()
                // Note: Don't call finishLoading here - let route change handle it
            } else {
                // User is not an admin
                setError("Access denied. Admin privileges required.")
                await signIn("logout") // Sign out non-admin user
                setLoading(false)
                finishLoading(loaderId)
            }
        } catch (err) {
            setError("An error occurred. Please try again.")
            setLoading(false)
            finishLoading(loaderId)
        }
    }

    return (
        <AuthLayout
            title="Admin Portal"
            description="Secure access for administrators only"
        >
            <div className="mb-6 flex items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                    <Shield className="h-8 w-8 text-primary" />
                </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">Admin Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="admin@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in as Admin"}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                    This is a secure administrator portal.
                    <br />
                    Unauthorized access is prohibited.
                </p>
            </div>

            <div className="mt-4 text-center">
                <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                    ← Back to public login
                </Link>
            </div>
        </AuthLayout>
    )
}
