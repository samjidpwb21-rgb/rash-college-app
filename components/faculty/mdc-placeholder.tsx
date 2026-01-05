"use client"

// ============================================================================
// CAMPUSTRACK - MDC ATTENDANCE SELECTOR COMPONENT
// ============================================================================
// Replaces the MDC placeholder - shows faculty's assigned MDC courses

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Network, Users, BookOpen, ArrowRight, Loader2 } from "lucide-react"
import { getMDCCoursesForFaculty } from "@/actions/admin/mdc"
import { toast } from "sonner"

interface MDCCourse {
    id: string
    courseName: string
    year: number
    semester: number
    studentCount: number
    homeDepartment: {
        name: string
        code: string
    }
    mdcDepartment: {
        name: string
        code: string
    }
}

interface MDCAttendanceSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    facultyId: string
    onSelectCourse: (course: MDCCourse) => void
}

export function MDCAttendanceSelector({
    open,
    onOpenChange,
    facultyId,
    onSelectCourse,
}: MDCAttendanceSelectorProps) {
    const [courses, setCourses] = useState<MDCCourse[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (open && facultyId) {
            loadCourses()
        }
    }, [open, facultyId])

    const loadCourses = async () => {
        setLoading(true)
        try {
            const result = await getMDCCoursesForFaculty(facultyId)
            if (result.success && result.data) {
                setCourses(result.data)
            } else {
                toast.error("Failed to load MDC courses")
            }
        } catch (error) {
            console.error("Error loading MDC courses:", error)
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Network className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl">MDC Attendance</DialogTitle>
                            <DialogDescription className="text-base">
                                Select an MDC course to mark attendance
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : courses.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="pt-12 pb-12 text-center">
                                <Network className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">No MDC Courses Assigned</h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                    You don't have any MDC courses assigned to you yet.
                                    Contact your admin to assign MDC courses.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {courses.map((course) => (
                                <Card
                                    key={course.id}
                                    className="cursor-pointer hover:border-indigo-500/50 hover:shadow-md transition-all"
                                    onClick={() => {
                                        onSelectCourse(course)
                                        onOpenChange(false)
                                    }}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <BookOpen className="h-4 w-4 text-indigo-500" />
                                                    <CardTitle className="text-lg">{course.courseName}</CardTitle>
                                                </div>
                                                <CardDescription className="flex flex-wrap gap-2 items-center">
                                                    <Badge variant="outline">
                                                        {course.homeDepartment.code} → {course.mdcDepartment.code}
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        Year {course.year} • Sem {course.semester}
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {course.studentCount} students
                                                    </Badge>
                                                </CardDescription>
                                            </div>
                                            <Button variant="ghost" size="icon">
                                                <ArrowRight className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
