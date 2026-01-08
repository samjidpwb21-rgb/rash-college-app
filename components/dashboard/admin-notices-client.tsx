"use client"

// ============================================================================
// CAMPUSTRACK - ADMIN NOTICES CLIENT COMPONENT
// ============================================================================

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Pin, Bell, Loader2, Upload, Image as ImageIcon, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { NoticeModal } from "@/components/shared/notice-modal"
import { toast } from "@/hooks/use-toast"
import { createNotice, updateNotice, deleteNotice } from "@/actions/admin/notices"
import { uploadNoticeImage } from "@/actions/shared/upload-image"
import { getDepartments } from "@/actions/admin/departments"
import { getOrAssignNoticeColor } from "@/lib/notice-color-assignment"
import { format } from "date-fns"
import { getNoticeCardColor } from "@/lib/notice-card-colors"

interface NoticeData {
    id: string
    title: string
    content: string
    isImportant: boolean
    publishedAt: Date
    authorName: string
    type: "ACADEMIC" | "EVENT" | "EXAM" | "GENERAL"
    department?: { id: string; name: string; code: string } | null
    imageUrl?: string | null
}

interface AdminNoticesClientProps {
    notices: NoticeData[]
}

export function AdminNoticesClient({ notices: initialNotices }: AdminNoticesClientProps) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [notices] = useState(initialNotices)
    const [searchQuery, setSearchQuery] = useState("")

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedNotice, setSelectedNotice] = useState<NoticeData | null>(null)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalNotice, setModalNotice] = useState<NoticeData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formTitle, setFormTitle] = useState("")
    const [formContent, setFormContent] = useState("")
    const [formIsImportant, setFormIsImportant] = useState(false)
    const [formDepartmentId, setFormDepartmentId] = useState("")
    const [formType, setFormType] = useState<"ACADEMIC" | "EVENT" | "EXAM" | "GENERAL">("GENERAL")
    const [formImageFile, setFormImageFile] = useState<File | null>(null)
    const [formImagePreview, setFormImagePreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Departments list
    const [departments, setDepartments] = useState<Array<{ id: string; name: string; code: string }>>([])

    const user = {
        name: "Admin User",
        email: "admin@university.edu",
        role: "System Administrator",
    }

    const filteredNotices = notices.filter((notice) =>
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Fetch departments on mount
    useEffect(() => {
        const fetchDepartments = async () => {
            const result = await getDepartments()
            if (result.success && result.data) {
                setDepartments(result.data)
            }
        }
        fetchDepartments()
    }, [])

    // Handle image file change
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if (!validTypes.includes(file.type)) {
            toast({ title: "Invalid File", description: "Only JPG, PNG, and WebP images are allowed", variant: "destructive" })
            return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File Too Large", description: "Image must be less than 5MB", variant: "destructive" })
            return
        }

        setFormImageFile(file)
        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setFormImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    // Remove image
    const handleRemoveImage = () => {
        setFormImageFile(null)
        setFormImagePreview(null)
    }

    // Reset form
    const resetForm = () => {
        setFormTitle("")
        setFormContent("")
        setFormIsImportant(false)
        setFormDepartmentId("")
        setFormType("GENERAL")
        setFormImageFile(null)
        setFormImagePreview(null)
    }

    // Open edit modal
    const openEditModal = (notice: NoticeData) => {
        setSelectedNotice(notice)
        setFormTitle(notice.title)
        setFormContent(notice.content)
        setFormIsImportant(notice.isImportant)
        setIsEditModalOpen(true)
    }

    // Open delete dialog
    const openDeleteDialog = (notice: NoticeData) => {
        setSelectedNotice(notice)
        setIsDeleteDialogOpen(true)
    }

    // Handle create
    const handleCreateNotice = async () => {
        if (!formTitle || !formContent) {
            toast({ title: "Validation Error", description: "Please fill in title and content", variant: "destructive" })
            return
        }

        if (!formDepartmentId) {
            toast({ title: "Validation Error", description: "Please select a department", variant: "destructive" })
            return
        }

        setIsLoading(true)
        let imageUrl: string | undefined

        try {
            // Upload image if selected
            if (formImageFile) {
                setIsUploading(true)
                const formData = new FormData()
                formData.append("file", formImageFile)

                const uploadResult = await uploadNoticeImage(formData)
                setIsUploading(false)

                if (!uploadResult.success) {
                    toast({ title: "Image Upload Failed", description: uploadResult.error || "Failed to upload image", variant: "destructive" })
                    setIsLoading(false)
                    return
                }

                imageUrl = uploadResult.data?.fileUrl
            }

            // Create notice
            const result = await createNotice({
                title: formTitle,
                content: formContent,
                isImportant: formIsImportant,
                departmentId: formDepartmentId,
                type: formType,
                imageUrl,
            })

            if (result.success) {
                toast({ title: "Notice Created", description: result.message || "Notice has been created successfully." })
                setIsAddModalOpen(false)
                resetForm()
                router.refresh()
            } else {
                toast({ title: "Error", description: result.error || "Failed to create notice", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        } finally {
            setIsLoading(false)
            setIsUploading(false)
        }
    }

    // Handle update
    const handleUpdateNotice = async () => {
        if (!selectedNotice || !formTitle || !formContent) {
            toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const result = await updateNotice({
                id: selectedNotice.id,
                title: formTitle,
                content: formContent,
                isImportant: formIsImportant,
            })

            if (result.success) {
                toast({ title: "Notice Updated", description: result.message || "Notice has been updated successfully." })
                setIsEditModalOpen(false)
                setSelectedNotice(null)
                resetForm()
                router.refresh()
            } else {
                toast({ title: "Error", description: result.error || "Failed to update notice", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleNoticeClick = (notice: NoticeData) => {
        setModalNotice(notice)
        setIsModalOpen(true)
    }

    // Handle delete
    const handleDeleteNotice = async () => {
        if (!selectedNotice) return

        setIsLoading(true)
        try {
            const result = await deleteNotice(selectedNotice.id)

            if (result.success) {
                toast({ title: "Notice Deleted", description: result.message || "Notice has been deleted successfully." })
                setIsDeleteDialogOpen(false)
                setSelectedNotice(null)
                router.refresh()
            } else {
                toast({ title: "Error", description: result.error || "Failed to delete notice", variant: "destructive" })
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
                <DashboardHeader title="Notice Board" user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Manage Notices</h2>
                            <p className="text-slate-300">Create and manage campus-wide announcements</p>
                        </div>
                        <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Notice
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Bell className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Notices</p>
                                        <p className="text-2xl font-bold text-foreground">{notices.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                                        <Pin className="h-6 w-6 text-destructive" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Important</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {notices.filter((n) => n.isImportant).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <Bell className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Recent (7 days)</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {notices.filter((n) => {
                                                const week = 7 * 24 * 60 * 60 * 1000
                                                return new Date(n.publishedAt).getTime() > Date.now() - week
                                            }).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search Bar */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search notices..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notices Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {filteredNotices.length > 0 ? (
                            filteredNotices.map((notice) => (
                                <Card
                                    key={notice.id}
                                    className={`hover:shadow-md transition-shadow relative cursor-pointer ${getNoticeCardColor(notice.id)}`}
                                    onClick={() => handleNoticeClick(notice)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-lg line-clamp-2">{notice.title}</CardTitle>
                                            <div className="flex gap-1 flex-wrap">
                                                {notice.isImportant && (
                                                    <Badge variant="destructive" className="shrink-0">Important</Badge>
                                                )}
                                                {/* Department Badge */}
                                                <Badge variant="outline" className="shrink-0 text-xs">
                                                    {notice.department ? notice.department.name : "All Departments"}
                                                </Badge>
                                                {/* Type Badge */}
                                                <Badge variant="secondary" className="shrink-0 text-xs">
                                                    {notice.type === "ACADEMIC" && "Academic"}
                                                    {notice.type === "EVENT" && "Event"}
                                                    {notice.type === "EXAM" && "Exam"}
                                                    {notice.type === "GENERAL" && "General"}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardDescription className="line-clamp-3">{notice.content}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Image Thumbnail */}
                                        {notice.imageUrl && (
                                            <div className="mb-3">
                                                <img
                                                    src={notice.imageUrl}
                                                    alt="Notice image"
                                                    className="w-full h-32 object-cover rounded-md"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>Posted by {notice.authorName}</span>
                                            <span>{format(new Date(notice.publishedAt), "MMM d, yyyy")}</span>
                                        </div>
                                    </CardContent>
                                    {/* Admin Actions Dropdown - Top Right */}
                                    <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditModal(notice)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(notice)}>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <Card className="col-span-full">
                                <CardContent className="p-12 text-center">
                                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No notices found matching your criteria.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Notice Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Notice</DialogTitle>
                        <DialogDescription>Create a campus-wide announcement.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="add-title">Title</Label>
                            <Input
                                id="add-title"
                                placeholder="Notice title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-content">Content</Label>
                            <Textarea
                                id="add-content"
                                placeholder="Notice content"
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-department">Department *</Label>
                            <Select value={formDepartmentId} onValueChange={setFormDepartmentId}>
                                <SelectTrigger id="add-department">
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name} ({dept.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-image">Image (Optional)</Label>
                            <div className="space-y-2">
                                {!formImagePreview ? (
                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 transition-colors">
                                        <input
                                            type="file"
                                            id="add-image"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <label htmlFor="add-image" className="cursor-pointer flex flex-col items-center gap-2">
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground text-center">
                                                Click to upload image
                                                <br />
                                                <span className="text-xs">JPG, PNG, WebP (max 5MB)</span>
                                            </p>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={formImagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2"
                                            onClick={handleRemoveImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-type">Notice Type *</Label>
                            <Select value={formType} onValueChange={(value: any) => setFormType(value)}>
                                <SelectTrigger id="add-type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GENERAL">General</SelectItem>
                                    <SelectItem value="ACADEMIC">Academic</SelectItem>
                                    <SelectItem value="EVENT">Event</SelectItem>
                                    <SelectItem value="EXAM">Exam</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="add-important"
                                checked={formIsImportant}
                                onCheckedChange={(checked) => setFormIsImportant(checked === true)}
                            />
                            <Label htmlFor="add-important">Mark as Important</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isLoading || isUploading}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateNotice} disabled={isLoading || isUploading}>
                            {(isLoading || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isUploading ? "Uploading..." : "Create Notice"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Notice Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Notice</DialogTitle>
                        <DialogDescription>Update notice information.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                placeholder="Notice title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-content">Content</Label>
                            <Textarea
                                id="edit-content"
                                placeholder="Notice content"
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="edit-important"
                                checked={formIsImportant}
                                onCheckedChange={(checked) => setFormIsImportant(checked === true)}
                            />
                            <Label htmlFor="edit-important">Mark as Important</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateNotice} disabled={isLoading}>
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
                        <AlertDialogTitle>Delete Notice</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{selectedNotice?.title}</strong>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteNotice}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete Notice
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Notice Detail Modal */}
            <NoticeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                notice={modalNotice ? {
                    title: modalNotice.title,
                    content: modalNotice.content,
                    type: modalNotice.type,
                    isImportant: modalNotice.isImportant,
                    imageUrl: modalNotice.imageUrl,
                    department: modalNotice.department,
                    postedBy: modalNotice.authorName,
                    date: modalNotice.publishedAt
                } : null}
            />
        </div>
    )
}
