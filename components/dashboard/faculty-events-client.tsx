"use client"

// ============================================================================
// CAMPUSTRACK - FACULTY EVENTS CLIENT COMPONENT
// ============================================================================

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { CalendarDays, Clock, MapPin, Plus, Loader2 } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { createEvent } from "@/actions/admin/events"

interface EventData {
    id: string
    title: string
    description: string
    date: Date
    time?: string
    location: string
    isAllDay: boolean
}

interface FacultyEventsClientProps {
    events: EventData[]
    user: {
        name: string
        departmentName: string
    }
}

export function FacultyEventsClient({ events, user }: FacultyEventsClientProps) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formTitle, setFormTitle] = useState("")
    const [formDescription, setFormDescription] = useState("")
    const [formDate, setFormDate] = useState("")
    const [formTime, setFormTime] = useState("")
    const [formLocation, setFormLocation] = useState("")
    const [formIsAllDay, setFormIsAllDay] = useState(false)

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

    // Get upcoming events
    const upcomingEvents = events
        .filter((e) => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6)

    const resetForm = () => {
        setFormTitle("")
        setFormDescription("")
        setFormDate("")
        setFormTime("")
        setFormLocation("")
        setFormIsAllDay(false)
    }

    const handleCreateEvent = async () => {
        if (!formTitle || !formDate) {
            toast({ title: "Validation Error", description: "Please fill in title and date", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const result = await createEvent({
                title: formTitle,
                description: formDescription || undefined,
                eventDate: formDate,
                eventTime: formTime || undefined,
                location: formLocation || undefined,
                isAllDay: formIsAllDay,
            })

            if (result.success) {
                toast({ title: "Event Created", description: result.message || "Event has been created successfully." })
                setIsCreateModalOpen(false)
                resetForm()
                router.refresh()
            } else {
                toast({ title: "Error", description: result.error || "Failed to create event", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="faculty" />

            <MobileSidebar role="faculty" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="Events Calendar" user={headerUser} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Campus Events</h2>
                            <p className="text-slate-300">Upcoming events and activities</p>
                        </div>
                        <Button className="gap-2" onClick={() => { resetForm(); setIsCreateModalOpen(true) }}>
                            <Plus className="h-4 w-4" />
                            Add Event
                        </Button>
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
                            <CardTitle>Upcoming Events</CardTitle>
                            <CardDescription>Events scheduled for the future</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcomingEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {upcomingEvents.map((event) => (
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

            {/* Create Event Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create Event</DialogTitle>
                        <DialogDescription>Add a new event to the calendar.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="event-title">Title</Label>
                            <Input
                                id="event-title"
                                placeholder="Event title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="event-description">Description (Optional)</Label>
                            <Textarea
                                id="event-description"
                                placeholder="Event description"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="event-date">Date</Label>
                                <Input
                                    id="event-date"
                                    type="date"
                                    value={formDate}
                                    onChange={(e) => setFormDate(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="event-time">Time (Optional)</Label>
                                <Input
                                    id="event-time"
                                    type="time"
                                    value={formTime}
                                    onChange={(e) => setFormTime(e.target.value)}
                                    disabled={formIsAllDay}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="event-location">Location (Optional)</Label>
                            <Input
                                id="event-location"
                                placeholder="Event location"
                                value={formLocation}
                                onChange={(e) => setFormLocation(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="event-allday"
                                checked={formIsAllDay}
                                onCheckedChange={(checked) => setFormIsAllDay(checked === true)}
                            />
                            <Label htmlFor="event-allday">All-day event</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateEvent} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Event
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
