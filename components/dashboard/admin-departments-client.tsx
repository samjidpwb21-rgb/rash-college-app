"use client"

// ============================================================================
// CAMPUSTRACK - ADMIN DEPARTMENTS CLIENT COMPONENT
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
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Users, BookOpen, GraduationCap, TrendingUp, MoreHorizontal, Edit, Trash2, BarChart3, Building2, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { createDepartment, updateDepartment, deleteDepartment } from "@/actions/admin/departments"

interface DepartmentData {
    id: string
    code: string
    name: string
    head: string
    students: number
    faculty: number
    courses: number
    avgAttendance: number
    status: "active" | "inactive"
    description?: string
}

interface AdminDepartmentsClientProps {
    departments: DepartmentData[]
}

export function AdminDepartmentsClient({ departments }: AdminDepartmentsClientProps) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState<DepartmentData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formName, setFormName] = useState("")
    const [formCode, setFormCode] = useState("")
    const [formDescription, setFormDescription] = useState("")

    const user = {
        name: "Admin User",
        email: "admin@university.edu",
        role: "System Administrator",
    }

    const totalStudents = departments.reduce((acc, d) => acc + d.students, 0)
    const totalFaculty = departments.reduce((acc, d) => acc + d.faculty, 0)
    const totalCourses = departments.reduce((acc, d) => acc + d.courses, 0)

    // Reset form
    const resetForm = () => {
        setFormName("")
        setFormCode("")
        setFormDescription("")
    }

    // Open edit modal with department data
    const openEditModal = (dept: DepartmentData) => {
        setSelectedDepartment(dept)
        setFormName(dept.name)
        setFormCode(dept.code)
        setFormDescription(dept.description || "")
        setIsEditModalOpen(true)
    }

    // Open delete dialog
    const openDeleteDialog = (dept: DepartmentData) => {
        setSelectedDepartment(dept)
        setIsDeleteDialogOpen(true)
    }

    // Handle create department
    const handleCreateDepartment = async () => {
        if (!formName || !formCode) {
            toast({
                title: "Validation Error",
                description: "Please fill in name and code",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)
        try {
            const result = await createDepartment({
                name: formName,
                code: formCode,
                description: formDescription || undefined,
            })

            if (result.success) {
                toast({
                    title: "Department Created",
                    description: result.message || "Department has been created successfully.",
                })
                setIsAddModalOpen(false)
                resetForm()
                router.refresh()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to create department",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Handle update department
    const handleUpdateDepartment = async () => {
        if (!selectedDepartment || !formName || !formCode) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)
        try {
            const result = await updateDepartment({
                id: selectedDepartment.id,
                name: formName,
                code: formCode,
                description: formDescription || undefined,
            })

            if (result.success) {
                toast({
                    title: "Department Updated",
                    description: result.message || "Department has been updated successfully.",
                })
                setIsEditModalOpen(false)
                setSelectedDepartment(null)
                resetForm()
                router.refresh()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update department",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Handle delete department
    const handleDeleteDepartment = async () => {
        if (!selectedDepartment) return

        setIsLoading(true)
        try {
            const result = await deleteDepartment(selectedDepartment.id)

            if (result.success) {
                toast({
                    title: "Department Deleted",
                    description: "Department and all dependent data deleted successfully.",
                })
                setIsDeleteDialogOpen(false)
                setSelectedDepartment(null)
                router.refresh()
            } else {
                // Keep dialog open so user sees the error and can dismiss manually
                toast({
                    title: "Cannot Delete Department",
                    description: result.error || "This department has students, faculty, or courses and cannot be deleted.",
                    variant: "destructive",
                    duration: 5000, // Show error for 5 seconds
                })
                // Don't close dialog - let user see error and click Cancel
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
                duration: 5000,
            })
            // Don't close dialog on error
        } finally {
            setIsLoading(false)
        }
    }

    const handleDepartmentClick = (deptId: string) => {
        router.push(`/dashboard/admin/departments/${deptId}`)
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />
            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />

            <div className="lg:ml-64">
                <DashboardHeader title="Departments" user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building2 className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Departments</p>
                                        <p className="text-2xl font-bold text-foreground">{departments.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <GraduationCap className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Students</p>
                                        <p className="text-2xl font-bold text-foreground">{totalStudents.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-chart-3" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Faculty</p>
                                        <p className="text-2xl font-bold text-foreground">{totalFaculty}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-chart-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Courses</p>
                                        <p className="text-2xl font-bold text-foreground">{totalCourses}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Department Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">All Departments</h2>
                            <p className="text-sm text-muted-foreground">Manage academic departments</p>
                        </div>
                        <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Department
                        </Button>
                    </div>

                    {/* Department Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departments.length > 0 ? (
                            departments.map((dept) => (
                                <Card
                                    key={dept.id}
                                    className="hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={(e) => {
                                        if (!(e.target as HTMLElement).closest('[role="button"]')) {
                                            handleDepartmentClick(dept.id)
                                        }
                                    }}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{dept.name}</CardTitle>
                                                <CardDescription>{dept.head}</CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditModal(dept) }}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDepartmentClick(dept.id) }}>
                                                        <BarChart3 className="h-4 w-4 mr-2" />
                                                        View Analytics
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(dept) }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">{dept.students.toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">Students</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">{dept.faculty}</p>
                                                <p className="text-xs text-muted-foreground">Faculty</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">{dept.courses}</p>
                                                <p className="text-xs text-muted-foreground">Courses</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Avg Attendance</span>
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-accent" />
                                                    <span className="font-medium">{dept.avgAttendance}%</span>
                                                </div>
                                            </div>
                                            <Progress value={dept.avgAttendance} className="h-2" />
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <Badge variant="outline">{dept.code}</Badge>
                                            <Badge className="bg-accent text-accent-foreground">
                                                {dept.status === "active" ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card className="col-span-full">
                                <CardContent className="p-12 text-center">
                                    <p className="text-muted-foreground">No departments found</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Department Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Department</DialogTitle>
                        <DialogDescription>
                            Create a new academic department.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="add-name">Department Name</Label>
                            <Input
                                id="add-name"
                                placeholder="Computer Science"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-code">Department Code</Label>
                            <Input
                                id="add-code"
                                placeholder="CSE"
                                value={formCode}
                                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                maxLength={10}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-description">Description (Optional)</Label>
                            <Textarea
                                id="add-description"
                                placeholder="Brief description of the department"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateDepartment} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Department
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Department Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Department</DialogTitle>
                        <DialogDescription>
                            Update department information.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Department Name</Label>
                            <Input
                                id="edit-name"
                                placeholder="Computer Science"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-code">Department Code</Label>
                            <Input
                                id="edit-code"
                                placeholder="CSE"
                                value={formCode}
                                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                maxLength={10}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description (Optional)</Label>
                            <Textarea
                                id="edit-description"
                                placeholder="Brief description of the department"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateDepartment} disabled={isLoading}>
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
                        <AlertDialogTitle>Delete Department</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    Are you sure you want to delete <strong>{selectedDepartment?.name}</strong>?
                                </p>
                                <div className="bg-destructive/10 border border-destructive/50 rounded-md p-3 space-y-2">
                                    <p className="font-semibold text-destructive">⚠️ Permanent Deletion Warning</p>
                                    <p className="text-sm">Deleting this department will also permanently delete:</p>
                                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                                        <li>All students under this department</li>
                                        <li>All faculty under this department</li>
                                        <li>All courses and subjects</li>
                                        <li>All timetable entries</li>
                                        <li>All attendance records</li>
                                    </ul>
                                    <p className="text-sm font-semibold text-destructive mt-2">
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDepartment}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete Department & All Data
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
