"use client"

// ============================================================================
// CAMPUSTRACK - GLOBAL LOADING OVERLAY
// ============================================================================
// Simple, fast CSS-based loading overlay

import { useLoading } from "@/contexts/loading-context"
import { Loader2 } from "lucide-react"

export function GlobalLoader() {
    const { isLoading } = useLoading()

    if (!isLoading) {
        return null
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/50 backdrop-blur-sm transition-all duration-200"
        >
            <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-card shadow-lg border animate-in fade-in zoom-in-95 duration-200">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading...</p>
            </div>
        </div>
    )
}
