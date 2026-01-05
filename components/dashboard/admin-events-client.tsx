"use client"

// ============================================================================
// CAMPUSTRACK - ADMIN EVENTS CLIENT COMPONENT
// ============================================================================

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Plus, Search, MoreHorizontal, Edit, Trash2, CalendarDays, MapPin, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { createEvent, updateEvent, deleteEvent } from "@/actions/admin/events"
import { format, isSameDay } from "date-fns"

interface EventData {
    id: string
    title: string
    description: string | null
    eventDate: Date
    location: string | null
    isAllDay: boolean
    authorName: string
}

interface AdminEventsClientProps {
    events: EventData[]
}

export function AdminEventsClient({ events: initialEvents }: AdminEventsClientProps) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [events] = useState(initialEvents)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [searchQuery, setSearchQuery] = useState("")

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formTitle, setFormTitle] = useState("")
    const [formDescription, setFormDescription] = useState("")
    const [formEventDate, setFormEventDate] = useState("")
    const [formEventTime, setFormEventTime] = useState("")
    const [formLocation, setFormLocation] = useState("")
    const [formIsAllDay, setFormIsAllDay] = useState(false)

    const user = {
        name: "Admin User",
        email: "admin@university.edu",
        role: "System Administrator",
    }

    const filteredEvents = events.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    const eventsOnDate = events.filter((e) => isSameDay(new Date(e.eventDate), selectedDate))

    // Reset form
    const resetForm = () => {
        setFormTitle("")
        setFormDescription("")
        setFormEventDate("")
        setFormEventTime("")
        setFormLocation("")
        setFormIsAllDay(false)
    }

    // Open edit modal
    const openEditModal = (event: EventData) => {
        setSelectedEvent(event)
        setFormTitle(event.title)
        setFormDescription(event.description || "")
        setFormEventDate(format(new Date(event.eventDate), "yyyy-MM-dd"))
        setFormLocation(event.location || "")
        setFormIsAllDay(event.isAllDay)
        setIsEditModalOpen(true)
    }

    // Open delete dialog
    const openDeleteDialog = (event: EventData) => {
        setSelectedEvent(event)
        setIsDeleteDialogOpen(true)
    }

    // Handle create
    const handleCreateEvent = async () => {
        if (!formTitle || !formEventDate) {
            toast({ title: "Validation Error", description: "Please fill in title and date", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const result = await createEvent({
                title: formTitle,
                description: formDescription || undefined,
                eventDate: formEventDate,
                eventTime: formEventTime || undefined,
                location: formLocation || undefined,
                isAllDay: formIsAllDay,
            })

            if (result.success) {
                toast({ title: "Event Created", description: result.message || "Event has been created successfully." })
                setIsAddModalOpen(false)
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

    // Handle update
    const handleUpdateEvent = async () => {
        if (!selectedEvent || !formTitle || !formEventDate) {
            toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const result = await updateEvent({
                id: selectedEvent.id,
                title: formTitle,
                description: formDescription || undefined,
                eventDate: formEventDate,
                eventTime: formEventTime || undefined,
                location: formLocation || undefined,
                isAllDay: formIsAllDay,
            })

            if (result.success) {
                toast({ title: "Event Updated", description: result.message || "Event has been updated successfully." })
                setIsEditModalOpen(false)
                setSelectedEvent(null)
                resetForm()
                router.refresh()
            } else {
                toast({ title: "Error", description: result.error || "Failed to update event", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    // Handle delete
    const handleDeleteEvent = async () => {
        if (!selectedEvent) return

        setIsLoading(true)
        try {
            const result = await deleteEvent(selectedEvent.id)

            if (result.success) {
                toast({ title: "Event Deleted", description: result.message || "Event has been deleted successfully." })
                setIsDeleteDialogOpen(false)
                setSelectedEvent(null)
                router.refresh()
            } else {
                toast({ title: "Error", description: result.error || "Failed to delete event", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />

            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="Events Calendar" user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Manage Events</h2>
                            <p className="text-slate-300">Create and manage campus events</p>
                        </div>
                        <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Event
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <CalendarDays className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Events</p>
                                        <p className="text-2xl font-bold text-foreground">{events.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <CalendarDays className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Upcoming</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {events.filter((e) => new Date(e.eventDate) >= new Date()).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                        <CalendarDays className="h-6 w-6 text-chart-3" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">This Month</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {events.filter((e) => {
                                                const date = new Date(e.eventDate)
                                                const now = new Date()
                                                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                                            }).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Calendar</CardTitle>
                                <CardDescription>Select date to view events</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    className="rounded-md border"
                                    modifiers={{
                                        hasEvent: events.map((e) => new Date(e.eventDate)),
                                    }}
                                    modifiersClassNames={{
                                        hasEvent: "bg-primary/20 font-medium",
                                    }}
                                />
                                {eventsOnDate.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-sm font-medium">Events on {format(selectedDate, "MMM d")}</p>
                                        {eventsOnDate.map((event) => (
                                            <div key={event.id} className="p-2 rounded bg-muted/50 text-sm">
                                                {event.title}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Events List */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle>All Events</CardTitle>
                                        <CardDescription>View and manage all events</CardDescription>
                                    </div>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search events..."
                                            className="pl-9"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {filteredEvents.length > 0 ? (
                                    <div className="space-y-3">
                                        {filteredEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-foreground">{event.title}</h4>
                                                            {event.isAllDay && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    All Day
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                            {event.description}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <CalendarDays className="h-3 w-3" />
                                                                {format(new Date(event.eventDate), "MMM d, yyyy")}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {event.location}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditModal(event)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(event)}>
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No events found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>

            {/* Add Event Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                        <DialogDescription>Create a campus event.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="add-event-title">Title</Label>
                            <Input
                                id="add-event-title"
                                placeholder="Event title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-event-description">Description</Label>
                            <Textarea
                                id="add-event-description"
                                placeholder="Event description"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="add-event-date">Date</Label>
                                <Input
                                    id="add-event-date"
                                    type="date"
                                    value={formEventDate}
                                    onChange={(e) => setFormEventDate(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-event-time">Time (Optional)</Label>
                                <Input
                                    id="add-event-time"
                                    type="time"
                                    value={formEventTime}
                                    onChange={(e) => setFormEventTime(e.target.value)}
                                    disabled={formIsAllDay}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-event-location">Location</Label>
                            <Input
                                id="add-event-location"
                                placeholder="Event location"
                                value={formLocation}
                                onChange={(e) => setFormLocation(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="add-allday"
                                checked={formIsAllDay}
                                onCheckedChange={(checked) => setFormIsAllDay(checked === true)}
                            />
                            <Label htmlFor="add-allday">All Day Event</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateEvent} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Event
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Event Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Event</DialogTitle>
                        <DialogDescription>Update event information.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-event-title">Title</Label>
                            <Input
                                id="edit-event-title"
                                placeholder="Event title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-event-description">Description</Label>
                            <Textarea
                                id="edit-event-description"
                                placeholder="Event description"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-event-date">Date</Label>
                                <Input
                                    id="edit-event-date"
                                    type="date"
                                    value={formEventDate}
                                    onChange={(e) => setFormEventDate(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-event-time">Time (Optional)</Label>
                                <Input
                                    id="edit-event-time"
                                    type="time"
                                    value={formEventTime}
                                    onChange={(e) => setFormEventTime(e.target.value)}
                                    disabled={formIsAllDay}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-event-location">Location</Label>
                            <Input
                                id="edit-event-location"
                                placeholder="Event location"
                                value={formLocation}
                                onChange={(e) => setFormLocation(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="edit-allday"
                                checked={formIsAllDay}
                                onCheckedChange={(checked) => setFormIsAllDay(checked === true)}
                            />
                            <Label htmlFor="edit-allday">All Day Event</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateEvent} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{selectedEvent?.title}</strong>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteEvent}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete Event
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
