"use client"

// ============================================================================
// CAMPUSTRACK - GLOBAL LOADING OVERLAY
// ============================================================================
// Instagram/LinkedIn-style loading overlay that appears during route transitions

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Lottie from "lottie-react"

export function GlobalLoader() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [animationData, setAnimationData] = useState(null)
    const [showLoader, setShowLoader] = useState(false)

    // Load Lottie animation
    useEffect(() => {
        fetch("/uploads/lottie/Sandy Loading.json")
            .then((res) => res.json())
            .then((data) => setAnimationData(data))
            .catch((err) => console.error("Failed to load Lottie animation:", err))
    }, [])

    // Track route changes
    useEffect(() => {
        let timeoutId: NodeJS.Timeout
        let minDisplayTimeout: NodeJS.Timeout

        if (isLoading) {
            // Show loader after a brief delay to prevent flicker on fast loads
            timeoutId = setTimeout(() => {
                setShowLoader(true)
            }, 100)
        } else {
            // Hide loader with smooth fade
            if (showLoader) {
                // Ensure minimum display time of 300ms to prevent flash
                minDisplayTimeout = setTimeout(() => {
                    setShowLoader(false)
                }, 200)
            } else {
                setShowLoader(false)
            }
        }

        return () => {
            clearTimeout(timeoutId)
            clearTimeout(minDisplayTimeout)
        }
    }, [isLoading, showLoader])

    // Detect navigation changes
    useEffect(() => {
        setIsLoading(true)

        // Hide loader after navigation completes
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 100)

        return () => clearTimeout(timer)
    }, [pathname, searchParams])

    // Don't render if not showing
    if (!showLoader || !animationData) {
        return null
    }

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-200 ${showLoader ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(2px)",
            }}
        >
            {/* Prevent clicks on background */}
            <div className="absolute inset-0" style={{ pointerEvents: "auto" }} onClick={(e) => e.stopPropagation()} />

            {/* Lottie Animation */}
            <div className="relative z-10" style={{ pointerEvents: "none" }}>
                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                    style={{
                        width: "140px",
                        height: "140px",
                    }}
                />
            </div>
        </div>
    )
}
