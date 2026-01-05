"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"

export interface Course {
    code: string
    name: string
    department: string
    credits: number
    students: number
    faculty: string
    avgAttendance: number
    semester: string
    status: string
    courseType?: string
    maxStudents?: number
    schedule?: {
        days: string[]
        startTime: string
        endTime: string
        room: string
    }
}

interface AddCourseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddCourse: (course: Omit<Course, "students" | "avgAttendance" | "status">) => void
    existingCourses: Course[]
}

const DAYS_OF_WEEK = [
    { id: "mon", label: "Monday" },
    { id: "tue", label: "Tuesday" },
    { id: "wed", label: "Wednesday" },
    { id: "thu", label: "Thursday" },
    { id: "fri", label: "Friday" },
]

export function AddCourseModal({ open, onOpenChange, onAddCourse, existingCourses }: AddCourseModalProps) {
    // Basic Details
    const [courseName, setCourseName] = React.useState("")
    const [courseCode, setCourseCode] = React.useState("")
    const [department, setDepartment] = React.useState("")
    const [semester, setSemester] = React.useState("")
    const [credits, setCredits] = React.useState("")

    // Faculty & Enrollment
    const [faculty, setFaculty] = React.useState("")
    const [maxStudents, setMaxStudents] = React.useState("")
    const [courseType, setCourseType] = React.useState("")

    // Schedule
    const [selectedDays, setSelectedDays] = React.useState<string[]>([])
    const [startTime, setStartTime] = React.useState("")
    const [endTime, setEndTime] = React.useState("")
    const [room, setRoom] = React.useState("")

    // Validation errors
    const [codeError, setCodeError] = React.useState("")
    const [timeError, setTimeError] = React.useState("")

    const resetForm = () => {
        setCourseName("")
        setCourseCode("")
        setDepartment("")
        setSemester("")
        setCredits("")
        setFaculty("")
        setMaxStudents("")
        setCourseType("")
        setSelectedDays([])
        setStartTime("")
        setEndTime("")
        setRoom("")
        setCodeError("")
        setTimeError("")
    }

    // Validate course code uniqueness
    const validateCourseCode = (code: string) => {
        if (code && existingCourses.some(c => c.code.toLowerCase() === code.toLowerCase())) {
            setCodeError("Course code already exists")
            return false
        }
        setCodeError("")
        return true
    }

    // Validate time
    const validateTime = () => {
        if (startTime && endTime && startTime >= endTime) {
            setTimeError("End time must be after start time")
            return false
        }
        setTimeError("")
        return true
    }

    const handleDayToggle = (dayId: string) => {
        setSelectedDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        )
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validate required fields
        if (!courseName || !courseCode || !department || !semester || !credits || !faculty || !maxStudents || !courseType) {
            return
        }

        // Validate course code uniqueness
        if (!validateCourseCode(courseCode)) {
            return
        }

        // Validate time if both are provided
        if (startTime && endTime && !validateTime()) {
            return
        }

        const newCourse: Omit<Course, "students" | "avgAttendance" | "status"> = {
            code: courseCode.toUpperCase(),
            name: courseName,
            department,
            credits: parseInt(credits),
            faculty,
            semester,
            courseType,
            maxStudents: parseInt(maxStudents),
        }

        // Add schedule if any schedule fields are filled
        if (selectedDays.length > 0 || startTime || endTime || room) {
            newCourse.schedule = {
                days: selectedDays,
                startTime: startTime || "",
                endTime: endTime || "",
                room: room || "",
            }
        }

        onAddCourse(newCourse)
        resetForm()
        onOpenChange(false)
    }

    const isFormValid = courseName && courseCode && department && semester && credits && faculty && maxStudents && courseType && !codeError && !timeError

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Course</DialogTitle>
                    <DialogDescription>
                        Create a new course with all necessary details. Fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Basic Details</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="courseName">
                                    Course Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="courseName"
                                    placeholder="e.g., Data Structures & Algorithms"
                                    value={courseName}
                                    onChange={(e) => setCourseName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="courseCode">
                                    Course Code <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="courseCode"
                                    placeholder="e.g., CS101"
                                    value={courseCode}
                                    onChange={(e) => {
                                        const value = e.target.value.toUpperCase()
                                        setCourseCode(value)
                                        validateCourseCode(value)
                                    }}
                                    required
                                />
                                {codeError && <p className="text-xs text-destructive">{codeError}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="department">
                                    Department <span className="text-destructive">*</span>
                                </Label>
                                <Select value={department} onValueChange={setDepartment} required>
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                                        <SelectItem value="Physics">Physics</SelectItem>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="Mechanical Eng.">Mechanical Eng.</SelectItem>
                                        <SelectItem value="Electrical Eng.">Electrical Eng.</SelectItem>
                                        <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                                        <SelectItem value="Business Administration">Business Administration</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="semester">
                                    Semester <span className="text-destructive">*</span>
                                </Label>
                                <Select value={semester} onValueChange={setSemester} required>
                                    <SelectTrigger id="semester">
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                                        <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                                        <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                                        <SelectItem value="Winter 2025">Winter 2025</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="credits">
                                Credits <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="credits"
                                type="number"
                                min="1"
                                max="6"
                                placeholder="1-6"
                                value={credits}
                                onChange={(e) => setCredits(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Faculty & Enrollment */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Faculty & Enrollment</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="faculty">
                                    Faculty Assigned <span className="text-destructive">*</span>
                                </Label>
                                <Select value={faculty} onValueChange={setFaculty} required>
                                    <SelectTrigger id="faculty">
                                        <SelectValue placeholder="Select faculty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dr. Sarah Wilson">Dr. Sarah Wilson</SelectItem>
                                        <SelectItem value="Prof. Chen">Prof. Chen</SelectItem>
                                        <SelectItem value="Prof. Johnson">Prof. Johnson</SelectItem>
                                        <SelectItem value="Prof. Adams">Prof. Adams</SelectItem>
                                        <SelectItem value="Dr. Williams">Dr. Williams</SelectItem>
                                        <SelectItem value="Ms. Davis">Ms. Davis</SelectItem>
                                        <SelectItem value="Dr. Smith">Dr. Smith</SelectItem>
                                        <SelectItem value="Prof. Kumar">Prof. Kumar</SelectItem>
                                        <SelectItem value="Dr. Robert Chen">Dr. Robert Chen</SelectItem>
                                        <SelectItem value="Prof. Maria Santos">Prof. Maria Santos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxStudents">
                                    Maximum Students <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="maxStudents"
                                    type="number"
                                    min="1"
                                    placeholder="e.g., 100"
                                    value={maxStudents}
                                    onChange={(e) => setMaxStudents(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="courseType">
                                Course Type <span className="text-destructive">*</span>
                            </Label>
                            <Select value={courseType} onValueChange={setCourseType} required>
                                <SelectTrigger id="courseType">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Core">Core</SelectItem>
                                    <SelectItem value="Elective">Elective</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Schedule (Optional) */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Schedule (Optional)</h3>

                        <div className="space-y-2">
                            <Label>Days</Label>
                            <div className="flex flex-wrap gap-4">
                                {DAYS_OF_WEEK.map((day) => (
                                    <div key={day.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={day.id}
                                            checked={selectedDays.includes(day.id)}
                                            onCheckedChange={() => handleDayToggle(day.id)}
                                        />
                                        <label
                                            htmlFor={day.id}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {day.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => {
                                        setStartTime(e.target.value)
                                        if (endTime) validateTime()
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => {
                                        setEndTime(e.target.value)
                                        if (startTime) validateTime()
                                    }}
                                />
                            </div>
                        </div>
                        {timeError && <p className="text-xs text-destructive">{timeError}</p>}

                        <div className="space-y-2">
                            <Label htmlFor="room">Room / Lab Name</Label>
                            <Input
                                id="room"
                                placeholder="e.g., Room 301, Lab A"
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                            />
                        </div>
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
                            Save Course
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
