"use client"

// ============================================================================
// CAMPUSTRACK - MDC CONFIGURATION COMPONENT
// ============================================================================
// Year/Semester tabs interface for configuring MDC courses

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Users, GraduationCap, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { createOrUpdateMDCCourse } from "@/actions/admin/mdc"

interface MDCConfigurationProps {
    homeDepartment: {
        id: string
        name: string
        code: string
    }
    mdcDepartment: {
        id: string
        name: string
        code: string
    }
    students: Array<{
        id: string
        enrollmentNo: string
        user: {
            name: string
            email: string
        }
        semester: {
            number: number
            academicYear: {
                year: number
            }
        }
    }>
    existingCourses: Array<{
        id: string
        courseName: string
        year: number
        semester: number
        studentIds: string[]
        facultyId: string | null
    }>
    availableMDCSubjects: Array<{
        id: string
        code: string
        name: string
        credits: number
        type: string
        description: string | null
        semester: {
            id: string
            number: number
            academicYear: {
                year: number
            }
        }
    }>
    allMDCAssignments: Array<{
        id: string
        studentIds: string[]
        semester: number
        courseName: string
    }>
    faculty: Array<{
        id: string
        employeeId: string
        designation: string
        user: {
            name: string
        }
    }>
}

export function MDCConfiguration({
    homeDepartment,
    mdcDepartment,
    students,
    existingCourses,
    allMDCAssignments,
    availableMDCSubjects,
    faculty,
}: MDCConfigurationProps) {
    const router = useRouter()
    const [selectedYear, setSelectedYear] = useState(1)
    // Global semester number (1-8) based on year: Year 1 → 1,2; Year 2 → 3,4; etc.
    const [selectedSemester, setSelectedSemester] = useState(1)
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
    const [selectedFaculty, setSelectedFaculty] = useState<string>("NONE")
    const [isSaving, setIsSaving] = useState(false)

    // Calculate global semester numbers for current year
    const getSemestersForYear = (year: number) => {
        const firstSem = (year - 1) * 2 + 1
        return [firstSem, firstSem + 1]
    }

    // Get existing course for current year/semester
    const existingCourse = existingCourses.find(
        (c) => c.year === selectedYear && c.semester === selectedSemester
    )

    // Load existing course data when year/semester changes
    useEffect(() => {
        const course = existingCourses.find(
            (c) => c.year === selectedYear && c.semester === selectedSemester
        )
        if (course) {
            // Try to find matching MDC subject by name
            const matchingSubject = availableMDCSubjects.find((s) => {
                return s.name === course.courseName &&
                    s.semester.academicYear.year === selectedYear &&
                    s.semester.number === selectedSemester
            })
            setSelectedCourseId(matchingSubject?.id || null)
            setSelectedStudents(new Set(course.studentIds))
            setSelectedFaculty(course.facultyId || "NONE")
        } else {
            setSelectedCourseId(null)
            setSelectedStudents(new Set())
            setSelectedFaculty("NONE")
        }
    }, [selectedYear, selectedSemester, existingCourses, availableMDCSubjects])

    // Filter students by selected semester (strict - only exact semester match)
    const filteredStudents = students.filter(
        (s) => s.semester.number === selectedSemester
    )

    // Filter available MDC subjects by selected year and global semester
    // semester.number is already global (1-8), so direct comparison works
    const filteredMDCSubjects = availableMDCSubjects.filter((s) => {
        return s.semester.academicYear.year === selectedYear &&
            s.semester.number === selectedSemester
    })

    // Check if student is already assigned to another MDC in the same semester
    // Returns the course name if assigned, null otherwise
    const getExistingMDCAssignment = (studentId: string): string | null => {
        // Skip the current course configuration (if editing)
        const currentCourseId = existingCourse?.id

        for (const assignment of allMDCAssignments) {
            // Skip if it's the current course being edited
            if (assignment.id === currentCourseId) continue
            // Check if same semester and student is in the list
            if (assignment.semester === selectedSemester &&
                assignment.studentIds.includes(studentId)) {
                return assignment.courseName
            }
        }
        return null
    }

    // Toggle student selection
    const toggleStudent = (studentId: string) => {
        // Don't allow toggling if already assigned
        if (getExistingMDCAssignment(studentId)) return

        const newSelection = new Set(selectedStudents)
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId)
        } else {
            newSelection.add(studentId)
        }
        setSelectedStudents(newSelection)
    }

    // Select all ELIGIBLE students (not already assigned)
    const toggleAllStudents = () => {
        const eligibleStudents = filteredStudents.filter(
            (s) => !getExistingMDCAssignment(s.id)
        )
        const allSelected = eligibleStudents.every(s => selectedStudents.has(s.id))

        if (allSelected) {
            // Deselect all eligible students
            const newSelection = new Set(selectedStudents)
            eligibleStudents.forEach(s => newSelection.delete(s.id))
            setSelectedStudents(newSelection)
        } else {
            // Select all eligible students
            const newSelection = new Set(selectedStudents)
            eligibleStudents.forEach(s => newSelection.add(s.id))
            setSelectedStudents(newSelection)
        }
    }

    // Get selected course object
    const selectedCourse = availableMDCSubjects.find((s) => s.id === selectedCourseId)

    // Save MDC course
    const handleSave = async () => {
        if (!selectedCourse) {
            toast.error("Please select an MDC course")
            return
        }

        if (selectedStudents.size === 0) {
            toast.error("Please select at least one student")
            return
        }

        setIsSaving(true)
        try {
            const result = await createOrUpdateMDCCourse({
                homeDepartmentId: homeDepartment.id,
                mdcDepartmentId: mdcDepartment.id,
                year: selectedYear,
                semester: selectedSemester,
                courseName: selectedCourse.name,
                studentIds: Array.from(selectedStudents),
                facultyId: existingCourse?.facultyId || null,  // Preserve timetable-assigned faculty
            })

            if (result.success) {
                toast.success("MDC course saved successfully!")
                router.refresh()
            } else {
                toast.error(result.error || "Failed to save MDC course")
            }
        } catch (error) {
            console.error("Error saving MDC course:", error)
            toast.error("An error occurred while saving")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <main className="p-6 space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.push(`/dashboard/admin/departments/${homeDepartment.id}/mdc`)}
                className="mb-2"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Department Selection
            </Button>

            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl">MDC Course Configuration</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Configure <strong>{mdcDepartment.name}</strong> MDC courses for{" "}
                                <strong>{homeDepartment.name}</strong> students
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline">{homeDepartment.code} → {mdcDepartment.code}</Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Info Banner */}
            <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                            Select an MDC course for each academic year (1-4) and semester (1-2).
                            Assign faculty and students from {homeDepartment.name} to configure the MDC enrollment.
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Year Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Year and Semester</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={String(selectedYear)} onValueChange={(v) => {
                        const newYear = Number(v)
                        setSelectedYear(newYear)
                        // Reset to first semester of the new year
                        setSelectedSemester((newYear - 1) * 2 + 1)
                    }}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="1">Year 1</TabsTrigger>
                            <TabsTrigger value="2">Year 2</TabsTrigger>
                            <TabsTrigger value="3">Year 3</TabsTrigger>
                            <TabsTrigger value="4">Year 4</TabsTrigger>
                        </TabsList>

                        {[1, 2, 3, 4].map((year) => (
                            <TabsContent key={year} value={String(year)} className="space-y-4 mt-4">
                                {/* Semester Tabs - Global semester numbers */}
                                <Tabs value={String(selectedSemester)} onValueChange={(v) => {
                                    setSelectedSemester(Number(v))
                                }}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        {getSemestersForYear(year).map((sem) => (
                                            <TabsTrigger key={sem} value={String(sem)}>Semester {sem}</TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {getSemestersForYear(year).map((sem) => (
                                        <TabsContent key={sem} value={String(sem)} className="space-y-6 mt-6">
                                            {/* MDC Course Selection */}
                                            <div className="space-y-2">
                                                <Label>Select MDC Course from {mdcDepartment.name}</Label>
                                                {filteredMDCSubjects.length > 0 ? (
                                                    <div className="grid gap-3">
                                                        {filteredMDCSubjects.map((subject) => (
                                                            <Card
                                                                key={subject.id}
                                                                className={`cursor-pointer transition-all hover:border-primary/50 ${selectedCourseId === subject.id
                                                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                                    : "hover:bg-accent/50"
                                                                    }`}
                                                                onClick={() => setSelectedCourseId(subject.id)}
                                                            >
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-start gap-4">
                                                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedCourseId === subject.id
                                                                            ? "bg-primary text-primary-foreground"
                                                                            : "bg-primary/10"
                                                                            }`}>
                                                                            <GraduationCap className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="font-semibold">{subject.name}</h4>
                                                                                {selectedCourseId === subject.id && (
                                                                                    <Badge className="bg-green-500/10 text-green-500">Selected</Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <Badge variant="outline" className="text-xs">{subject.code}</Badge>
                                                                                <Badge variant="secondary" className="text-xs">{subject.type}</Badge>
                                                                                <span className="text-xs text-muted-foreground">{subject.credits} credits</span>
                                                                            </div>
                                                                            {subject.description && (
                                                                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                                                    {subject.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <Card className="border-dashed">
                                                        <CardContent className="py-8">
                                                            <div className="text-center text-muted-foreground">
                                                                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                                                <p className="font-medium">No MDC courses available</p>
                                                                <p className="text-sm mt-1">
                                                                    {mdcDepartment.name} has no MDC courses for Year {selectedYear}, Semester {selectedSemester}
                                                                </p>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </div>

                                            {/* Faculty Assignment - Read Only (Set via Timetable) */}
                                            <div className="space-y-2">
                                                <Label>Assigned Faculty</Label>
                                                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                                                    {existingCourse?.facultyId ? (
                                                        <>
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <Users className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {faculty.find(f => f.id === existingCourse.facultyId)?.user.name || "Unknown Faculty"}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Assigned via Timetable
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Users className="h-4 w-4" />
                                                            <span className="text-sm">Not assigned yet — Assign via Timetable</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Student Selection */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label>Select Students</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary">
                                                            <Users className="h-3 w-3 mr-1" />
                                                            {selectedStudents.size} selected
                                                        </Badge>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={toggleAllStudents}
                                                        >
                                                            {selectedStudents.size === filteredStudents.length
                                                                ? "Deselect All"
                                                                : "Select All"}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <Card>
                                                    <CardContent className="pt-6">
                                                        {filteredStudents.length > 0 ? (
                                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                                {filteredStudents.map((student) => {
                                                                    const existingAssignment = getExistingMDCAssignment(student.id)
                                                                    const isDisabled = !!existingAssignment

                                                                    return (
                                                                        <div
                                                                            key={student.id}
                                                                            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${isDisabled
                                                                                ? "opacity-50 cursor-not-allowed bg-muted/30"
                                                                                : "hover:bg-accent/50"
                                                                                }`}
                                                                        >
                                                                            <Checkbox
                                                                                id={student.id}
                                                                                checked={selectedStudents.has(student.id)}
                                                                                onCheckedChange={() => toggleStudent(student.id)}
                                                                                disabled={isDisabled}
                                                                            />
                                                                            <label
                                                                                htmlFor={student.id}
                                                                                className={`flex-1 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                                                                            >
                                                                                <div className="flex items-center justify-between">
                                                                                    <div>
                                                                                        <p className="font-medium text-foreground">
                                                                                            {student.user.name}
                                                                                        </p>
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                            {student.enrollmentNo} • Semester {student.semester.number}
                                                                                        </p>
                                                                                        {isDisabled && (
                                                                                            <p className="text-xs text-amber-500 mt-1">
                                                                                                Already assigned to: {existingAssignment}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                    <Badge variant="outline">
                                                                                        Year {student.semester.academicYear.year}
                                                                                    </Badge>
                                                                                </div>
                                                                            </label>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                                <p>No students found for Semester {selectedSemester}</p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Save Button */}
                                            < div className="flex justify-end" >
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={isSaving || !selectedCourseId || selectedStudents.size === 0}
                                                    size="lg"
                                                >
                                                    <Save className="h-4 w-4 mr-2" />
                                                    {isSaving ? "Saving..." : existingCourse ? "Update Course" : "Save Course"}
                                                </Button>
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card >
        </main >
    )
}
