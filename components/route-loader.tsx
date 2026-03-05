"use client"

// ============================================================================
// ROUTE TRANSITION LOADER
// ============================================================================
// Tracks route changes and manages loading state during navigation

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
            forceFinishAll()
            return
        }

        // Finish any previous pending loader
        if (loaderIdRef.current) {
            finishLoading(loaderIdRef.current)
            loaderIdRef.current = null
        }

        // Start new loading
        const loaderId = startLoading("route-transition")
        loaderIdRef.current = loaderId

        return () => {
            if (loaderIdRef.current === loaderId) {
                finishLoading(loaderId)
                loaderIdRef.current = null
            }
        }
    }, [pathname, searchParams, startLoading, finishLoading, forceFinishAll])

    return null // This component doesn't render anything
}
