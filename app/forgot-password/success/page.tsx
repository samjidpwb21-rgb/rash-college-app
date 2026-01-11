"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth-layout"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function SuccessPage() {
    const router = useRouter()
    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        // Countdown timer
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        } else {
            // Auto-redirect after countdown
            router.push("/login")
        }
    }, [countdown, router])

    return (
        <AuthLayout
            title="Password reset successful!"
            description="Your password has been successfully reset"
        >
            <div className="text-center space-y-6">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-500/10 p-4">
                        <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        You can now log in with your new password.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Redirecting to login in {countdown} second{countdown !== 1 ? "s" : ""}...
                    </p>
                </div>

                <Button asChild className="w-full">
                    <Link href="/login">Return to Login</Link>
                </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
                Need help?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                    Contact support
                </Link>
            </p>
        </AuthLayout>
    )
}
