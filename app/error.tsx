"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { reportClientError } from "@/lib/observability"
import Link from "next/link"

/**
 * Route-level Error Boundary for CampusTrack
 * Catches errors in route segments and displays a friendly fallback
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Report error to observability system
        reportClientError(error, {
            componentStack: error.stack,
        })
    }, [error])

    return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="max-w-md mx-auto p-8 text-center">
                {/* Error Icon */}
                <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
                    <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>

                {/* Error Message */}
                <h2 className="text-xl font-semibold text-foreground mb-2">
                    Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                    We encountered an unexpected error while loading this page.
                    Please try again or return to the dashboard.
                </p>

                {/* Error Digest (for support) */}
                {error.digest && (
                    <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted/50 rounded px-2 py-1 inline-block">
                        Reference: {error.digest}
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                    <Button onClick={reset} variant="default" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/dashboard">
                            <Home className="w-4 h-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
