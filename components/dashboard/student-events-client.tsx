"use client"

// ============================================================================
// CAMPUSTRACK - STUDENT EVENTS CLIENT COMPONENT
// ============================================================================

import { useState } from "react"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { format, isSameDay, parseISO } from "date-fns"
import { CalendarDays, MapPin, Clock } from "lucide-react"

interface EventData {
    id: string
    title: string
    description: string
    date: Date
    time?: string
    location: string
    isAllDay: boolean
}

interface StudentEventsClientProps {
    events: EventData[]
    user: {
        name: string
        departmentName: string
    }
}

export function StudentEventsClient({ events, user }: StudentEventsClientProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const headerUser = {
        name: user.name,
        email: "",
        role: user.departmentName,
    }

    // Get events for selected date
    const eventsOnDate = events.filter((e) =>
        isSameDay(new Date(e.date), selectedDate)
    )

    // Get all event dates for calendar highlighting
    const eventDates = events.map((e) => new Date(e.date))

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="student" />

            <MobileSidebar role="student" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="Events Calendar" user={headerUser} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-6 space-y-6">
                    {/* Header */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Campus Events</h2>
                        <p className="text-slate-300">Upcoming events and activities</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Select Date</CardTitle>
                                <CardDescription>View events by date</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    className="rounded-md border"
                                    modifiers={{
                                        hasEvent: eventDates,
                                    }}
                                    modifiersClassNames={{
                                        hasEvent: "bg-primary/20 font-medium",
                                    }}
                                />
                            </CardContent>
                        </Card>

                        {/* Events for Selected Date */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Events on {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
                                <CardDescription>
                                    {eventsOnDate.length} event{eventsOnDate.length !== 1 ? "s" : ""} scheduled
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {eventsOnDate.length > 0 ? (
                                    <div className="space-y-4">
                                        {eventsOnDate.map((event) => (
                                            <div
                                                key={event.id}
                                                className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                            {event.description}
                                                        </p>
                                                    </div>
                                                    {event.isAllDay && (
                                                        <Badge variant="secondary">All Day</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                                    {event.time && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {event.time}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {event.location}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No events on this date</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Upcoming Events List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Upcoming Events</CardTitle>
                            <CardDescription>Events scheduled for the future</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {events.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {events.slice(0, 6).map((event) => (
                                        <div
                                            key={event.id}
                                            className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedDate(new Date(event.date))}
                                        >
                                            <h4 className="font-medium text-foreground line-clamp-1">{event.title}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {format(new Date(event.date), "MMM d, yyyy")}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {event.location}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No upcoming events</p>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
