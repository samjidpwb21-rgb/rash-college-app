"use client"

// ============================================================================
// CAMPUSTRACK - STUDENT COURSES CLIENT COMPONENT
// ============================================================================

import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { User, Calendar, BookOpen, CheckCircle } from "lucide-react"

interface CourseInfo {
    code: string
    name: string
    faculty: string
    semester: number
    progress?: number
}

interface StudentCoursesClientProps {
    user: {
        name: string
        departmentName: string
        semesterNumber: number
    }
    currentSemester: number
    courses: CourseInfo[]
}

export function StudentCoursesClient({ user, currentSemester, courses }: StudentCoursesClientProps) {
    const headerUser = {
    const [sidebarOpen, setSidebarOpen] = useState(false)
        name: user.name,
        email: "",
        role: `${user.departmentName} • Semester ${user.semesterNumber}`,
    }

    // Group courses by semester
    const groupedCourses = courses.reduce((acc, course) => {
        const sem = course.semester
        if (!acc[sem]) acc[sem] = []
        acc[sem].push(course)
        return acc
    }, {} as Record<number, CourseInfo[]>)

    const getSemesterLabel = (sem: number) => {
        if (sem < currentSemester) return "Completed"
        if (sem === currentSemester) return "Current"
        return "Upcoming"
    }

    const getSemesterColor = (sem: number) => {
        if (sem < currentSemester) return "bg-green-500"
        if (sem === currentSemester) return "bg-blue-500"
        return "bg-muted"
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="student" />

            <MobileSidebar role="student" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="My Courses" user={headerUser} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-6 space-y-6">
                    {/* Header */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Course Catalog</h2>
                        <p className="text-slate-300">All courses across your academic journey</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Completed</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {courses.filter((c) => c.semester < currentSemester).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">In Progress</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {courses.filter((c) => c.semester === currentSemester).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                        <Calendar className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Upcoming</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {courses.filter((c) => c.semester > currentSemester).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Courses by Semester */}
                    {Object.keys(groupedCourses)
                        .sort((a, b) => Number(b) - Number(a))
                        .map((sem) => {
                            const semNum = Number(sem)
                            const semCourses = groupedCourses[semNum]
                            return (
                                <Card key={sem}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>Semester {sem}</CardTitle>
                                                <CardDescription>{semCourses.length} courses</CardDescription>
                                            </div>
                                            <Badge className={getSemesterColor(semNum)}>{getSemesterLabel(semNum)}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {semCourses.map((course) => (
                                                <div
                                                    key={course.code}
                                                    className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-medium text-foreground text-sm">{course.name}</h4>
                                                        <Badge variant="outline" className="text-xs shrink-0">
                                                            {course.code}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                                                        <User className="h-3 w-3" />
                                                        {course.faculty}
                                                    </div>
                                                    {course.progress !== undefined && (
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-muted-foreground">Progress</span>
                                                                <span className="text-foreground">{course.progress}%</span>
                                                            </div>
                                                            <Progress value={course.progress} className="h-1.5" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}

                    {courses.length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No courses found</p>
                            </CardContent>
                        </Card>
                    )}
                </main>
            </div>
        </div>
    )
}
