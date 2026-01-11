"use client"

// ============================================================================
// CAMPUSTRACK - ADMIN COURSES CLIENT COMPONENT
// ============================================================================

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Download, MoreHorizontal, BookOpen, Edit, Trash2, Users, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { createSubject, updateSubject, deleteSubject } from "@/actions/admin/subjects"
import { exportToCSV, getTimestampedFilename } from "@/lib/csv-export"

interface SubjectData {
    id: string
    code: string
    name: string
    departmentName: string
    departmentId?: string
    semesterId?: string
    semester: number
    type: "theory" | "practical"
    facultyName: string
    credits: number
    description?: string
}

interface DepartmentOption {
    id: string
    name: string
    code: string
}

interface SemesterOption {
    id: string
    number: number
    name: string
    year: number
}

interface AdminCoursesClientProps {
    subjects: SubjectData[]
    departments: DepartmentOption[]
    semesters: SemesterOption[]
}

export function AdminCoursesClient({ subjects: initialSubjects, departments, semesters }: AdminCoursesClientProps) {
    const router = useRouter()
    const [subjects] = useState(initialSubjects)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDept, setSelectedDept] = useState("all")
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formCode, setFormCode] = useState("")
    const [formName, setFormName] = useState("")
    const [formType, setFormType] = useState<"THEORY" | "PRACTICAL">("THEORY")
    const [formIsMDC, setFormIsMDC] = useState(false)
    const [formDescription, setFormDescription] = useState("")
    const [formDepartmentId, setFormDepartmentId] = useState("")
    const [formSemesterId, setFormSemesterId] = useState("")

    const user = {
        name: "Admin User",
        email: "admin@university.edu",
        role: "System Administrator",
    }

    // Get unique departments from subjects
    const departmentNames = [...new Set(subjects.map(s => s.departmentName))]

    const filteredSubjects = subjects.filter((s) => {
        const matchesSearch =
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesDept = selectedDept === "all" || s.departmentName === selectedDept
        return matchesSearch && matchesDept
    })

    // Reset form
    const resetForm = () => {
        setFormCode("")
        setFormName("")
        setFormType("THEORY")
        setFormIsMDC(false)
        setFormDescription("")
        setFormDepartmentId("")
        setFormSemesterId("")
    }

    // Open edit modal
    const openEditModal = (subject: SubjectData) => {
        setSelectedSubject(subject)
        setFormCode(subject.code)
        setFormName(subject.name)
        setFormType(subject.type.toUpperCase() as "THEORY" | "PRACTICAL")
        setFormDescription(subject.description || "")
        setIsEditModalOpen(true)
    }

    // Open delete dialog
    const openDeleteDialog = (subject: SubjectData) => {
        setSelectedSubject(subject)
        setIsDeleteDialogOpen(true)
    }

    // Handle create
    const handleCreateSubject = async () => {
        if (!formCode || !formName || !formDepartmentId || !formSemesterId) {
            toast({ title: "Validation Error", description: "Please fill in code, name, department, and semester", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const result = await createSubject({
                code: formCode,
                name: formName,
                type: formType,
                isMDC: formIsMDC,
                description: formDescription || undefined,
                departmentId: formDepartmentId,
                semesterId: formSemesterId,
            })

            if (result.success) {
                toast({ title: "Course Created", description: result.message || "Course has been created successfully." })
                setIsAddModalOpen(false)
                resetForm()
                router.refresh()
            } else {
                toast({ title: "Error", description: result.error || "Failed to create course", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    // Handle update
    const handleUpdateSubject = async () => {
        if (!selectedSubject || !formCode || !formName) {
            toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const result = await updateSubject({
                id: selectedSubject.id,
                code: formCode,
                name: formName,
                type: formType,
                description: formDescription || undefined,
            })

            if (result.success) {
                toast({ title: "Course Updated", description: result.message || "Course has been updated successfully." })
                setIsEditModalOpen(false)
                setSelectedSubject(null)
                resetForm()
                router.refresh()
            } else {
                toast({ title: "Error", description: result.error || "Failed to update course", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    // Handle export courses
    const handleExportCourses = () => {
        // Export filtered courses (respects search and department filters)
        const exportData = filteredSubjects.map(s => ({
            "Course Code": s.code,
            "Course Name": s.name,
            "Department": s.departmentName,
            "Semester": `Semester ${s.semester}`,
            "Type": s.type.charAt(0).toUpperCase() + s.type.slice(1),
            "Credits": s.credits,
            "Faculty": s.facultyName
        }))

        const headers = ["Course Code", "Course Name", "Department", "Semester", "Type", "Credits", "Faculty"]
        const filename = getTimestampedFilename("courses-export")

        exportToCSV(exportData, headers, filename)

        toast({
            title: "Export Successful",
            description: `Exported ${filteredSubjects.length} course(s) to ${filename}`,
        })
    }

    // Handle delete
    const handleDeleteSubject = async () => {
        if (!selectedSubject) return

        setIsLoading(true)
        try {
            const result = await deleteSubject(selectedSubject.id)

            if (result.success) {
                toast({ title: "Course Deleted", description: result.message || "Course has been deleted successfully." })
                setIsDeleteDialogOpen(false)
                setSelectedSubject(null)
                router.refresh()
            } else {
                toast({ title: "Error", description: result.error || "Failed to delete course", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />
            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />

            <div className="lg:ml-64">
                <DashboardHeader title="Courses Management" user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Card>
                            <CardContent className="p-3 sm:p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Courses</p>
                                        <p className="text-lg sm:text-2xl font-bold text-foreground">{subjects.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3 sm:p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Departments</p>
                                        <p className="text-lg sm:text-2xl font-bold text-foreground">{departmentNames.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3 sm:p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-chart-3" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Theory</p>
                                        <p className="text-lg sm:text-2xl font-bold text-foreground">
                                            {subjects.filter(s => s.type === "theory").length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3 sm:p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
                                        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-chart-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Practical</p>
                                        <p className="text-lg sm:text-2xl font-bold text-foreground">
                                            {subjects.filter(s => s.type === "practical").length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Course List */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>All Courses</CardTitle>
                                    <CardDescription>Manage academic courses and subjects</CardDescription>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={handleExportCourses}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </Button>
                                    <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Course
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search courses..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Select value={selectedDept} onValueChange={setSelectedDept}>
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departmentNames.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Course</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Department</th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground hidden sm:table-cell">Semester</th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Type</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">Faculty</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredSubjects.length > 0 ? (
                                            filteredSubjects.map((s) => (
                                                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="font-medium text-foreground text-sm">{s.name}</p>
                                                            <p className="text-xs text-muted-foreground">{s.code} • {s.credits} credits</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{s.departmentName}</td>
                                                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                        <Badge variant="outline">Sem {s.semester}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge className={s.type === "theory" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}>
                                                            {s.type}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{s.facultyName}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openEditModal(s)}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(s)}>
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                    No courses found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                Showing {filteredSubjects.length} of {subjects.length} courses
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Add Course Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Course</DialogTitle>
                        <DialogDescription>Create a new academic course/subject.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="add-code">Course Code</Label>
                            <Input
                                id="add-code"
                                placeholder="CS101"
                                value={formCode}
                                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-name">Course Name</Label>
                            <Input
                                id="add-name"
                                placeholder="Introduction to Computer Science"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="add-dept">Department</Label>
                                <Select value={formDepartmentId} onValueChange={setFormDepartmentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-semester">Semester</Label>
                                <Select value={formSemesterId} onValueChange={setFormSemesterId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {semesters.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                Sem {s.number} ({s.year})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-type">Type</Label>
                            <Select value={formType} onValueChange={(v) => setFormType(v as "THEORY" | "PRACTICAL")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="THEORY">Theory</SelectItem>
                                    <SelectItem value="PRACTICAL">Practical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="add-mdc" className="text-base">Multi-Disciplinary Course (MDC)</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enable for courses offered to students from other departments
                                </p>
                            </div>
                            <Switch
                                id="add-mdc"
                                checked={formIsMDC}
                                onCheckedChange={setFormIsMDC}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-description">Description (Optional)</Label>
                            <Textarea
                                id="add-description"
                                placeholder="Course description"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateSubject} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Add Course
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Course Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Course</DialogTitle>
                        <DialogDescription>Update course information.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-code">Course Code</Label>
                            <Input
                                id="edit-code"
                                placeholder="CS101"
                                value={formCode}
                                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Course Name</Label>
                            <Input
                                id="edit-name"
                                placeholder="Introduction to Computer Science"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-type">Type</Label>
                            <Select value={formType} onValueChange={(v) => setFormType(v as "THEORY" | "PRACTICAL")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="THEORY">Theory</SelectItem>
                                    <SelectItem value="PRACTICAL">Practical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description (Optional)</Label>
                            <Textarea
                                id="edit-description"
                                placeholder="Course description"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateSubject} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Course</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{selectedSubject?.name}</strong> ({selectedSubject?.code})?
                            This action cannot be undone. Note: Courses with attendance records cannot be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSubject}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete Course
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
