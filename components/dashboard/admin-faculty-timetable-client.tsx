"use client"

// ============================================================================
// CAMPUSTRACK - ADMIN FACULTY TIMETABLE CLIENT COMPONENT
// Unified timetable view for faculty members (all semesters combined)
// ============================================================================

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Calendar, BookOpen, GraduationCap } from "lucide-react"
import { getFacultyUnifiedTimetable, getFacultyTimetableStats } from "@/actions/admin/faculty-timetable"

interface TimetableEntry {
    id: string
    dayOfWeek: number
    period: number
    room?: string
    subjectColor: string  // Persistent color from server
    subject: {
        id: string
        name: string
        code: string
    }
    semester: {
        id: string
        number: number
        name: string
    }
    academicYear: {
        id: string
        year: number
        name: string
    }
}

interface AdminFacultyTimetableClientProps {
    department: {
        id: string
        name: string
        code: string
    }
    facultyList: Array<{
        id: string
        user: {
            id: string
            name: string
            email: string
        }
    }>
    user: {
        name: string
        email: string
        role: string
    }
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const PERIODS = [1, 2, 3, 4, 5]

export function AdminFacultyTimetableClient({
    department,
    facultyList,
    user,
}: AdminFacultyTimetableClientProps) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { toast } = useToast()
    const [selectedFaculty, setSelectedFaculty] = useState<string>(facultyList[0]?.id || "")
    const [facultyName, setFacultyName] = useState<string>(facultyList[0]?.user.name || "")
    const [timetable, setTimetable] = useState<TimetableEntry[]>([])
    const [stats, setStats] = useState({ totalPeriods: 0, totalSubjects: 0, totalSemesters: 0 })
    const [isLoading, setIsLoading] = useState(false)

    // Load timetable when faculty changes
    useEffect(() => {
        if (selectedFaculty) {
            loadFacultyTimetable()
            loadFacultyStats()
        }
    }, [selectedFaculty])

    const loadFacultyTimetable = async () => {
        setIsLoading(true)
        try {
            const result = await getFacultyUnifiedTimetable(selectedFaculty, department.id)
            if (result.success && result.data) {
                // Colors are now server-provided and persistent
                setTimetable(result.data.timetable)
                setFacultyName(result.data.faculty.user.name)
            } else {
                toast({
                    title: "Error",
                    description: !result.success ? result.error : "Failed to load timetable",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Load faculty timetable error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadFacultyStats = async () => {
        try {
            const result = await getFacultyTimetableStats(selectedFaculty, department.id)
            if (result.success && result.data) {
                setStats(result.data)
            }
        } catch (error) {
            console.error("Load stats error:", error)
        }
    }



    const getTimetableEntry = (day: number, period: number): TimetableEntry | undefined => {
        return timetable.find(entry => entry.dayOfWeek === day && entry.period === period)
    }

    const handleFacultyChange = (facultyId: string) => {
        setSelectedFaculty(facultyId)
        const faculty = facultyList.find(f => f.id === facultyId)
        if (faculty) {
            setFacultyName(faculty.user.name)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />

            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title={`${department.name} – Faculty Timetable`} user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/admin/departments/${department.id}`)}
                        className="mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Department
                    </Button>

                    {/* Faculty Selector */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Select Faculty Member</CardTitle>
                                <Badge variant="outline">{department.code}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {facultyList.length > 0 ? (
                                <Select value={selectedFaculty} onValueChange={handleFacultyChange}>
                                    <SelectTrigger className="w-full md:w-[400px]">
                                        <SelectValue placeholder="Select faculty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {facultyList.map((faculty) => (
                                            <SelectItem key={faculty.id} value={faculty.id}>
                                                {faculty.user.name} ({faculty.user.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p className="text-muted-foreground">No faculty members found in this department</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Faculty Stats */}
                    {selectedFaculty && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                            <Calendar className="h-6 w-6 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Periods</p>
                                            <p className="text-2xl font-bold text-foreground">{stats.totalPeriods}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                            <BookOpen className="h-6 w-6 text-chart-3" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Subjects Teaching</p>
                                            <p className="text-2xl font-bold text-foreground">{stats.totalSubjects}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
                                            <GraduationCap className="h-6 w-6 text-chart-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Semesters</p>
                                            <p className="text-2xl font-bold text-foreground">{stats.totalSemesters}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Unified Timetable Grid */}
                    {selectedFaculty && (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Unified Timetable - {facultyName}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Combined view across all semesters
                                </p>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="border border-border bg-muted p-3 text-left font-semibold">
                                                        Day / Period
                                                    </th>
                                                    {PERIODS.map((period) => (
                                                        <th
                                                            key={period}
                                                            className="border border-border bg-muted p-3 text-center font-semibold"
                                                        >
                                                            Period {period}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {DAYS.map((day, dayIndex) => (
                                                    <tr key={day}>
                                                        <td className="border border-border bg-muted p-3 font-semibold">
                                                            {day}
                                                        </td>
                                                        {PERIODS.map((period) => {
                                                            const entry = getTimetableEntry(dayIndex + 1, period)
                                                            return (
                                                                <td
                                                                    key={period}
                                                                    className="border border-border p-2 align-top"
                                                                >
                                                                    {entry ? (
                                                                        <div
                                                                            className={`rounded-md p-3 min-h-[100px] ${entry.subjectColor}`}
                                                                        >
                                                                            <div className="font-semibold text-sm mb-2">
                                                                                {entry.subject.name}
                                                                            </div>
                                                                            <div className="text-xs space-y-1">
                                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        {entry.subject.code}
                                                                                    </Badge>
                                                                                    <Badge variant="secondary" className="text-xs">
                                                                                        Sem {entry.semester.number}
                                                                                    </Badge>
                                                                                </div>
                                                                                {entry.room && <div>📍 {entry.room}</div>}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="min-h-[100px] flex items-center justify-center text-muted-foreground text-sm">
                                                                            Free
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {!isLoading && timetable.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No periods assigned</p>
                                        <p className="text-sm">This faculty member has no timetable entries yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </main>
            </div>
        </div>
    )
}
