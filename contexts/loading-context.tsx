"use client"

// ============================================================================
// GLOBAL LOADING CONTEXT
// ============================================================================
// Centralized loading state management with:
// - 1.5s delay threshold before showing loader
// - Minimum 2 rotation display once shown (~2s)
// - Immediate mode for login (bypasses delay)
// - Force-clear mechanism for stuck states

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"

interface LoadingOptions {
    immediate?: boolean // Show immediately without delay (for login)
}

interface LoadingContextType {
    isLoading: boolean
    startLoading: (id: string, options?: LoadingOptions) => string
    finishLoading: (id: string) => void
    forceFinishAll: () => void // Emergency clear for stuck states
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

// Timing constants
const DELAY_THRESHOLD_MS = 1500    // Wait 1.5s before showing loader
const MIN_DISPLAY_DURATION_MS = 2000 // Minimum 2s display (~2 rotations)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)
    const loadingOpsRef = useRef<Set<string>>(new Set())
    const displayStartTimeRef = useRef<number | null>(null)
    const delayTimerRef = useRef<NodeJS.Timeout | null>(null)
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
    const pendingOpsRef = useRef<Set<string>>(new Set()) // Ops waiting for delay

    // Clear all timers
    const clearAllTimers = useCallback(() => {
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current)
            delayTimerRef.current = null
        }
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current)
            hideTimerRef.current = null
        }
    }, [])

    // Show the loader
    const showLoader = useCallback(() => {
        if (!displayStartTimeRef.current) {
            displayStartTimeRef.current = Date.now()
        }
        setIsLoading(true)
    }, [])

    // Hide the loader with minimum duration check
    const hideLoader = useCallback(() => {
        if (displayStartTimeRef.current) {
            const elapsed = Date.now() - displayStartTimeRef.current
            const remaining = MIN_DISPLAY_DURATION_MS - elapsed

            if (remaining > 0) {
                // Wait for minimum display duration
                hideTimerRef.current = setTimeout(() => {
                    setIsLoading(false)
                    displayStartTimeRef.current = null
                }, remaining)
            } else {
                // Minimum time elapsed, hide immediately
                setIsLoading(false)
                displayStartTimeRef.current = null
            }
        } else {
            setIsLoading(false)
        }
    }, [])

    const startLoading = useCallback((id: string, options?: LoadingOptions): string => {
        const loaderId = `${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        loadingOpsRef.current.add(loaderId)

        // Clear any pending hide timer since we have new work
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current)
            hideTimerRef.current = null
        }

        if (options?.immediate) {
            // Show immediately (for login)
            showLoader()
        } else {
            // Add to pending and start delay timer if first pending op
            pendingOpsRef.current.add(loaderId)

            if (!delayTimerRef.current && !isLoading) {
                delayTimerRef.current = setTimeout(() => {
                    // Check if any ops are still pending after delay
                    if (loadingOpsRef.current.size > 0) {
                        showLoader()
                    }
                    delayTimerRef.current = null
                    pendingOpsRef.current.clear()
                }, DELAY_THRESHOLD_MS)
            }
        }

        return loaderId
    }, [isLoading, showLoader])

    const finishLoading = useCallback((id: string): void => {
        // Remove from both sets
        loadingOpsRef.current.delete(id)
        pendingOpsRef.current.delete(id)

        // If no more loading operations
        if (loadingOpsRef.current.size === 0) {
            // Clear delay timer if still waiting
            if (delayTimerRef.current) {
                clearTimeout(delayTimerRef.current)
                delayTimerRef.current = null
            }
            pendingOpsRef.current.clear()

            // Hide loader if it was shown
            if (isLoading || displayStartTimeRef.current) {
                hideLoader()
            }
        }
    }, [isLoading, hideLoader])

    // Force clear all loading state (emergency recovery)
    const forceFinishAll = useCallback((): void => {
        clearAllTimers()
        loadingOpsRef.current.clear()
        pendingOpsRef.current.clear()
        displayStartTimeRef.current = null
        setIsLoading(false)
    }, [clearAllTimers])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTimers()
        }
    }, [clearAllTimers])

    const value: LoadingContextType = {
        isLoading,
        startLoading,
        finishLoading,
        forceFinishAll,
    }

    return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
}

export function useLoading(): LoadingContextType {
    const context = useContext(LoadingContext)
    if (!context) {
        throw new Error("useLoading must be used within LoadingProvider")
    }
    return context
}
