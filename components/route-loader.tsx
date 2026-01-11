"use client"

// ============================================================================
// ROUTE TRANSITION LOADER
// ============================================================================
// Tracks route changes and manages loading state during navigation
// Uses delay threshold from loading context (1.5s before showing loader)

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useLoading } from "@/contexts/loading-context"

export function RouteLoader() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { startLoading, finishLoading, forceFinishAll } = useLoading()
    const loaderIdRef = useRef<string | null>(null)
    const isFirstMountRef = useRef(true)

    useEffect(() => {
        // Skip loader on first mount (initial page load)
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false
            // Force clear any stuck loaders on first mount
            forceFinishAll()
            return
        }

        // Finish any previous pending loader
        if (loaderIdRef.current) {
            finishLoading(loaderIdRef.current)
            loaderIdRef.current = null
        }

        // Start new loading (uses 1.5s delay from context)
        const loaderId = startLoading("route-transition")
        loaderIdRef.current = loaderId

        // Short timeout to detect if page loaded quickly
        // The loading context handles the 1.5s delay threshold
        const timer = setTimeout(() => {
            if (loaderIdRef.current === loaderId) {
                finishLoading(loaderId)
                loaderIdRef.current = null
            }
        }, 300) // Finish after 300ms if content is ready

        return () => {
            clearTimeout(timer)
            if (loaderIdRef.current === loaderId) {
                finishLoading(loaderId)
                loaderIdRef.current = null
            }
        }
    }, [pathname, searchParams, startLoading, finishLoading, forceFinishAll])

    return null // This component doesn't render anything
}
