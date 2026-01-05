"use client"

// ============================================================================
// CAMPUSTRACK - STUDENT SCHEDULE CLIENT COMPONENT
// ============================================================================

import { useState } from "react"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MapPin, User, Clock, BookOpen, FlaskConical } from "lucide-react"

interface TimetableEntry {
    period: number
    time: string
    subject: string
    code: string
    faculty: string
    room: string | null
    type: "theory" | "lab"
}

interface ScheduleData {
    Monday: TimetableEntry[]
    Tuesday: TimetableEntry[]
    Wednesday: TimetableEntry[]
    Thursday: TimetableEntry[]
    Friday: TimetableEntry[]
    Saturday: TimetableEntry[]
}

interface StudentScheduleClientProps {
    user: {
        name: string
        departmentName: string
        semesterNumber: number
    }
    timetable: ScheduleData
}

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

const subjectColors: Record<string, string> = {
    "Data Structures": "bg-slate-100 dark:bg-slate-900/40 border-slate-300/70 dark:border-slate-700/70",
    "Database Systems": "bg-purple-100 dark:bg-purple-900/30 border-purple-300/70 dark:border-purple-700/70",
    "Web Development": "bg-blue-100 dark:bg-blue-900/30 border-blue-300/70 dark:border-blue-700/70",
    "Operating Systems": "bg-amber-100/90 dark:bg-amber-900/30 border-amber-300/70 dark:border-amber-700/70",
    "Networks": "bg-teal-100 dark:bg-teal-900/30 border-teal-300/70 dark:border-teal-700/70",
}

const getSubjectColor = (subject: string) => {
    return subjectColors[subject] || "bg-muted/50 border-border"
}

export function StudentScheduleClient({ user, timetable }: StudentScheduleClientProps) {
    const today = new Date()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const dayIndex = today.getDay()
    const [selectedDay, setSelectedDay] = useState(dayIndex === 0 || dayIndex === 6 ? 0 : dayIndex - 1)

    const headerUser = {
        name: user.name,
        email: "",
        role: `${user.departmentName} • Semester ${user.semesterNumber}`,
    }

    const currentDaySchedule = timetable[weekDays[selectedDay] as keyof ScheduleData] || []

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="student" />

            <MobileSidebar role="student" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="Class Schedule" user={headerUser} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Weekly Timetable</h2>
                            <p className="text-slate-300">Your class schedule for the week</p>
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
                            <CardTitle>{weekDays[selectedDay]}'s Schedule</CardTitle>
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
                                            className={`p-4 rounded-lg border ${getSubjectColor(entry.subject)} transition-colors`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {entry.type === "lab" ? (
                                                            <FlaskConical className="h-4 w-4 text-emerald-600" />
                                                        ) : (
                                                            <BookOpen className="h-4 w-4 text-primary" />
                                                        )}
                                                        <h4 className="font-semibold text-foreground">{entry.subject}</h4>
                                                        <Badge variant="outline" className="text-xs">
                                                            {entry.code}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {entry.time}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-4 w-4" />
                                                            {entry.faculty}
                                                        </span>
                                                        {entry.room && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-4 w-4" />
                                                                {entry.room}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className={entry.type === "lab" ? "bg-emerald-500" : "bg-primary"}>
                                                    {entry.type === "lab" ? "Lab" : "Theory"}
                                                </Badge>
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

                    {/* Week Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Week Overview</CardTitle>
                            <CardDescription>Quick view of all classes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {weekDays.map((day) => {
                                    const dayClasses = timetable[day as keyof ScheduleData] || []
                                    return (
                                        <div
                                            key={day}
                                            className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedDay(weekDays.indexOf(day))}
                                        >
                                            <h4 className="font-medium text-foreground text-sm mb-2">{day}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {dayClasses.length} class{dayClasses.length !== 1 ? "es" : ""}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
