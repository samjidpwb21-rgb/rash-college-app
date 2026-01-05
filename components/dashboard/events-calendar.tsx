
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { getEventsPageData, type EventData } from "@/actions/shared/pages"
import { EventModal } from "./event-modal"
import { Badge } from "@/components/ui/badge"
import { format, isSameDay } from "date-fns"
import { CalendarDays, ChevronRight } from "lucide-react"

export function EventsCalendar() {
    const [events, setEvents] = useState<EventData[]>([])
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        async function loadEvents() {
            try {
                const result = await getEventsPageData()
                if (result.success) {
                    setEvents(result.data)
                }
            } catch (error) {
                console.error("Failed to load events:", error)
            }
        }

        loadEvents()
    }, [])

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate)
        if (selectedDate) {
            const eventOnDate = events.find(e => isSameDay(new Date(e.date), selectedDate))
            if (eventOnDate) {
                setSelectedEvent(eventOnDate)
                setModalOpen(true)
            }
        }
    }

    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3)

    return (
        <>
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        Events Calendar
                    </CardTitle>
                    <CardDescription>Upcoming college events</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        className="rounded-md border shadow-sm p-3"
                        modifiers={{
                            event: events.map(e => new Date(e.date))
                        }}
                        modifiersStyles={{
                            event: {
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                color: 'hsl(var(--primary))'
                            }
                        }}
                    />

                    <div className="w-full mt-4 space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Upcoming Events</h4>
                        {upcomingEvents.map(event => (
                            <div
                                key={event.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors text-sm"
                                onClick={() => { setSelectedEvent(event); setModalOpen(true); }}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium truncate max-w-[150px]">{event.title}</span>
                                    <span className="text-xs text-muted-foreground">{format(new Date(event.date), "MMM d, h:mm a")}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                        ))}
                        {upcomingEvents.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">No upcoming events.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <EventModal
                event={selectedEvent}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </>
    )
}
