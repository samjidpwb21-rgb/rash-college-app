"use client"

import * as React from "react"
import { type CalendarEvent } from "@/lib/mock-data"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface VisualCalendarProps {
    events: Array<CalendarEvent & { date: Date | string }>
    selectedDate?: Date
    onDateSelect?: (date: Date | undefined) => void
}

export function VisualCalendar({ events, selectedDate, onDateSelect }: VisualCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date())

    // Group events by date
    const eventsByDate = React.useMemo(() => {
        const map = new Map<string, typeof events>()
        events.forEach((event) => {
            const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date
            const dateKey = eventDate.toDateString()
            if (!map.has(dateKey)) {
                map.set(dateKey, [])
            }
            map.get(dateKey)!.push({ ...event, date: eventDate })
        })
        return map
    }, [events])

    // Get calendar days
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    return (
        <div className="p-4 border rounded-md bg-background w-full max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-base">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-1.5">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handlePrevMonth}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleNextMonth}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 mb-3">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-muted-foreground py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
                {days.map((day) => {
                    const dayEvents = eventsByDate.get(day.toDateString()) || []
                    const hasEvents = dayEvents.length > 0
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isToday = isSameDay(day, new Date())

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onDateSelect?.(day)}
                            className={cn(
                                "relative h-11 w-full rounded-md text-sm transition-colors group/day",
                                "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                                !isSelected && hasEvents && isCurrentMonth && "bg-primary/10 text-primary font-bold",
                                !isSelected && !hasEvents && isCurrentMonth && "text-foreground",
                                !isCurrentMonth && "text-muted-foreground/40",
                                isToday && !isSelected && "border border-primary"
                            )}
                        >
                            {/* Date number */}
                            <span className="relative z-10">{format(day, 'd')}</span>

                            {/* Event thumbnail indicator */}
                            {hasEvents && isCurrentMonth && (
                                <div className="absolute top-1 right-1 z-20">
                                    {dayEvents[0].imageUrl ? (
                                        <div className="relative group/thumb">
                                            <img
                                                src={dayEvents[0].imageUrl}
                                                alt=""
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none'
                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                                    if (fallback) fallback.style.display = 'flex'
                                                }}
                                                className="w-5 h-5 rounded-full object-cover border border-background shadow-sm"
                                            />
                                            <div className="hidden w-5 h-5 rounded-full bg-primary/20 border border-background shadow-sm items-center justify-center">
                                                <CalendarCheck className="w-3 h-3 text-primary" />
                                            </div>
                                            {dayEvents.length > 1 && (
                                                <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-[6px] font-bold rounded-full w-2.5 h-2.5 flex items-center justify-center border border-background">
                                                    {dayEvents.length}
                                                </div>
                                            )}

                                            {/* Hover tooltip */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover/thumb:block z-50 pointer-events-none">
                                                <div className="w-52 p-3 bg-popover border border-border rounded-lg shadow-xl">
                                                    <div className="space-y-1.5">
                                                        <div className="text-[10px] font-semibold text-foreground">
                                                            {format(day, "MMM d, yyyy")}
                                                        </div>
                                                        {dayEvents.slice(0, 3).map((event, idx) => (
                                                            <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                                                                <div className="w-6 h-6 rounded overflow-hidden shrink-0">
                                                                    {event.imageUrl ? (
                                                                        <img
                                                                            src={event.imageUrl}
                                                                            alt={event.title}
                                                                            loading="lazy"
                                                                            onError={(e) => {
                                                                                const target = e.currentTarget
                                                                                target.style.display = 'none'
                                                                                const parent = target.parentElement
                                                                                if (parent) {
                                                                                    parent.className = 'w-full h-full bg-primary/10 flex items-center justify-center'
                                                                                    parent.innerHTML = '<svg class="w-3 h-3 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>'
                                                                                }
                                                                            }}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                                                            <CalendarCheck className="w-3 h-3 text-primary" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium line-clamp-1 text-foreground text-[10px]">
                                                                        {event.title}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {dayEvents.length > 3 && (
                                                            <div className="text-[10px] text-muted-foreground text-center pt-1 border-t">
                                                                +{dayEvents.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="w-5 h-5 rounded-full bg-primary/20 border border-background shadow-sm flex items-center justify-center">
                                                <CalendarCheck className="w-3 h-3 text-primary" />
                                            </div>
                                            {dayEvents.length > 1 && (
                                                <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-[7px] font-bold rounded-full w-3 h-3 flex items-center justify-center border border-background">
                                                    {dayEvents.length}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
