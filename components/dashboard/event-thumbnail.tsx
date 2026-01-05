"use client"

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarCheck } from "lucide-react"

interface EventThumbnailProps {
    imageUrl?: string
    alt: string
    className?: string
}

export function EventThumbnail({ imageUrl, alt, className = "w-12 h-12 rounded-lg object-cover shrink-0" }: EventThumbnailProps) {
    const [imageLoading, setImageLoading] = useState(true)
    const [imageError, setImageError] = useState(false)

    if (!imageUrl) {
        return (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                <CalendarCheck className="h-6 w-6 text-primary/40" />
            </div>
        )
    }

    return (
        <div className="relative w-12 h-12 rounded-lg shrink-0">
            {imageLoading && !imageError && (
                <Skeleton className="absolute inset-0 w-12 h-12 rounded-lg" />
            )}
            <img
                src={imageUrl}
                alt={alt}
                loading="lazy"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                    setImageLoading(false)
                    setImageError(true)
                }}
                className={`${className} transition-opacity duration-300 ${imageLoading || imageError ? 'opacity-0' : 'opacity-100'
                    }`}
            />
            {imageError && (
                <div className="absolute inset-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <CalendarCheck className="h-6 w-6 text-primary/40" />
                </div>
            )}
        </div>
    )
}
