"use client"

/**
 * Semester Management Client Component
 * 
 * Admin UI for managing semester progressions with preview and bulk operations.
 */

import { useState } from "react"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { progressStudents, type ProgressionResult } from "@/actions/admin/semester-progression"
import { ArrowRight, Users, GraduationCap, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Props {
    semesters: Array<{
        id: string
        number: number
        name: string
        academicYear: {
            year: number
            name: string
        }
    }>
    departments: Array<{
        id: string
        name: string
        code: string
    }>
    initialStats: {
        semesterDistribution: Array<{
            semester: string
            count: number
            semesterNumber: number
        }>
        pendingGraduations: number
    }
}

export default function SemesterManagementClient({ semesters, departments, initialStats }: Props) {
    const { toast } = useToast()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // State
    const [selectedSemesters, setSelectedSemesters] = useState<string[]>([])
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
    const [isLoading, setIsLoading] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [previewData, setPreviewData] = useState<ProgressionResult | null>(null)
    const [showConfirmation, setShowConfirmation] = useState(false)

    const user = {
        name: "Admin User",
        email: "admin@university.edu",
        role: "System Administrator",
    }

    // Handle semester selection toggle
    const toggleSemester = (semesterId: string) => {
        setSelectedSemesters(prev =>
            prev.includes(semesterId)
                ? prev.filter(id => id !== semesterId)
                : [...prev, semesterId]
        )
    }

    // Handle dry-run preview
    const handlePreview = async () => {
        if (selectedSemesters.length === 0) {
            toast({
                title: "No semesters selected",
                description: "Please select at least one semester to progress from.",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)
        try {
            const result = await progressStudents(
                {
                    currentSemesterIds: selectedSemesters,
                    departmentId: selectedDepartment === "all" ? undefined : selectedDepartment,
                },
                true // dry-run mode
            )

            if (result.success && result.data) {
                setPreviewData(result.data)
                setShowPreview(true)
            } else {
                toast({
                    title: "Preview failed",
                    description: result.error || "Failed to generate preview",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to generate progression preview",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Handle actual execution
    const handleExecute = async () => {
        if (!previewData) return

        setIsLoading(true)
        setShowPreview(false)
        setShowConfirmation(false)

        try {
            const result = await progressStudents(
                {
                    currentSemesterIds: selectedSemesters,
                    departmentId: selectedDepartment === "all" ? undefined : selectedDepartment,
                },
                false // execute mode
            )

            if (result.success && result.data) {
                toast({
                    title: "Progression complete!",
                    description: `Successfully progressed ${result.data.progressed} students. ${result.data.graduating} students graduated.`,
                })

                // Reset state
                setSelectedSemesters([])
                setSelectedDepartment("all")
                setPreviewData(null)

                // Refresh page to show updated stats
                window.location.reload()
            } else {
                toast({
                    title: "Progression failed",
                    description: result.error || "Failed to progress students",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to execute progression",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />
            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />

            <div className="lg:ml-64">
                <DashboardHeader title="Semester Management" user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-white">Semester Management</h1>
                        <p className="text-slate-300 mt-2">
                            Manage student semester progressions and batch transitions
                        </p>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {initialStats.semesterDistribution.reduce((sum, s) => sum + s.count, 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">Across all semesters</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Graduations</CardTitle>
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{initialStats.pendingGraduations}</div>
                                <p className="text-xs text-muted-foreground">Students in Semester 8</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Semesters</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {initialStats.semesterDistribution.filter(s => s.count > 0).length}
                                </div>
                                <p className="text-xs text-muted-foreground">With enrolled students</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Semester Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Semester Distribution</CardTitle>
                            <CardDescription>Current student enrollment across semesters</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {initialStats.semesterDistribution.map((item) => (
                                    <div key={item.semester} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{item.semester}</span>
                                            <Badge variant="outline">{item.count} students</Badge>
                                        </div>
                                        <div className="w-48 bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full"
                                                style={{
                                                    width: `${(item.count / Math.max(...initialStats.semesterDistribution.map(s => s.count), 1)) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progression Controls */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Semester Progression</CardTitle>
                            <CardDescription>
                                Select semesters to progress and preview affected students before executing
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Department Filter */}
                            <div className="space-y-2">
                                <Label>Department Filter (Optional)</Label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name} ({dept.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Semester Selection */}
                            <div className="space-y-2">
                                <Label>Select Semesters to Progress</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {semesters.filter(s => s.number < 8).map((semester) => {
                                        const studentCount = initialStats.semesterDistribution.find(
                                            d => d.semesterNumber === semester.number
                                        )?.count || 0

                                        return (
                                            <div
                                                key={semester.id}
                                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedSemesters.includes(semester.id)
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                                    }`}
                                                onClick={() => toggleSemester(semester.id)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium">{semester.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {semester.academicYear.name}
                                                        </div>
                                                        <div className="text-sm mt-1">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {studentCount} students
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Checkbox
                                                        checked={selectedSemesters.includes(semester.id)}
                                                        onCheckedChange={() => toggleSemester(semester.id)}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={handlePreview}
                                    disabled={selectedSemesters.length === 0 || isLoading}
                                    className="gap-2"
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    Preview Progression
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedSemesters([])
                                        setSelectedDepartment("all")
                                    }}
                                    disabled={isLoading}
                                >
                                    Clear Selection
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Dialog */}
                    <Dialog open={showPreview} onOpenChange={setShowPreview}>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Progression Preview</DialogTitle>
                                <DialogDescription>
                                    Review the students that will be affected by this progression
                                </DialogDescription>
                            </DialogHeader>

                            {previewData && (
                                <div className="space-y-4">
                                    {/* Summary */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold">{previewData.affected}</div>
                                                <div className="text-sm text-muted-foreground">Total Affected</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {previewData.affected - previewData.graduating}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Will Progress</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {previewData.graduating}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Will Graduate</div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Warnings */}
                                    {previewData.warnings.length > 0 && (
                                        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                                            <div className="font-medium text-yellow-600 mb-2">Warnings:</div>
                                            <ul className="text-sm space-y-1">
                                                {previewData.warnings.map((warning, index) => (
                                                    <li key={index} className="text-yellow-700">
                                                        • {warning}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Student List */}
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Enrollment No</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Current</TableHead>
                                                    <TableHead></TableHead>
                                                    <TableHead>Next</TableHead>
                                                    <TableHead>Batch</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {previewData.preview.map((student) => (
                                                    <TableRow key={student.studentId}>
                                                        <TableCell className="font-medium">{student.enrollmentNo}</TableCell>
                                                        <TableCell>{student.name}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{student.currentSemester.name}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                        </TableCell>
                                                        <TableCell>
                                                            {student.isGraduating ? (
                                                                <Badge className="bg-blue-600">Graduating</Badge>
                                                            ) : (
                                                                <Badge variant="outline">{student.nextSemester?.name}</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {student.admissionYear}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowPreview(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowPreview(false)
                                        setShowConfirmation(true)
                                    }}
                                    className="gap-2"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Proceed with Progression
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Confirmation Dialog */}
                    <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Progression</DialogTitle>
                                <DialogDescription>
                                    This action will progress {previewData?.affected} students to their next semester.
                                    This cannot be easily undone.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                                <div className="flex gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                    <div className="text-sm text-yellow-700">
                                        <strong>Important:</strong> All affected students will have their semester updated.
                                        Historical attendance and academic data will be preserved.
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleExecute} disabled={isLoading}>
                                    {isLoading ? "Processing..." : "Confirm & Execute"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    )
}
