"use client"

// ============================================================================
// CAMPUSTRACK - STUDENT ATTENDANCE CLIENT COMPONENT
// ============================================================================

import { useState, useEffect, useTransition } from "react"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Clock, Calendar as CalendarIcon } from "lucide-react"
import { getDailyAttendance, getRecentAttendanceRecords } from "@/actions/student/attendance-page"

// Helper function to get status badge based on percentage
const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 90) return { label: "Excellent", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" }
    if (percentage >= 75) return { label: "Good", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" }
    return { label: "Warning", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" }
}

interface StudentAttendanceProps {
    data: {
        user: {
            name: string
            departmentName: string
            semesterNumber: number
        }
        stats: {
            totalPresent: number
            totalAbsent: number
            attendanceRate: number
        }
        subjectStats: Array<{
            subjectId: string
            subject: string
            present: number
            total: number
            percentage: number
        }>
        attendanceDates: {
            present: string[]
            absent: string[]
        }
        currentSemester: number
    }
}

interface DailyPeriod {
    period: number
    subject: string
    code: string
    time: string
    room: string | null
    faculty: string
    status: "PRESENT" | "ABSENT" | "not-marked" | "not-applicable"
}

interface AttendanceRecord {
    date: string
    day: string
    subject: string
    time: string
    status: "PRESENT" | "ABSENT"
}

export function StudentAttendanceClient({ data }: StudentAttendanceProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [dailyPeriods, setDailyPeriods] = useState<DailyPeriod[]>([])
    const [isWeekend, setIsWeekend] = useState(false)
    const [isFuture, setIsFuture] = useState(false)
    const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([])
    const [isPending, startTransition] = useTransition()

    const user = {
        name: data.user.name,
        email: "",
        role: `${data.user.departmentName} - Semester ${data.user.semesterNumber}`,
    }

    // Convert date strings to Date objects for calendar
    const presentDates = data.attendanceDates.present.map(d => new Date(d))
    const absentDates = data.attendanceDates.absent.map(d => new Date(d))

    // Fetch daily attendance when date changes
    useEffect(() => {
        startTransition(async () => {
            const dateStr = selectedDate.toISOString().split("T")[0]
            const result = await getDailyAttendance(dateStr)

            if (result.success) {
                setDailyPeriods(result.data.periods)
                setIsWeekend(result.data.isWeekend)
                setIsFuture(result.data.isFuture)
            }
        })
    }, [selectedDate])

    // Fetch recent records on mount
    useEffect(() => {
        startTransition(async () => {
            const result = await getRecentAttendanceRecords(20)
            if (result.success) {
                setRecentRecords(result.data)
            }
        })
    }, [])

    const selectedDayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][selectedDate.getDay()]

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="student" />

            <MobileSidebar role="student" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="My Attendance" user={user} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-6 space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Present</p>
                                        <p className="text-2xl font-bold text-foreground">{data.stats.totalPresent}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                                        <XCircle className="h-6 w-6 text-destructive" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Absent</p>
                                        <p className="text-2xl font-bold text-foreground">{data.stats.totalAbsent}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Attendance Rate</p>
                                        <p className="text-2xl font-bold text-foreground">{data.stats.attendanceRate}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Attendance - 5 Period Viewer */}
                    <Card className="shadow-2xl bg-white border-slate-200">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Daily Attendance</CardTitle>
                                    <CardDescription>
                                        {isFuture
                                            ? `Future date • ${selectedDayName}, ${selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                                            : `${selectedDayName}, ${selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                                        }
                                    </CardDescription>
                                </div>
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isPending ? (
                                <div className="text-center py-8 text-muted-foreground">Loading...</div>
                            ) : isFuture ? (
                                <div className="text-center py-8">
                                    <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                                        <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">Future Date Selected</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Please select a past or current date to view attendance
                                    </p>
                                </div>
                            ) : isWeekend ? (
                                <div className="text-center py-8">
                                    <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                                        <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">No classes scheduled</p>
                                    <p className="text-xs text-muted-foreground mt-1">Enjoy your day off!</p>
                                </div>
                            ) : dailyPeriods.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No classes found</div>
                            ) : (
                                <div className="space-y-3">
                                    {dailyPeriods.map((period, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between p-4 rounded-lg border border-border ${period.status === "not-applicable"
                                                    ? "bg-muted/10 opacity-40"
                                                    : "bg-muted/30 hover:bg-muted/50 transition-colors"
                                                }`}
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-foreground text-sm">
                                                    {period.subject}
                                                </h4>
                                                {period.time && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            {period.time}
                                                        </span>
                                                        {period.room && (
                                                            <>
                                                                <span className="text-muted-foreground text-xs">•</span>
                                                                <span className="text-xs text-muted-foreground">{period.room}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                {period.status === "PRESENT" && (
                                                    <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Present
                                                    </Badge>
                                                )}
                                                {period.status === "ABSENT" && (
                                                    <Badge variant="destructive">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Absent
                                                    </Badge>
                                                )}
                                                {period.status === "not-marked" && (
                                                    <Badge variant="outline" className="text-muted-foreground border-muted-foreground/50">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Not Marked Yet
                                                    </Badge>
                                                )}
                                                {period.status === "not-applicable" && (
                                                    <Badge variant="outline" className="bg-transparent border-transparent text-muted-foreground/50">
                                                        —
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar Heatmap */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Attendance Calendar</CardTitle>
                                <CardDescription>Visual overview of your attendance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    className="rounded-md border"
                                    modifiers={{
                                        present: presentDates,
                                        absent: absentDates,
                                    }}
                                    modifiersClassNames={{
                                        present: "bg-accent/20 text-accent font-medium",
                                        absent: "bg-destructive/20 text-destructive font-medium",
                                    }}
                                />
                                <div className="flex justify-center gap-4 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-accent/50" />
                                        <span className="text-sm text-muted-foreground">Present</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-destructive/50" />
                                        <span className="text-sm text-muted-foreground">Absent</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Subject-wise Stats */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Subject-wise Statistics</CardTitle>
                                <CardDescription>Your attendance breakdown by subject</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.subjectStats.length > 0 ? (
                                        data.subjectStats.map((subject, index) => (
                                            <div key={index} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium text-foreground">{subject.subject}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground">
                                                            {subject.present}/{subject.total}
                                                        </span>
                                                        <Badge
                                                            variant={subject.percentage >= 75 ? "default" : "destructive"}
                                                            className={subject.percentage >= 75 ? "bg-accent text-accent-foreground" : ""}
                                                        >
                                                            {subject.percentage}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Progress
                                                    value={subject.percentage}
                                                    className={`h-2 ${subject.percentage < 75 ? "[&>div]:bg-destructive" : "[&>div]:bg-accent"}`}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No attendance data yet
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Records Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Attendance Records</CardTitle>
                            <CardDescription>Your latest attendance entries</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Day</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Subject</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Time</th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recentRecords.length > 0 ? (
                                            recentRecords.map((record, index) => (
                                                <tr key={index} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-foreground">{record.date}</td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{record.day}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-foreground">{record.subject}</td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{record.time}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge
                                                            variant={record.status === "PRESENT" ? "default" : "destructive"}
                                                            className={record.status === "PRESENT" ? "bg-accent text-accent-foreground" : ""}
                                                        >
                                                            {record.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                    No attendance records yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
