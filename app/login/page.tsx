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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, GraduationCap, Users } from "lucide-react"
import { useLoading } from "@/contexts/loading-context"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [activeRole, setActiveRole] = useState("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { startLoading, finishLoading } = useLoading()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Start global loading animation immediately (login should show loader right away)
    const loaderId = startLoading("login-auth", { immediate: true })

    try {
      // Map UI tab to expected role
      const roleMap: Record<string, string> = {
        student: "STUDENT",
        faculty: "FACULTY",
      }
      const expectedRole = roleMap[activeRole]

      // Use NextAuth signIn with credentials provider
      // Pass expectedRole to backend for validation
      const result = await signIn("credentials", {
        email,
        password,
        expectedRole, // CRITICAL: Backend will validate actual role matches expected
        redirect: false,
      })

      if (result?.error) {
        // Check if error is role-mismatch
        if (result.error.includes("registered as")) {
          setError(result.error) // Show exact role-mismatch message from backend
        } else {
          setError("Invalid email/ID or password")
        }
        setLoading(false)
        finishLoading(loaderId)
        return
      }

      // Get user's actual role from session and redirect accordingly
      // This ensures redirect is based on DB role, not UI tab selection
      const response = await fetch("/api/auth/session")
      const session = await response.json()


      if (session?.user?.role) {
        // Redirect based on ACTUAL role from database
        const roleRoutes: Record<string, string> = {
          STUDENT: "/dashboard/student",
          FACULTY: "/dashboard/faculty",
          ADMIN: "/dashboard/admin",
        }

        const redirectUrl = roleRoutes[session.user.role] || "/dashboard/student"

        // Clear login loading state before redirect
        // This prevents the loader from continuing to loop after dashboard loads
        finishLoading(loaderId)

        router.push(redirectUrl)
        router.refresh()
      } else {
        // Fallback - should not happen if login succeeded
        finishLoading(loaderId) // Clear loading state
        router.push("/dashboard/student")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
      finishLoading(loaderId)
    }
  }

  const roles = [
    { id: "student", label: "Student", icon: GraduationCap },
    { id: "faculty", label: "Faculty", icon: Users },
  ]

  return (
    <AuthLayout title="Welcome back" description="Sign in to access your dashboard">
      <Tabs value={activeRole} onValueChange={setActiveRole} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          {roles.map((role) => (
            <TabsTrigger key={role.id} value={role.id} className="flex items-center gap-2">
              <role.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{role.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {roles.map((role) => (
          <TabsContent key={role.id} value={role.id}>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`email-${role.id}`}>
                  {role.id === "student"
                    ? "Student ID or Email"
                    : role.id === "faculty"
                      ? "Employee ID or Email"
                      : "Email Address"}
                </Label>
                <Input
                  id={`email-${role.id}`}
                  type="text"
                  placeholder={
                    role.id === "student"
                      ? "STU12345 or student@university.edu"
                      : role.id === "faculty"
                        ? "FAC12345 or faculty@university.edu"
                        : "email@university.edu"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`password-${role.id}`}>Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id={`password-${role.id}`}
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
                {loading ? "Signing in..." : `Sign in as ${role.label}`}
              </Button>
            </form>
          </TabsContent>
        ))}
      </Tabs>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Register here
        </Link>
      </p>

      {/* PWA Install Prompt */}
      <div className="mt-8">
        <PwaInstallPrompt variant="login-centered" />
      </div>
    </AuthLayout>
  )
}
