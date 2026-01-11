"use client"

import { useState } from "react"

// ============================================================================
// CAMPUSTRACK - FACULTY CLASSES CLIENT COMPONENT
// ============================================================================

import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Clock, MapPin, BookOpen, TrendingUp, CheckCircle } from "lucide-react"

interface SubjectData {
    id: string
    code: string
    name: string
    semester: number
    totalStudents: number
    avgAttendance: number
}

interface TodayClass {
    period: number
    time: string
    subjectId: string
    subjectCode: string
    subjectName: string
    room: string | null
    studentCount: number
    attendanceMarked: boolean
    semester: number  // Added for period view
}

interface FacultyClassesClientProps {
    user: {
        name: string
        departmentName: string
        designation: string
    }
    subjects: SubjectData[]
    todayClasses: TodayClass[]
}

export function FacultyClassesClient({ user, subjects, todayClasses }: FacultyClassesClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const headerUser = {
        name: user.name,
        email: "",
        role: `${user.departmentName} • ${user.designation}`,
    }

    const totalStudents = subjects.reduce((acc, s) => acc + s.totalStudents, 0)
    const avgAttendance = subjects.length > 0
        ? Math.round(subjects.reduce((acc, s) => acc + s.avgAttendance, 0) / subjects.length)
        : 0

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="faculty" />

            <MobileSidebar role="faculty" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="My Classes" user={headerUser} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-6 space-y-6">
                    {/* Header */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">My Classes</h2>
                        <p className="text-slate-300">View your subjects and attendance statistics</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Subjects</p>
                                        <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
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
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Attendance</p>
                                        <p className="text-2xl font-bold text-foreground">{avgAttendance}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Today's Classes */}
                    {todayClasses.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Today's Classes</CardTitle>
                                <CardDescription>Classes scheduled for today</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {todayClasses.map((cls, index) => {
                                        const subject = subjects.find((s) => s.id === cls.subjectId)
                                        return (
                                            <div
                                                key={index}
                                                className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-medium text-foreground text-sm">{cls.subjectName}</h4>
                                                        <Badge variant="outline" className="text-xs mt-1">{cls.subjectCode}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {cls.attendanceMarked && (
                                                            <Badge className="bg-green-500/20 text-green-500 border border-green-500/30">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Done
                                                            </Badge>
                                                        )}
                                                        <Badge className="bg-primary text-xs">Period {cls.period}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {cls.time}
                                                    </span>
                                                    {cls.room && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {cls.room}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {cls.studentCount}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* All Subjects */}
                    <Card>
                        <CardHeader>
                            <CardTitle>My Subjects</CardTitle>
                            <CardDescription>All subjects assigned to you</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {subjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {subjects.map((subject) => (
                                        <div
                                            key={subject.id}
                                            className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-foreground">{subject.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline">{subject.code}</Badge>
                                                        <Badge variant="secondary">Sem {subject.semester}</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Users className="h-4 w-4" />
                                                    {subject.totalStudents} students
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <TrendingUp className="h-4 w-4" />
                                                    {subject.avgAttendance}% avg
                                                </div>
                                            </div>

                                            <Progress value={subject.avgAttendance} className="h-2 mb-3" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No subjects assigned</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </main>
            </div>
        </div>
    )
}
