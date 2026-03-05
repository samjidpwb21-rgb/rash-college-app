"use client"

// ============================================================================
// GLOBAL LOADING CONTEXT
// ============================================================================
// Centralized loading state management without artificial delays.

import React, { createContext, useContext, useState, useCallback, useRef } from "react"

interface LoadingOptions {
    immediate?: boolean // Kept for interface compatibility
}

interface LoadingContextType {
    isLoading: boolean
    startLoading: (id: string, options?: LoadingOptions) => string
    finishLoading: (id: string) => void
    forceFinishAll: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)
    const loadingOpsRef = useRef<Set<string>>(new Set())

    const startLoading = useCallback((id: string, options?: LoadingOptions): string => {
        const loaderId = `${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        loadingOpsRef.current.add(loaderId)
        setIsLoading(true)
        return loaderId
    }, [])

    const finishLoading = useCallback((id: string): void => {
        loadingOpsRef.current.delete(id)
        if (loadingOpsRef.current.size === 0) {
            setIsLoading(false)
        }
    }, [])

    // Force clear all loading state (emergency recovery)
    const forceFinishAll = useCallback((): void => {
        loadingOpsRef.current.clear()
        setIsLoading(false)
    }, [])

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
