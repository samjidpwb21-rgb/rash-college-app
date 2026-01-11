"use client"

// ============================================================================
// CAMPUSTRACK - GLOBAL LOADING OVERLAY
// ============================================================================
// Instagram/LinkedIn-style loading overlay with persistent Lottie animation
// Uses global loading context for centralized state management

import { useEffect, useState } from "react"
import Lottie from "lottie-react"
import { useLoading } from "@/contexts/loading-context"

export function GlobalLoader() {
    const { isLoading } = useLoading()
    const [animationData, setAnimationData] = useState(null)
    const [showLoader, setShowLoader] = useState(false)

    // Load Lottie animation once on mount
    useEffect(() => {
        fetch("/uploads/lottie/Sandy Loading.json")
            .then((res) => res.json())
            .then((data) => setAnimationData(data))
            .catch((err) => console.error("Failed to load Lottie animation:", err))
    }, [])

    // Show/hide loader with smooth transition
    useEffect(() => {
        if (isLoading) {
            // Show immediately when loading starts
            setShowLoader(true)
        } else {
            // Wait for fade transition before unmounting
            const timer = setTimeout(() => {
                setShowLoader(false)
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [isLoading])

    // Don't render if animation not loaded or not showing
    if (!showLoader || !animationData) {
        return null
    }

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-200 ${isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
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
