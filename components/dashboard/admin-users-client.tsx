"use client"

// ============================================================================
// CAMPUSTRACK - ADMIN USERS CLIENT COMPONENT
// ============================================================================

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, Download, MoreHorizontal, Mail, Edit, Trash2, Users, GraduationCap, UserCog, Shield, Loader2, Eye, EyeOff } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { createUser, updateUser, deleteUser } from "@/actions/admin/users"
import { getPublicDepartments } from "@/actions/auth/register"
import { getAllSemesters } from "@/actions/admin/semesters"
import { exportToCSV, getTimestampedFilename } from "@/lib/csv-export"

interface UserData {
    id: string
    name: string
    email: string
    role: "student" | "faculty" | "admin"
    department: string
    status: "active" | "inactive" | "suspended"
}

interface AdminUsersClientProps {
    users: UserData[]
}

const roleColors = {
    student: "bg-primary/10 text-primary",
    faculty: "bg-accent/10 text-accent",
    admin: "bg-chart-4/10 text-chart-4",
}

const statusColors = {
    active: "bg-accent text-accent-foreground",
    inactive: "bg-muted text-muted-foreground",
    suspended: "bg-destructive text-destructive-foreground",
}

export function AdminUsersClient({ users }: AdminUsersClientProps) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedRole, setSelectedRole] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formName, setFormName] = useState("")
    const [formEmail, setFormEmail] = useState("")
    const [formPassword, setFormPassword] = useState("")
    const [formRole, setFormRole] = useState<"ADMIN" | "FACULTY" | "STUDENT">("STUDENT")
    const [formDepartmentId, setFormDepartmentId] = useState("")
    const [formSemesterId, setFormSemesterId] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [departments, setDepartments] = useState<Array<{ id: string; name: string; code: string }>>([])
    const [semesters, setSemesters] = useState<Array<{ id: string; name: string; number: number; academicYear: { name: string } }>>([])

    // Validation errors
    const [fieldErrors, setFieldErrors] = useState<{
        name?: string
        email?: string
        password?: string
        role?: string
        department?: string
        semester?: string
    }>({})

    const user = {
        name: "Admin User",
        email: "admin@university.edu",
        role: "System Administrator",
    }

    // Fetch departments and semesters on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [deptResult, semResult] = await Promise.all([
                    getPublicDepartments(),
                    getAllSemesters()
                ])
                if (deptResult.success && deptResult.data) {
                    setDepartments(deptResult.data)
                }
                if (semResult.success && semResult.data) {
                    setSemesters(semResult.data)
                }
            } catch (error) {
                console.error("Failed to fetch form data:", error)
            }
        }
        fetchData()
    }, [])

    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = selectedRole === "all" || u.role === selectedRole
        const matchesStatus = selectedStatus === "all" || u.status === selectedStatus
        return matchesSearch && matchesRole && matchesStatus
    })

    const studentCount = users.filter((u) => u.role === "student").length
    const facultyCount = users.filter((u) => u.role === "faculty").length
    const adminCount = users.filter((u) => u.role === "admin").length

    // Reset form
    const resetForm = () => {
        setFormName("")
        setFormEmail("")
        setFormPassword("")
        setFormRole("STUDENT")
        setFormDepartmentId("")
        setFormSemesterId("")
        setFieldErrors({})
    }

    // Open edit modal with user data
    const openEditModal = (u: UserData) => {
        setSelectedUser(u)
        setFormName(u.name)
        setFormEmail(u.email)
        setFormPassword("")
        setFormRole(u.role.toUpperCase() as "ADMIN" | "FACULTY" | "STUDENT")
        setIsEditModalOpen(true)
    }

    // Open delete dialog
    const openDeleteDialog = (u: UserData) => {
        setSelectedUser(u)
        setIsDeleteDialogOpen(true)
    }

    // Handle create user
    const handleCreateUser = async () => {
        // Reset previous errors
        const errors: typeof fieldErrors = {}

        // Validate all fields
        if (!formName || formName.trim() === "") {
            errors.name = "Name is required"
        }

        if (!formEmail || formEmail.trim() === "") {
            errors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
            errors.email = "Invalid email format"
        } else if (!formEmail.toLowerCase().endsWith("@gmail.com")) {
            errors.email = "Only Gmail addresses (@gmail.com) are allowed"
        } else {
            // Check for duplicate email
            const existingEmail = users.find(u => u.email.toLowerCase() === formEmail.toLowerCase())
            if (existingEmail) {
                errors.email = "This email is already registered"
            }
        }

        if (!formPassword || formPassword.trim() === "") {
            errors.password = "Password is required"
        } else if (formPassword.length < 6) {
            errors.password = "Password must be at least 6 characters"
        }

        if (!formDepartmentId) {
            errors.department = "Department is required"
        }

        if (formRole === "STUDENT" && !formSemesterId) {
            errors.semester = "Semester is required for students"
        }

        // Check for duplicate name (case-insensitive) - only if name is valid
        if (formName && formName.trim() !== "") {
            const existingName = users.find(u => u.name.toLowerCase() === formName.trim().toLowerCase())
            if (existingName) {
                errors.name = "A user with this name already exists"
            }
        }

        // If there are any errors, show them and return
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            toast({
                title: "Validation Error",
                description: "Please fix the errors in the form",
                variant: "destructive",
            })
            return
        }

        // Clear any previous errors before submitting
        setFieldErrors({})
        setIsLoading(true)

        try {
            console.log("Creating user with data:", { name: formName, email: formEmail, role: formRole, departmentId: formDepartmentId, semesterId: formSemesterId })

            const result = await createUser({
                name: formName,
                email: formEmail,
                password: formPassword,
                role: formRole,
                departmentId: formDepartmentId,
                semesterId: formRole === "STUDENT" ? formSemesterId : undefined,
            })

            console.log("Create user result:", result)

            if (result.success) {
                toast({
                    title: "User Created",
                    description: result.message || "User has been created successfully.",
                })
                setIsAddModalOpen(false)
                resetForm()
                router.refresh()
            } else {
                console.error("User creation failed:", result.error)
                toast({
                    title: "Error",
                    description: result.error || "Failed to create user",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Unexpected error during user creation:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            // Always reset loading state
            setIsLoading(false)
        }
    }

    // Handle update user
    const handleUpdateUser = async () => {
        if (!selectedUser || !formName || !formEmail) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)
        try {
            const result = await updateUser({
                id: selectedUser.id,
                name: formName,
                email: formEmail,
            })

            if (result.success) {
                toast({
                    title: "User Updated",
                    description: result.message || "User has been updated successfully.",
                })
                setIsEditModalOpen(false)
                setSelectedUser(null)
                resetForm()
                router.refresh()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update user",
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

    // Handle export users
    const handleExportUsers = () => {
        // Export filtered users (respects search, role, and status filters)
        const exportData = filteredUsers.map(u => ({
            "User ID": u.id,
            "Name": u.name,
            "Email": u.email,
            "Role": u.role.charAt(0).toUpperCase() + u.role.slice(1),
            "Department": u.department,
            "Status": u.status.charAt(0).toUpperCase() + u.status.slice(1)
        }))

        const headers = ["User ID", "Name", "Email", "Role", "Department", "Status"]
        const filename = getTimestampedFilename("users-export")

        exportToCSV(exportData, headers, filename)

        toast({
            title: "Export Successful",
            description: `Exported ${filteredUsers.length} user(s) to ${filename}`,
        })
    }

    // Handle delete user (soft delete)
    const handleDeleteUser = async () => {
        if (!selectedUser) return

        setIsLoading(true)
        try {
            const result = await deleteUser(selectedUser.id)

            if (result.success) {
                toast({
                    title: "User Deleted",
                    description: result.message || "User has been deactivated successfully.",
                })
                setIsDeleteDialogOpen(false)
                setSelectedUser(null)
                router.refresh()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete user",
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

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />

            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="User Management" user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Users</p>
                                        <p className="text-2xl font-bold text-foreground">{users.length}</p>
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
                                        <p className="text-sm text-muted-foreground">Students</p>
                                        <p className="text-2xl font-bold text-foreground">{studentCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                        <UserCog className="h-6 w-6 text-chart-3" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Faculty</p>
                                        <p className="text-2xl font-bold text-foreground">{facultyCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
                                        <Shield className="h-6 w-6 text-chart-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Admins</p>
                                        <p className="text-2xl font-bold text-foreground">{adminCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* User List */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>All Users</CardTitle>
                                    <CardDescription>Manage students, faculty, and administrators</CardDescription>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={handleExportUsers}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </Button>
                                    <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add User
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
                                        placeholder="Search users..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger className="w-full sm:w-40">
                                        <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="student">Students</SelectItem>
                                        <SelectItem value="faculty">Faculty</SelectItem>
                                        <SelectItem value="admin">Admins</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger className="w-full sm:w-40">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">
                                                Department
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Role</th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground hidden sm:table-cell">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((u) => (
                                                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                                    {u.name
                                                                        .split(" ")
                                                                        .map((n) => n[0])
                                                                        .join("")}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-foreground text-sm">{u.name}</p>
                                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{u.department}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge className={roleColors[u.role]}>
                                                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                        <Badge className={statusColors[u.status]}>
                                                            {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openEditModal(u)}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem>
                                                                    <Mail className="h-4 w-4 mr-2" />
                                                                    Send Email
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => openDeleteDialog(u)}
                                                                >
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
                                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                    No users found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                Showing {filteredUsers.length} of {users.length} users
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Add User Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                            Create a new user account. They will be able to login immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="add-name">Full Name</Label>
                            <Input
                                id="add-name"
                                placeholder="John Doe"
                                value={formName}
                                onChange={(e) => {
                                    setFormName(e.target.value)
                                    if (fieldErrors.name) {
                                        setFieldErrors({ ...fieldErrors, name: undefined })
                                    }
                                }}
                                className={fieldErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {fieldErrors.name && (
                                <p className="text-sm text-red-500">{fieldErrors.name}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-email">Email Address</Label>
                            <Input
                                id="add-email"
                                type="email"
                                placeholder="john@university.edu"
                                value={formEmail}
                                onChange={(e) => {
                                    setFormEmail(e.target.value)
                                    if (fieldErrors.email) {
                                        setFieldErrors({ ...fieldErrors, email: undefined })
                                    }
                                }}
                                className={fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {fieldErrors.email && (
                                <p className="text-sm text-red-500">{fieldErrors.email}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="add-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min 6 characters"
                                    value={formPassword}
                                    onChange={(e) => {
                                        setFormPassword(e.target.value)
                                        if (fieldErrors.password) {
                                            setFieldErrors({ ...fieldErrors, password: undefined })
                                        }
                                    }}
                                    className={fieldErrors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-sm text-red-500">{fieldErrors.password}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-role">Role</Label>
                            <Select value={formRole} onValueChange={(v) => setFormRole(v as "ADMIN" | "FACULTY" | "STUDENT")}>
                                <SelectTrigger id="add-role">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STUDENT">Student</SelectItem>
                                    <SelectItem value="FACULTY">Faculty</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-department">Department</Label>
                            <Select
                                value={formDepartmentId}
                                onValueChange={(value) => {
                                    setFormDepartmentId(value)
                                    if (fieldErrors.department) {
                                        setFieldErrors({ ...fieldErrors, department: undefined })
                                    }
                                }}
                            >
                                <SelectTrigger
                                    id="add-department"
                                    className={fieldErrors.department ? "border-red-500 focus:ring-red-500" : ""}
                                >
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldErrors.department && (
                                <p className="text-sm text-red-500">{fieldErrors.department}</p>
                            )}
                        </div>

                        {formRole === "STUDENT" && (
                            <div className="grid gap-2">
                                <Label htmlFor="add-semester">Semester</Label>
                                <Select
                                    value={formSemesterId}
                                    onValueChange={(value) => {
                                        setFormSemesterId(value)
                                        if (fieldErrors.semester) {
                                            setFieldErrors({ ...fieldErrors, semester: undefined })
                                        }
                                    }}
                                >
                                    <SelectTrigger
                                        id="add-semester"
                                        className={fieldErrors.semester ? "border-red-500 focus:ring-red-500" : ""}
                                    >
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {semesters.map((sem) => (
                                            <SelectItem key={sem.id} value={sem.id}>
                                                {sem.name} ({sem.academicYear.name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldErrors.semester && (
                                    <p className="text-sm text-red-500">{fieldErrors.semester}</p>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateUser} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information. Password cannot be changed here.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                placeholder="John Doe"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email Address</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="john@university.edu"
                                value={formEmail}
                                onChange={(e) => setFormEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Input value={formRole} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Role cannot be changed after creation</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateUser} disabled={isLoading}>
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
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{selectedUser?.name}</strong>?
                            This will deactivate their account and they will no longer be able to login.
                            This action can be reversed by an administrator.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

