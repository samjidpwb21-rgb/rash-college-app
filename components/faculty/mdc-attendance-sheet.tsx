"use client"

// ============================================================================
// CAMPUSTRACK - MDC ATTENDANCE SHEET COMPONENT
// ============================================================================
// Attendance marking interface for MDC courses

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Check, X, Loader2, Users } from "lucide-react"
import { getMDCStudentsForAttendance } from "@/actions/admin/mdc"
import { submitMDCAttendance, getExistingMDCAttendance } from "@/actions/faculty/mdc-attendance"
import { AttendanceStatus } from "@prisma/client"
import { toast } from "sonner"

interface MDCAttendanceSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    course: {
        id: string
        courseName: string
        year: number
        semester: number
    } | null
}

interface Student {
    id: string
    name: string
    enrollmentNo: string
    email: string
}

export function MDCAttendanceSheet({ open, onOpenChange, course }: MDCAttendanceSheetProps) {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [date, setDate] = useState<Date>(new Date())
    const [period, setPeriod] = useState<string>("1")
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})

    useEffect(() => {
        if (open && course) {
            loadStudentsAndAttendance()
        } else {
            // Reset on close
            setStudents([])
            setAttendance({})
            setDate(new Date())
            setPeriod("1")
        }
    }, [open, course])

    useEffect(() => {
        if (course && students.length > 0) {
            loadExistingAttendance()
        }
    }, [date, period])

    const loadStudentsAndAttendance = async () => {
        if (!course) return

        setLoading(true)
        try {
            const result = await getMDCStudentsForAttendance(course.id)
            if (result.success && result.data) {
                setStudents(result.data)
                // Initialize all as PRESENT
                const initialAttendance: Record<string, AttendanceStatus> = {}
                result.data.forEach((s) => {
                    initialAttendance[s.id] = "PRESENT"
                })
                setAttendance(initialAttendance)

                // Load existing attendance for today, period 1
                await loadExistingAttendance()
            } else {
                toast.error("Failed to load students")
            }
        } catch (error) {
            console.error("Error loading students:", error)
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const loadExistingAttendance = async () => {
        if (!course) return

        try {
            const result = await getExistingMDCAttendance(course.id, date, parseInt(period))
            if (result.success && result.data) {
                setAttendance((prev) => {
                    const updated = { ...prev }
                    Object.keys(result.data!).forEach((studentId) => {
                        updated[studentId] = result.data![studentId].status
                    })
                    return updated
                })
            }
        } catch (error) {
            console.error("Error loading existing attendance:", error)
        }
    }

    const toggleAttendance = (studentId: string) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: prev[studentId] === "PRESENT" ? "ABSENT" : "PRESENT",
        }))
    }

    const handleSubmit = async () => {
        if (!course) return

        setSubmitting(true)
        try {
            const records = Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status,
            }))

            const result = await submitMDCAttendance({
                mdcCourseId: course.id,
                date,
                period: parseInt(period),
                records,
            })

            if (result.success) {
                toast.success("MDC attendance saved successfully!")
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to save attendance")
            }
        } catch (error) {
            console.error("Error submitting attendance:", error)
            toast.error("An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    const presentCount = Object.values(attendance).filter((s) => s === "PRESENT").length
    const absentCount = students.length - presentCount

    if (!course) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{course.courseName}</DialogTitle>
                    <DialogDescription className="flex flex-wrap gap-2 mt-2">
                        <Badge>Year {course.year} • Semester {course.semester}</Badge>
                        <Badge variant="secondary">MDC Course</Badge>
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6 mt-4">
                        {/* Date and Period Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>Period</Label>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5].map((p) => (
                                            <SelectItem key={p} value={String(p)}>
                                                Period {p}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex gap-4">
                            <Badge variant="default" className="text-base py-2 px-4">
                                <Users className="h-4 w-4 mr-2" />
                                {students.length} Total
                            </Badge>
                            <Badge variant="default" className="text-base py-2 px-4 bg-green-500">
                                <Check className="h-4 w-4 mr-2" />
                                {presentCount} Present
                            </Badge>
                            <Badge variant="destructive" className="text-base py-2 px-4">
                                <X className="h-4 w-4 mr-2" />
                                {absentCount} Absent
                            </Badge>
                        </div>

                        {/* Student List */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    {students.map((student) => {
                                        const isPresent = attendance[student.id] === "PRESENT"
                                        return (
                                            <div
                                                key={student.id}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer",
                                                    isPresent
                                                        ? "border-green-500 bg-green-500/10"
                                                        : "border-red-500 bg-red-500/10"
                                                )}
                                                onClick={() => toggleAttendance(student.id)}
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">{student.name}</p>
                                                    <p className="text-sm text-muted-foreground">{student.enrollmentNo}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={isPresent ? "default" : "destructive"}>
                                                        {isPresent ? "Present" : "Absent"}
                                                    </Badge>
                                                    <div
                                                        className={cn(
                                                            "h-6 w-6 rounded-full flex items-center justify-center",
                                                            isPresent ? "bg-green-500" : "bg-red-500"
                                                        )}
                                                    >
                                                        {isPresent ? (
                                                            <Check className="h-4 w-4 text-white" />
                                                        ) : (
                                                            <X className="h-4 w-4 text-white" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={submitting} size="lg">
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Submit Attendance
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
