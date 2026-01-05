"use client"

// ============================================================================
// CAMPUSTRACK - FACULTY SCHEDULE CLIENT COMPONENT
// ============================================================================

import { useState } from "react"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MapPin, Users, Clock, BookOpen } from "lucide-react"

interface TimetableEntry {
    period: number
    time: string
    subject: string
    code: string
    students: number
    room: string | null
}

interface ScheduleData {
    Monday: TimetableEntry[]
    Tuesday: TimetableEntry[]
    Wednesday: TimetableEntry[]
    Thursday: TimetableEntry[]
    Friday: TimetableEntry[]
    Saturday: TimetableEntry[]
}

interface FacultyScheduleClientProps {
    user: {
        name: string
        departmentName: string
    }
    timetable: ScheduleData
}

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

export function FacultyScheduleClient({ user, timetable }: FacultyScheduleClientProps) {
    const today = new Date()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const dayIndex = today.getDay()
    const [selectedDay, setSelectedDay] = useState(dayIndex === 0 || dayIndex === 6 ? 0 : dayIndex - 1)

    const headerUser = {
        name: user.name,
        email: "",
        role: user.departmentName,
    }

    const currentDaySchedule = timetable[weekDays[selectedDay] as keyof ScheduleData] || []

    const totalClasses = Object.values(timetable).flat().length
    const totalStudents = Object.values(timetable)
        .flat()
        .reduce((acc, entry) => acc + (entry.students || 0), 0)

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="faculty" />

            <MobileSidebar role="faculty" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="My Schedule" user={headerUser} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Weekly Schedule</h2>
                            <p className="text-slate-300">Your teaching schedule for the week</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDay((prev) => (prev > 0 ? prev - 1 : 4))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium text-white min-w-[100px] text-center">
                                {weekDays[selectedDay]}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDay((prev) => (prev < 4 ? prev + 1 : 0))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Weekly Classes</p>
                                        <p className="text-2xl font-bold text-foreground">{totalClasses}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Students</p>
                                        <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Day Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {weekDays.map((day, index) => (
                            <Button
                                key={day}
                                variant={selectedDay === index ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedDay(index)}
                                className="shrink-0"
                            >
                                {day.substring(0, 3)}
                            </Button>
                        ))}
                    </div>

                    {/* Schedule Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{weekDays[selectedDay]}'s Classes</CardTitle>
                            <CardDescription>
                                {currentDaySchedule.length} class{currentDaySchedule.length !== 1 ? "es" : ""} scheduled
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {currentDaySchedule.length > 0 ? (
                                <div className="space-y-3">
                                    {currentDaySchedule.map((entry, index) => (
                                        <div
                                            key={index}
                                            className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <BookOpen className="h-4 w-4 text-primary" />
                                                        <h4 className="font-semibold text-foreground">{entry.subject}</h4>
                                                        <Badge variant="outline" className="text-xs">{entry.code}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {entry.time}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            {entry.students} students
                                                        </span>
                                                        {entry.room && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-4 w-4" />
                                                                {entry.room}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className="bg-primary">Period {entry.period}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No classes scheduled for this day</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
