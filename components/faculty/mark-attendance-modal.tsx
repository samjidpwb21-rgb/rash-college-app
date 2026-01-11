"use client"

// ============================================================================
// CAMPUSTRACK - FACULTY MARK ATTENDANCE MODAL (REFACTORED)
// Uses server actions instead of API routes
// ============================================================================

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, MapPin, Users, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getStudentsForAttendance, submitAttendance, getExistingAttendance } from "@/actions/faculty/classes-page"

interface Student {
    id: string
    enrollmentNo: string
    name: string
    attendancePercent: number
    status: "PRESENT" | "ABSENT"
}

interface MarkAttendanceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subjectId: string
    subjectCode: string
    subjectName: string
    room: string
    period: number
    onSubmitSuccess: () => void
}

export function MarkAttendanceModal({
    open,
    onOpenChange,
    subjectId,
    subjectCode,
    subjectName,
    room,
    period,
    onSubmitSuccess,
}: MarkAttendanceModalProps) {
    const [date, setDate] = useState<Date>(new Date())
    const [students, setStudents] = useState<Student[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    // Fetch students when modal opens or period changes
    useEffect(() => {
        if (open && subjectId) {
            loadStudentsWithAttendance()
        }
    }, [open, subjectId, period, date])

    const loadStudentsWithAttendance = async () => {
        setIsLoading(true)
        try {
            // Step 1: Fetch students
            const studentsResult = await getStudentsForAttendance(subjectId)
            if (!studentsResult.success) {
                toast({
                    title: "Error",
                    description: studentsResult.error || "Failed to load students",
                    variant: "destructive",
                })
                return
            }

            // Step 2: Fetch existing attendance for this specific period
            const existingResult = await getExistingAttendance(subjectId, date.toISOString())

            // Step 3: Merge data - preload existing attendance or default to PRESENT
            const studentsWithStatus = studentsResult.data.map(student => {
                let status: "PRESENT" | "ABSENT" = "PRESENT" // Default

                if (existingResult.success && existingResult.data) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const existingData = existingResult.data as any
                    const studentAttendance = existingData[student.id]

                    if (studentAttendance) {
                        // Check ONLY the specific period being marked
                        const periodStatus = studentAttendance[period]
                        if (periodStatus) {
                            status = periodStatus as "PRESENT" | "ABSENT"
                        }
                    }
                }

                return {
                    ...student,
                    status,
                }
            })

            setStudents(studentsWithStatus)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load students",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleStatusChange = (studentId: string, newStatus: "PRESENT" | "ABSENT") => {
        setStudents((prev) =>
            prev.map((student) =>
                student.id === studentId ? { ...student, status: newStatus } : student
            )
        )
    }

    const handleMarkAllPresent = () => {
        setStudents((prev) => prev.map((student) => ({ ...student, status: "PRESENT" })))
    }

    const handleMarkAllAbsent = () => {
        setStudents((prev) => prev.map((student) => ({ ...student, status: "ABSENT" })))
    }

    const handleSubmit = async () => {
        if (!date) {
            toast({
                title: "Date Required",
                description: "Please select a date for attendance.",
                variant: "destructive",
            })
            return
        }

        if (students.length === 0) {
            toast({
                title: "No Students",
                description: "No students found for this subject.",
                variant: "destructive",
            })
            return
        }

        // Check if date is in future
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        if (date > today) {
            toast({
                title: "Invalid Date",
                description: "Cannot mark attendance for future dates.",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            // Prepare records for ONLY the selected period (not all 5)
            const records = students.map(student => ({
                studentId: student.id,
                period: period, // Use the specific period passed as prop
                status: student.status,
            }))

            const result = await submitAttendance({
                subjectId,
                date: date.toISOString(),
                records,
            })

            if (result.success) {
                const presentCount = students.filter(s => s.status === "PRESENT").length
                toast({
                    title: "Attendance Marked",
                    description: `Successfully marked attendance. Present: ${presentCount}/${students.length}`,
                })
                onSubmitSuccess()
                onOpenChange(false)
            } else {
                toast({
                    title: "Submission Failed",
                    description: result.error || "Failed to submit attendance",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Submission Failed",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const presentCount = students.filter((s) => s.status === "PRESENT").length
    const absentCount = students.filter((s) => s.status === "ABSENT").length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl lg:max-h-[90vh] h-full lg:h-auto overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">Mark Attendance</DialogTitle>
                            <DialogDescription className="mt-1">
                                {subjectName} • {subjectCode}
                            </DialogDescription>
                        </div>
                        <Badge className="text-base">Period {period}</Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Loading students...</span>
                        </div>
                    ) : (
                        <>
                            {/* Date & Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Date</label>
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
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={(d) => d && setDate(d)}
                                                disabled={(d) => d > new Date()}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Room</label>
                                    <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted text-sm">
                                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{room || "TBA"}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Students</label>
                                    <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted text-sm">
                                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{students.length} students</span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg border border-border text-center">
                                    <div className="text-2xl font-bold text-accent">{presentCount}</div>
                                    <div className="text-xs text-muted-foreground">Present</div>
                                </div>
                                <div className="p-3 rounded-lg border border-border text-center">
                                    <div className="text-2xl font-bold text-destructive">{absentCount}</div>
                                    <div className="text-xs text-muted-foreground">Absent</div>
                                </div>
                            </div>

                            {/* Bulk Actions */}
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleMarkAllPresent} className="flex-1">
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Mark All Present
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleMarkAllAbsent} className="flex-1">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Mark All Absent
                                </Button>
                            </div>

                            {/* Student List */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted/50 px-4 py-2 border-b">
                                    <div className="grid grid-cols-12 gap-4 text-sm font-medium">
                                        <div className="col-span-3">Roll No</div>
                                        <div className="col-span-5">Student Name</div>
                                        <div className="col-span-4 text-center">Status</div>
                                    </div>
                                </div>
                                <div>
                                    {students.map((student) => (
                                        <div
                                            key={student.id}
                                            className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors items-center"
                                        >
                                            <div className="col-span-3 font-mono text-sm">{student.enrollmentNo}</div>
                                            <div className="col-span-5 text-sm">{student.name}</div>
                                            <div className="col-span-4 flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={student.status === "PRESENT" ? "default" : "outline"}
                                                    className={cn(
                                                        "h-8 px-3",
                                                        student.status === "PRESENT" && "bg-accent text-accent-foreground hover:bg-accent/90"
                                                    )}
                                                    onClick={() => handleStatusChange(student.id, "PRESENT")}
                                                >
                                                    Present
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={student.status === "ABSENT" ? "destructive" : "outline"}
                                                    className="h-8 px-3"
                                                    onClick={() => handleStatusChange(student.id, "ABSENT")}
                                                >
                                                    Absent
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {students.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No students found for this subject
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Submit Attendance
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
