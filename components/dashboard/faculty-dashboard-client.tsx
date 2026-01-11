"use client"

// ============================================================================
// CAMPUSTRACK - FACULTY DASHBOARD CLIENT COMPONENT
// ============================================================================
// Client wrapper for interactive elements

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, Calendar, ClipboardCheck, ArrowRight, CheckCircle, Clock } from "lucide-react"
import { AttendanceTypeModal } from "@/components/faculty/attendance-type-modal"
import { RegularAttendancePeriods } from "@/components/faculty/regular-attendance-periods"
import { MDCAttendanceSelector } from "@/components/faculty/mdc-placeholder"
import { MDCAttendanceSheet } from "@/components/faculty/mdc-attendance-sheet"
import { MarkAttendanceModal } from "@/components/faculty/mark-attendance-modal"
import { useRouter } from "next/navigation"
import { useLoading } from "@/contexts/loading-context"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"

interface FacultyDashboardProps {
    data: {
        user: {
            name: string
            email: string
            departmentName: string
            designation: string
            facultyId: string  // For MDC course queries
        }
        stats: {
            totalSubjects: number
            totalStudents: number
            classesToday: number
            attendanceMarkedToday: number
        }
        todayClasses: Array<{
            period: number
            time: string
            subjectId: string
            subjectCode: string
            subjectName: string
            room: string | null
            semester: number
            studentCount: number
            attendanceMarked: boolean
        }>
        subjects: Array<{
            id: string
            code: string
            name: string
            semester: number
        }>
        weeklyTimetable: Array<{
            id: string
            dayOfWeek: number
            period: number
            room: string | null
            subject: {
                name: string
                code: string
            }
            semester: {
                number: number
            }
        }>
    }
}

