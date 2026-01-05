
"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { type EventData } from "@/actions/shared/pages"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, MapPin, User } from "lucide-react"
import { format } from "date-fns"

interface EventModalProps {
    event: EventData | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EventModal({ event, open, onOpenChange }: EventModalProps) {
    const [imageLoading, setImageLoading] = useState(true)
    const [imageError, setImageError] = useState(false)

    if (!event) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0">
                {/* Event Image Header */}
                {event.thumbnailUrl ? (
                    <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                        {imageLoading && !imageError && (
                            <Skeleton className="absolute inset-0 w-full h-48 rounded-t-lg" />
                        )}
                        <img
                            src={event.thumbnailUrl}
                            alt={event.title}
                            loading="lazy"
                            onLoad={() => setImageLoading(false)}
                            onError={() => {
                                setImageLoading(false)
                                setImageError(true)
                            }}
                            className={`w-full h-48 object-cover transition-opacity duration-300 ${imageLoading || imageError ? 'opacity-0' : 'opacity-100'
                                }`}
                        />
                        {imageError && (
                            <div className="absolute inset-0 w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <CalendarDays className="h-16 w-16 text-primary/40" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
                        <CalendarDays className="w-16 h-16 text-primary/40" />
                    </div>
                )}

                <div className="p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {event.title}
                        </DialogTitle>
                        <DialogDescription>
                            Event Details
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-primary/10 text-primary min-w-[70px]">
                                <span className="text-xl font-bold leading-none">{format(new Date(event.date), "d")}</span>
                                <span className="text-xs uppercase font-medium">{format(new Date(event.date), "MMM")}</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CalendarDays className="w-4 h-4" />
                                    {format(new Date(event.date), "EEEE, h:mm a")}
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        {event.location}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-sm text-foreground">
                            {event.description}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
