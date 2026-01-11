"use client"

// ============================================================================
// CAMPUSTRACK - STUDENT DASHBOARD CLIENT COMPONENT
// ============================================================================
// Client wrapper for interactive elements (charts, sidebar toggle)
// Data is passed from server component

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Calendar, ClipboardCheck, Clock, GraduationCap, User, ArrowRight } from "lucide-react"
import { getSubjectColor } from "@/lib/chart-colors"
import { CustomBarTooltip } from "@/lib/custom-bar-tooltip"
import { useLoading } from "@/contexts/loading-context"
import { DailyAttendanceBar } from "@/components/dashboard/daily-attendance-bar"
import { DailyAttendanceBlock } from "@/actions/daily-attendance"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"

interface StudentDashboardProps {
    data: {
        user: {
            name: string
            email: string
            avatar?: string | null
            departmentName: string
            semesterNumber: number
        }
        stats: {
            overallAttendance: number
            classesToday: number
            totalSubjects: number
            classesAttended: number
            totalClasses: number
        }
        subjectAttendance: Array<{
            code: string
            name: string
            present: number
            total: number
            percentage: number
        }>
        todaySchedule: Array<{
            period: number
            time: string
            subject: string
            room: string | null
            faculty: string
        }>
        currentCourses: Array<{
            code: string
            name: string
            faculty: string
            progress: number
        }>
        dailyAttendance: DailyAttendanceBlock[]
    }
}

export function StudentDashboardClient({ data }: StudentDashboardProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { forceFinishAll } = useLoading()

    const user = {
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar,
        role: `${data.user.departmentName} - Semester ${data.user.semesterNumber}`,
    }

    // Force clear any stuck loading states when dashboard mounts
    useEffect(() => {
        forceFinishAll()
    }, [])

    // Transform subject attendance for chart
    const attendanceChartData = data.subjectAttendance.map((s) => ({
        subject: s.code,
        present: s.percentage,
        absent: 100 - s.percentage,
    }))

    // Overall attendance for pie chart
    const overallAttendance = [
        { name: "Present", value: data.stats.overallAttendance, color: "#22c55e" },
        { name: "Absent", value: 100 - data.stats.overallAttendance, color: "#ef4444" },
    ]

    // Period times are now handled in the server action using centralized lib/period-times.ts

    return (
        <div className="min-h-screen bg-background">
            <DashboardSidebar role="student" />
            <MobileSidebar role="student" open={sidebarOpen} onOpenChange={setSidebarOpen} />

            <div className="lg:ml-64">
                <DashboardHeader title="Student Dashboard" user={user} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-4 sm:p-6 space-y-6">
                    {/* PWA Install Prompt */}
                    <PwaInstallPrompt variant="banner" />

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <StatsCard
                            title="Overall Attendance"
                            value={`${data.stats.overallAttendance}%`}
                            description="This semester"
                            icon={ClipboardCheck}
                            trend={data.stats.overallAttendance >= 75 ? { value: 0, positive: true } : undefined}
                            className="shadow-lg"
                        />
                        <StatsCard
                            title="Classes Today"
                            value={String(data.stats.classesToday)}
                            description={data.todaySchedule[0]?.subject ? `Next: ${data.todaySchedule[0].subject}` : "No classes"}
                            icon={Calendar}
                            className="shadow-lg"
                        />
                        <StatsCard
                            title="Total Subjects"
                            value={String(data.stats.totalSubjects)}
                            description="Active courses"
                            icon={GraduationCap}
                            className="shadow-lg"
                        />
                        <StatsCard
                            title="Classes Attended"
                            value={String(data.stats.classesAttended)}
                            description={`Out of ${data.stats.totalClasses} total`}
                            icon={Clock}
                            className="shadow-lg"
                        />
                    </div>

                    {/* Daily Attendance Status Bar */}
                    <DailyAttendanceBar blocks={data.dailyAttendance} />

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 shadow-lg">
                            <CardHeader>
                                <CardTitle>Subject-wise Attendance</CardTitle>
                                <CardDescription>Your attendance percentage by subject</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-72">
                                    {attendanceChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={attendanceChartData}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                                <XAxis dataKey="subject" className="text-xs" />
                                                <YAxis className="text-xs" />
                                                <Tooltip content={<CustomBarTooltip colorKey="subject" />} />
                                                <Bar dataKey="present" radius={[8, 8, 0, 0]} name="Present %">
                                                    {attendanceChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={getSubjectColor(entry.subject)} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            No attendance data yet
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-1 shadow-lg">
                            <CardHeader>
                                <CardTitle>Overall Status</CardTitle>
                                <CardDescription>Attendance distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={overallAttendance}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {overallAttendance.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-4">
                                    {overallAttendance.map((item) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-sm text-muted-foreground">
                                                {item.name}: {item.value}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Schedule and Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Today's Schedule</CardTitle>
                                <CardDescription>Upcoming classes for today</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.todaySchedule.length > 0 ? (
                                        data.todaySchedule.map((cls, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                            >
                                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                    {cls.time.split(" ")[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-foreground">{cls.subject}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {cls.faculty} • {cls.room || "TBA"}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary">{cls.time.split(" ")[1]}</Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No classes scheduled for today
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Detailed Breakdown</CardTitle>
                                <CardDescription>Classes attended per subject</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.subjectAttendance.length > 0 ? (
                                        data.subjectAttendance.map((subject, index) => (
                                            <div key={index} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium text-foreground">{subject.name} ({subject.code})</span>
                                                    <span className="text-muted-foreground">
                                                        {subject.present}/{subject.total} ({subject.percentage}%)
                                                    </span>
                                                </div>
                                                <Progress value={subject.percentage} className="h-2" />
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

                    {/* Current Semester Courses */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Current Semester Courses</CardTitle>
                                    <CardDescription>Semester {data.user.semesterNumber} - Ongoing courses</CardDescription>
                                </div>
                                <Link href="/dashboard/student/courses">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        View All Courses
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {data.currentCourses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.currentCourses.map((course) => (
                                        <div
                                            key={course.code}
                                            className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors space-y-3"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-foreground text-sm leading-tight">
                                                        {course.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {course.code}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Badge variant="default" className="text-xs bg-blue-500 hover:bg-blue-600">
                                                    Ongoing
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <User className="h-3 w-3" />
                                                {course.faculty}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Course Progress</span>
                                                    <span className="font-medium text-foreground">{course.progress}%</span>
                                                </div>
                                                <Progress value={course.progress} className="h-2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No courses enrolled for current semester
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