export function FacultyDashboardClient({ data }: FacultyDashboardProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const router = useRouter()
    const { forceFinishAll } = useLoading()

    // Attendance modal states
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)
    const [isPeriodsModalOpen, setIsPeriodsModalOpen] = useState(false)
    const [isMDCModalOpen, setIsMDCModalOpen] = useState(false)
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<{
        id: string
        code: string
        name: string
        room: string
        period: number
    } | null>(null)
    const [selectedMDCCourse, setSelectedMDCCourse] = useState<{
        id: string
        courseName: string
        year: number
        semester: number
    } | null>(null)
    const [isMDCAttendanceSheetOpen, setIsMDCAttendanceSheetOpen] = useState(false)

    // Attendance handlers
    const handleMarkAttendanceClick = () => {
        setIsTypeModalOpen(true)
    }

    const handleSelectRegular = () => {
        setIsTypeModalOpen(false)
        setIsPeriodsModalOpen(true)
    }

    const handleSelectMDC = () => {
        setIsTypeModalOpen(false)
        setIsMDCModalOpen(true)
    }

    const handleSelectPeriod = (periodClass: typeof data.todayClasses[0]) => {
        const subject = data.subjects.find(s => s.id === periodClass.subjectId)
        if (subject) {
            setSelectedSubject({
                id: subject.id,
                code: subject.code,
                name: subject.name,
                room: periodClass.room || "TBA",
                period: periodClass.period,
            })
            setIsPeriodsModalOpen(false)
            setIsAttendanceModalOpen(true)
        }
    }

    const handleAttendanceSuccess = () => {
        router.refresh()
    }

    const handleSelectMDCCourse = (course: {
        id: string
        courseName: string
        year: number
        semester: number
    }) => {
        setSelectedMDCCourse(course)
        setIsMDCModalOpen(false)
        setIsMDCAttendanceSheetOpen(true)
    }

    const user = {
        name: data.user.name,
        email: data.user.email,
        role: `${data.user.designation} - ${data.user.departmentName}`,
    }

    // Force clear any stuck loading states when dashboard mounts
    useEffect(() => {
        forceFinishAll()
    }, [])

    return (
        <div className="min-h-screen bg-background">
            <DashboardSidebar role="faculty" />
            <MobileSidebar role="faculty" open={sidebarOpen} onOpenChange={setSidebarOpen} />

            <div className="lg:ml-64">
                <DashboardHeader title="Faculty Dashboard" user={user} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-4 sm:p-6 space-y-6">
                    {/* PWA Install Prompt */}
                    <PwaInstallPrompt variant="banner" />

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <StatsCard
                            title="My Subjects"
                            value={String(data.stats.totalSubjects)}
                            description="Assigned courses"
                            icon={BookOpen}
                            className="shadow-lg"
                        />
                        <StatsCard
                            title="Total Students"
                            value={String(data.stats.totalStudents)}
                            description="Across all subjects"
                            icon={Users}
                            className="shadow-lg"
                        />
                        <StatsCard
                            title="Classes Today"
                            value={String(data.stats.classesToday)}
                            description={data.todayClasses[0]?.subjectName ? `Next: ${data.todayClasses[0].subjectName}` : "No classes"}
                            icon={Calendar}
                            className="shadow-lg"
                        />
                        <StatsCard
                            title="Attendance Marked"
                            value={String(data.stats.attendanceMarkedToday)}
                            description="Records today"
                            icon={ClipboardCheck}
                            className="shadow-lg"
                        />
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Today's Classes */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Today's Classes</CardTitle>
                                        <CardDescription>Your schedule for today</CardDescription>
                                    </div>
                                    <Link href="/dashboard/faculty/schedule">
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            View Schedule
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.todayClasses.length > 0 ? (
                                        data.todayClasses.map((cls, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                            >
                                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                    {cls.time.split(" ")[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-foreground">{cls.subjectName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Sem {cls.semester} • {cls.room || "TBA"} • {cls.studentCount} students
                                                    </p>
                                                </div>
                                                {cls.attendanceMarked ? (
                                                    <Badge variant="default" className="bg-green-500">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Marked
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                )}
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

                        {/* Quick Actions */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Frequently used tasks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        className="w-full h-24 flex-col gap-2"
                                        onClick={handleMarkAttendanceClick}
                                    >
                                        <ClipboardCheck className="h-6 w-6" />
                                        <span>Mark Attendance</span>
                                    </Button>
                                    <Link href="/dashboard/faculty/students">
                                        <Button variant="outline" className="w-full h-24 flex-col gap-2">
                                            <Users className="h-6 w-6" />
                                            <span>View Students</span>
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard/faculty/notices">
                                        <Button variant="outline" className="w-full h-24 flex-col gap-2">
                                            <BookOpen className="h-6 w-6" />
                                            <span>Notice Board</span>
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard/faculty/events">
                                        <Button variant="outline" className="w-full h-24 flex-col gap-2">
                                            <Calendar className="h-6 w-6" />
                                            <span>Events Calendar</span>
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Weekly Timetable */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>My Weekly Timetable</CardTitle>
                                    <CardDescription>Your schedule for the week</CardDescription>
                                </div>
                                <Link href="/dashboard/faculty/schedule">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        Full Schedule
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-1 sm:p-2 text-left text-[10px] sm:text-sm font-medium text-muted-foreground bg-muted/50">Day</th>
                                            {[1, 2, 3, 4, 5].map(period => (
                                                <th key={period} className="p-1 sm:p-2 text-center text-[10px] sm:text-sm font-medium text-muted-foreground bg-muted/50">
                                                    <span className="hidden sm:inline">Period {period}</span>
                                                    <span className="sm:hidden">P{period}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { full: 'Monday', short: 'Mon' },
                                            { full: 'Tuesday', short: 'Tue' },
                                            { full: 'Wednesday', short: 'Wed' },
                                            { full: 'Thursday', short: 'Thu' },
                                            { full: 'Friday', short: 'Fri' },
                                            { full: 'Saturday', short: 'Sat' }
                                        ].map((day, dayIndex) => {
                                            const dayOfWeek = dayIndex + 1
                                            const dayClasses = data.weeklyTimetable.filter(t => t.dayOfWeek === dayOfWeek)

                                            return (
                                                <tr key={day.full} className="border-b hover:bg-muted/30 transition-colors">
                                                    <td className="p-1 sm:p-2 font-medium text-[10px] sm:text-sm">
                                                        <span className="hidden sm:inline">{day.full}</span>
                                                        <span className="sm:hidden">{day.short}</span>
                                                    </td>
                                                    {[1, 2, 3, 4, 5].map(period => {
                                                        const classInfo = dayClasses.find(c => c.period === period)

                                                        return (
                                                            <td key={period} className="p-0.5 sm:p-1">
                                                                {classInfo ? (
                                                                    <div className="p-1 sm:p-2 bg-primary/10 rounded border border-primary/20 text-[9px] sm:text-xs">
                                                                        <div className="font-medium text-primary truncate leading-tight" title={classInfo.subject.name}>
                                                                            {classInfo.subject.name}
                                                                        </div>
                                                                        <div className="text-primary/70 mt-0.5 leading-tight">{classInfo.subject.code}</div>
                                                                        <div className="text-muted-foreground mt-0.5 leading-tight hidden sm:block">Sem {classInfo.semester.number}</div>
                                                                        {classInfo.room && (
                                                                            <div className="text-muted-foreground mt-0.5 leading-tight hidden sm:block">{classInfo.room}</div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-1 sm:p-2 text-center text-muted-foreground text-[9px] sm:text-xs">Free</div>
                                                                )}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* My Subjects */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>My Subjects</CardTitle>
                                    <CardDescription>Courses assigned to you</CardDescription>
                                </div>
                                <Link href="/dashboard/faculty/classes">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        View All
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {data.subjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {data.subjects.map((subject) => (
                                        <div
                                            key={subject.id}
                                            className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-foreground">{subject.name}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {subject.code} • Semester {subject.semester}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">Active</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No subjects assigned yet
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </main>

                {/* Attendance Type Modal */}
                <AttendanceTypeModal
                    open={isTypeModalOpen}
                    onOpenChange={setIsTypeModalOpen}
                    onSelectRegular={handleSelectRegular}
                    onSelectMDC={handleSelectMDC}
                />

                {/* Regular Attendance Periods */}
                <RegularAttendancePeriods
                    open={isPeriodsModalOpen}
                    onOpenChange={setIsPeriodsModalOpen}
                    todayClasses={data.todayClasses}
                    onSelectPeriod={handleSelectPeriod}
                />

                {/* MDC Attendance Selector */}
                <MDCAttendanceSelector
                    open={isMDCModalOpen}
                    onOpenChange={setIsMDCModalOpen}
                    facultyId={data.user.facultyId}
                    onSelectCourse={handleSelectMDCCourse}
                />

                {/* MDC Attendance Sheet */}
                <MDCAttendanceSheet
                    open={isMDCAttendanceSheetOpen}
                    onOpenChange={setIsMDCAttendanceSheetOpen}
                    course={selectedMDCCourse}
                />

                {/* Attendance Marking Modal */}
                {selectedSubject && (
                    <MarkAttendanceModal
                        open={isAttendanceModalOpen}
                        onOpenChange={setIsAttendanceModalOpen}
                        subjectId={selectedSubject.id}
                        subjectCode={selectedSubject.code}
                        subjectName={selectedSubject.name}
                        room={selectedSubject.room}
                        period={selectedSubject.period}
                        onSubmitSuccess={handleAttendanceSuccess}
                    />
                )}
            </div>
        </div>
    )
}
