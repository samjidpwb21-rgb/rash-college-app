"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Plus } from "lucide-react"

interface ClassData {
    courseCode: string
    courseName: string
    classType: "Lecture" | "Lab" | "Tutorial"
    section: string
    day: string
    startTime: string
    endTime: string
    room: string
    students: number
    department?: string
    notes?: string
}

interface ExistingClass {
    time: string
    course: string
    section: string
    room: string
    students: number
    type: string
}

interface AddClassModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddClass: (classData: ClassData) => void
    existingSchedule: Record<string, ExistingClass[]>
}

export function AddClassModal({ open, onOpenChange, onAddClass, existingSchedule }: AddClassModalProps) {
    const [courseCode, setCourseCode] = React.useState("")
    const [courseName, setCourseName] = React.useState("")
    const [classType, setClassType] = React.useState<"Lecture" | "Lab" | "Tutorial">("Lecture")
    const [section, setSection] = React.useState("")
    const [day, setDay] = React.useState("")
    const [startTime, setStartTime] = React.useState("")
    const [endTime, setEndTime] = React.useState("")
    const [room, setRoom] = React.useState("")
    const [students, setStudents] = React.useState("")
    const [department, setDepartment] = React.useState("")
    const [notes, setNotes] = React.useState("")
    const [errors, setErrors] = React.useState<Record<string, string>>({})

    const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    const sections = ["CS-A", "CS-B", "CS-C", "EE-A", "EE-B", "ME-A", "ME-B"]
    const departments = ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"]

    const resetForm = () => {
        setCourseCode("")
        setCourseName("")
        setClassType("Lecture")
        setSection("")
        setDay("")
        setStartTime("")
        setEndTime("")
        setRoom("")
        setStudents("")
        setDepartment("")
        setNotes("")
        setErrors({})
    }

    // Time conflict detection
    const checkTimeConflict = (selectedDay: string, start: string, end: string): boolean => {
        if (!selectedDay || !start || !end) return false

        const daySchedule = existingSchedule[selectedDay] || []

        const parseTimeToMinutes = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number)
            return hours * 60 + minutes
        }

        const newStart = parseTimeToMinutes(start)
        const newEnd = parseTimeToMinutes(end)

        return daySchedule.some(cls => {
            const [existingStart, existingEnd] = cls.time.split(' - ')
            const existStart = parseTimeToMinutes(existingStart)
            const existEnd = parseTimeToMinutes(existingEnd)

            // Check if times overlap
            return (newStart < existEnd && newEnd > existStart)
        })
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!courseCode.trim()) newErrors.courseCode = "Course code is required"
        if (!courseName.trim()) newErrors.courseName = "Course name is required"
        if (!section) newErrors.section = "Section is required"
        if (!day) newErrors.day = "Day is required"
        if (!startTime) newErrors.startTime = "Start time is required"
        if (!endTime) newErrors.endTime = "End time is required"
        if (!room.trim()) newErrors.room = "Room/Lab is required"
        if (!students || parseInt(students) <= 0) newErrors.students = "Valid student count is required"

        // Time validation
        if (startTime && endTime) {
            const start = new Date(`2000-01-01 ${startTime}`)
            const end = new Date(`2000-01-01 ${endTime}`)
            if (start >= end) {
                newErrors.endTime = "End time must be after start time"
            }
        }

        // Conflict check
        if (day && startTime && endTime && !newErrors.startTime && !newErrors.endTime) {
            if (checkTimeConflict(day, startTime, endTime)) {
                newErrors.day = "Time conflict with existing class on this day"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const newClass: ClassData = {
            courseCode: courseCode.toUpperCase(),
            courseName,
            classType,
            section,
            day,
            startTime,
            endTime,
            room,
            students: parseInt(students),
            department: department || undefined,
            notes: notes || undefined,
        }

        onAddClass(newClass)
        resetForm()
        onOpenChange(false)
    }

    const isFormValid = courseCode && courseName && section && day &&
        startTime && endTime && room && students &&
        parseInt(students) > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Class</DialogTitle>
                    <DialogDescription>
                        Schedule a new class. All fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Course Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="courseCode">
                                Course Code <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="courseCode"
                                placeholder="e.g., CS101"
                                value={courseCode}
                                onChange={(e) => setCourseCode(e.target.value)}
                                required
                            />
                            {errors.courseCode && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.courseCode}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="courseName">
                                Course Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="courseName"
                                placeholder="e.g., Data Structures"
                                value={courseName}
                                onChange={(e) => setCourseName(e.target.value)}
                                required
                            />
                            {errors.courseName && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.courseName}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Class Type and Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="classType">
                                Class Type <span className="text-destructive">*</span>
                            </Label>
                            <Select value={classType} onValueChange={(value) => setClassType(value as any)}>
                                <SelectTrigger id="classType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Lecture">Lecture</SelectItem>
                                    <SelectItem value="Lab">Lab</SelectItem>
                                    <SelectItem value="Tutorial">Tutorial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="section">
                                Section <span className="text-destructive">*</span>
                            </Label>
                            <Select value={section} onValueChange={setSection}>
                                <SelectTrigger id="section">
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(sec => (
                                        <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.section && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.section}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Day and Time */}
                    <div className="space-y-2">
                        <Label htmlFor="day">
                            Day of Week <span className="text-destructive">*</span>
                        </Label>
                        <Select value={day} onValueChange={setDay}>
                            <SelectTrigger id="day">
                                <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                                {weekDays.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.day && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.day}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">
                                Start Time <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                            {errors.startTime && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.startTime}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endTime">
                                End Time <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="endTime"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                            {errors.endTime && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.endTime}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Room and Students */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="room">
                                Room / Lab Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="room"
                                placeholder="e.g., Room 101, Lab 3"
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                required
                            />
                            {errors.room && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.room}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="students">
                                Number of Students <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="students"
                                type="number"
                                min="1"
                                placeholder="e.g., 45"
                                value={students}
                                onChange={(e) => setStudents(e.target.value)}
                                required
                            />
                            {errors.students && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.students}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Department (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="department">Department (optional)</Label>
                        <Select value={department} onValueChange={setDepartment}>
                            <SelectTrigger id="department">
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any additional information..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                resetForm()
                                onOpenChange(false)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isFormValid}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Class
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
