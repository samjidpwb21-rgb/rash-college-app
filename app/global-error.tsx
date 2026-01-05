"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { reportClientError } from "@/lib/observability"

/**
 * Global Error Boundary for CampusTrack
 * Catches unhandled errors and displays a friendly fallback UI
 * This is a Next.js App Router error boundary
 */
export default function GlobalError({
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
        <html>
            <body>
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="max-w-md mx-auto p-8 text-center">
                        {/* Error Icon */}
                        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>

                        {/* Error Message */}
                        <h1 className="text-2xl font-semibold text-foreground mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>

                        {/* Error Digest (for support) */}
                        {error.digest && (
                            <p className="text-xs text-muted-foreground mb-4 font-mono">
                                Error ID: {error.digest}
                            </p>
                        )}

                        {/* Retry Button */}
                        <Button onClick={reset} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    )
}
