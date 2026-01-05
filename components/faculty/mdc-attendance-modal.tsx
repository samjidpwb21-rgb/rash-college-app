"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Student {
    id: string
    name: string
    department: string
    status: "present" | "absent" | null
}

interface MDCAttendanceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subjectId: string
    subjectName: string
    totalStudents: number
    onSubmitSuccess?: () => void
}

// Mock student data generator
const generateMockStudents = (count: number): Student[] => {
    const departments = ["CS", "IT", "Design", "MBA", "Commerce", "Maths"]
    const firstNames = ["John", "Jane", "Bob", "Alice", "Charlie", "Diana", "Eva", "Frank", "Grace", "Henry"]
    const lastNames = ["Doe", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez"]

    return Array.from({ length: count }, (_, i) => ({
        id: `ST${String(i + 1).padStart(3, "0")}`,
        name: `${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}`,
        department: departments[i % departments.length],
        status: null,
    }))
}

export function MDCAttendanceModal({
    open,
    onOpenChange,
    subjectId,
    subjectName,
    totalStudents,
    onSubmitSuccess,
}: MDCAttendanceModalProps) {
    const [students, setStudents] = useState<Student[]>(() => generateMockStudents(totalStudents))
    const [searchQuery, setSearchQuery] = useState("")
    const [selectAll, setSelectAll] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Filtered students based on search
    const filteredStudents = useMemo(() => {
        return students.filter(
            (student) =>
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [students, searchQuery])

    const presentCount = students.filter((s) => s.status === "present").length
    const absentCount = students.filter((s) => s.status === "absent").length
    const unmarkedCount = totalStudents - presentCount - absentCount

    // Mark individual student
    const markStudent = (studentId: string, status: "present" | "absent") => {
        setStudents((prev) =>
            prev.map((student) => (student.id === studentId ? { ...student, status } : student))
        )
    }

    // Bulk mark all students
    const bulkMarkAll = (status: "present" | "absent") => {
        setStudents((prev) => prev.map((student) => ({ ...student, status })))
        setSelectAll(false)
    }

    // Handle select all checkbox
    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked)
    }

    // Handle final submission
    const handleSubmit = () => {
        if (unmarkedCount > 0) {
            return
        }
        setShowConfirmation(true)
    }

    // Confirm and submit
    const handleConfirmSubmit = async () => {
        setIsSubmitting(true)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Success
        setIsSubmitting(false)
        setShowConfirmation(false)
        onOpenChange(false)

        // Reset state
        setStudents(generateMockStudents(totalStudents))
        setSearchQuery("")
        setSelectAll(false)

        if (onSubmitSuccess) {
            onSubmitSuccess()
        }
    }

    // Reset when modal closes
    const handleClose = (open: boolean) => {
        if (!open) {
            setStudents(generateMockStudents(totalStudents))
            setSearchQuery("")
            setSelectAll(false)
        }
        onOpenChange(open)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {subjectName} - {subjectId}
                        </DialogTitle>
                        <DialogDescription>{totalStudents} students enrolled (cross-department)</DialogDescription>
                    </DialogHeader>

                    {/* Sticky Search and Controls */}
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or student ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Bulk Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} id="select-all" />
                                <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                                    Select All
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => bulkMarkAll("present")}
                                    className="bg-accent/10 text-accent hover:bg-accent/20 border-accent/50"
                                >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Bulk Present
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => bulkMarkAll("absent")}
                                    className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/50"
                                >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Bulk Absent
                                </Button>
                            </div>
                        </div>

                        {/* Count Summary */}
                        <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-muted-foreground">
                                Present: <span className="font-semibold text-accent">{presentCount}</span>
                            </span>
                            <span className="text-muted-foreground">
                                Absent: <span className="font-semibold text-destructive">{absentCount}</span>
                            </span>
                            <span className="text-muted-foreground">
                                Unmarked: <span className="font-semibold">{unmarkedCount}</span>
                            </span>
                        </div>

                        {/* Warning if unmarked */}
                        {unmarkedCount > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/50 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-warning" />
                                <p className="text-sm text-warning">
                                    {unmarkedCount} student{unmarkedCount > 1 ? "s" : ""} not marked yet
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Student List */}
                    <ScrollArea className="flex-1 h-[400px]">
                        <div className="space-y-2 pr-4">
                            {filteredStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${student.status === "present"
                                            ? "bg-accent/10 border-accent/50"
                                            : student.status === "absent"
                                                ? "bg-destructive/10 border-destructive/50"
                                                : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <Checkbox checked={selectAll} />
                                        <div>
                                            <p className="font-semibold text-foreground">{student.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground">{student.id}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {student.department}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Toggle Buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant={student.status === "present" ? "default" : "outline"}
                                            onClick={() => markStudent(student.id, "present")}
                                            className={
                                                student.status === "present"
                                                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                                                    : ""
                                            }
                                        >
                                            <CheckCircle className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Present</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={student.status === "absent" ? "destructive" : "outline"}
                                            onClick={() => markStudent(student.id, "absent")}
                                        >
                                            <XCircle className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Absent</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {filteredStudents.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No students found matching "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => handleClose(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={unmarkedCount > 0}>
                            Submit Attendance ({presentCount + absentCount}/{totalStudents})
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Attendance Submission</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>You are marking attendance for:</p>
                            <div className="bg-muted p-4 rounded-lg space-y-1 text-foreground">
                                <p>
                                    <strong>Subject:</strong> {subjectName} ({subjectId})
                                </p>
                                <p>
                                    <strong>Date:</strong> {new Date().toLocaleDateString()}
                                </p>
                                <p>
                                    <strong>Time:</strong> {new Date().toLocaleTimeString()}
                                </p>
                                <p>
                                    <strong>Total Students:</strong> {totalStudents}
                                </p>
                                <p className="text-accent">
                                    <strong>Present:</strong> {presentCount}
                                </p>
                                <p className="text-destructive">
                                    <strong>Absent:</strong> {absentCount}
                                </p>
                            </div>
                            <p className="text-sm text-warning">This action cannot be undone.</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Confirm Submission"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
