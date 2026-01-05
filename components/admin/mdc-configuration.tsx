"use client"

// ============================================================================
// CAMPUSTRACK - MDC CONFIGURATION COMPONENT
// ============================================================================
// Year/Semester tabs interface for configuring MDC courses

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    faculty,
}: MDCConfigurationProps) {
    const router = useRouter()
    const [selectedYear, setSelectedYear] = useState(1)
    const [selectedSemester, setSelectedSemester] = useState(1)
    const [courseName, setCourseName] = useState("")
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
    const [selectedFaculty, setSelectedFaculty] = useState<string>("NONE")
    const [isSaving, setIsSaving] = useState(false)

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
            setCourseName(course.courseName)
            setSelectedStudents(new Set(course.studentIds))
            setSelectedFaculty(course.facultyId || "NONE")
        } else {
            setCourseName("")
            setSelectedStudents(new Set())
            setSelectedFaculty("NONE")
        }
    }, [selectedYear, selectedSemester, existingCourses])

    // Filter students by selected year
    const filteredStudents = students.filter(
        (s) => s.semester.academicYear.year === selectedYear
    )

    // Toggle student selection
    const toggleStudent = (studentId: string) => {
        const newSelection = new Set(selectedStudents)
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId)
        } else {
            newSelection.add(studentId)
        }
        setSelectedStudents(newSelection)
    }

    // Select/Deselect all students in current year
    const toggleAllStudents = () => {
        if (selectedStudents.size === filteredStudents.length) {
            setSelectedStudents(new Set())
        } else {
            setSelectedStudents(new Set(filteredStudents.map((s) => s.id)))
        }
    }

    // Save MDC course
    const handleSave = async () => {
        if (!courseName.trim()) {
            toast.error("Please enter a course name")
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
                courseName: courseName.trim(),
                studentIds: Array.from(selectedStudents),
                facultyId: selectedFaculty === "NONE" ? null : selectedFaculty || null,
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
                            Configure MDC courses for each academic year (1-4) and semester (1-2).
                            Each combination can have one MDC course with a custom student list.
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
                        setSelectedYear(Number(v))
                    }}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="1">Year 1</TabsTrigger>
                            <TabsTrigger value="2">Year 2</TabsTrigger>
                            <TabsTrigger value="3">Year 3</TabsTrigger>
                            <TabsTrigger value="4">Year 4</TabsTrigger>
                        </TabsList>

                        {[1, 2, 3, 4].map((year) => (
                            <TabsContent key={year} value={String(year)} className="space-y-4 mt-4">
                                {/* Semester Tabs */}
                                <Tabs value={String(selectedSemester)} onValueChange={(v) => {
                                    setSelectedSemester(Number(v))
                                }}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="1">Semester 1</TabsTrigger>
                                        <TabsTrigger value="2">Semester 2</TabsTrigger>
                                    </TabsList>

                                    {[1, 2].map((sem) => (
                                        <TabsContent key={sem} value={String(sem)} className="space-y-6 mt-6">
                                            {/* Course Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="courseName">Course Name</Label>
                                                <Input
                                                    id="courseName"
                                                    placeholder="e.g., Advanced Mathematics for Engineers"
                                                    value={courseName}
                                                    onChange={(e) => setCourseName(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="faculty">Assign Faculty (Optional)</Label>
                                                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                                                    <SelectTrigger id="faculty">
                                                        <SelectValue placeholder="Select faculty member" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NONE">None</SelectItem>
                                                        {faculty.map((f) => (
                                                            <SelectItem key={f.id} value={f.id}>
                                                                {f.user.name} ({f.designation})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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
                                                                {filteredStudents.map((student) => (
                                                                    <div
                                                                        key={student.id}
                                                                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                                                                    >
                                                                        <Checkbox
                                                                            id={student.id}
                                                                            checked={selectedStudents.has(student.id)}
                                                                            onCheckedChange={() => toggleStudent(student.id)}
                                                                        />
                                                                        <label
                                                                            htmlFor={student.id}
                                                                            className="flex-1 cursor-pointer"
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div>
                                                                                    <p className="font-medium text-foreground">
                                                                                        {student.user.name}
                                                                                    </p>
                                                                                    <p className="text-sm text-muted-foreground">
                                                                                        {student.enrollmentNo} • Semester {student.semester.number}
                                                                                    </p>
                                                                                </div>
                                                                                <Badge variant="outline">
                                                                                    Year {student.semester.academicYear.year}
                                                                                </Badge>
                                                                            </div>
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                                <p>No students found for Year {year}</p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Save Button */}
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={isSaving || !courseName.trim() || selectedStudents.size === 0}
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
            </Card>
        </main>
    )
}
