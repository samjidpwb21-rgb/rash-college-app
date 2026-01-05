"use client"

// ============================================================================
// CAMPUSTRACK - FACULTY NOTICES CLIENT COMPONENT
// ============================================================================

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Bell, Loader2, Upload, Image as ImageIcon, X, MoreHorizontal, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { createNotice, deleteNotice } from "@/actions/admin/notices"
import { uploadNoticeImage } from "@/actions/shared/upload-image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { NoticeModal } from "@/components/shared/notice-modal"
import { getNoticeCardColor } from "@/lib/notice-card-colors"

interface NoticeData {
    id: string
    title: string
    description: string
    type: string
    postedBy: string
    date: Date
    isImportant: boolean
    department?: { id: string; name: string; code: string } | null
    imageUrl?: string | null
}

interface FacultyNoticesClientProps {
    notices: NoticeData[]
    user: {
        name: string
        departmentName: string
        departmentId: string  // Auto-populated from faculty profile
    }
}

export function FacultyNoticesClient({ notices, user }: FacultyNoticesClientProps) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formTitle, setFormTitle] = useState("")
    const [formContent, setFormContent] = useState("")
    const [formIsImportant, setFormIsImportant] = useState(false)
    const [formType, setFormType] = useState<"ACADEMIC" | "EVENT" | "EXAM" | "GENERAL">("GENERAL")
    const [formImageFile, setFormImageFile] = useState<File | null>(null)
    const [formImagePreview, setFormImagePreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Delete state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedNotice, setSelectedNotice] = useState<NoticeData | null>(null)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalNotice, setModalNotice] = useState<NoticeData | null>(null)

    const headerUser = {
        name: user.name,
        email: "",
        role: user.departmentName,
    }

    const categories = ["All", "Academic", "Exam", "Event", "General"]

    const filteredNotices = notices.filter((notice) => {
        const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notice.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || selectedCategory === "All" || notice.type === selectedCategory.toLowerCase()
        return matchesSearch && matchesCategory
    })

    const getBadgeVariant = (type: string) => {
        switch (type) {
            case "exam": return "destructive"
            case "academic": return "default"
            case "event": return "secondary"
            default: return "outline"
        }
    }

    // Fetch departments on mount
    // REMOVED - Faculty department is auto-assigned from user.departmentId

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

    const resetForm = () => {
        setFormTitle("")
        setFormContent("")
        setFormIsImportant(false)
        setFormType("GENERAL")
        setFormImageFile(null)
        setFormImagePreview(null)
    }

    const handleCreateNotice = async () => {
        if (!formTitle || !formContent) {
            toast({ title: "Validation Error", description: "Please fill in title and content", variant: "destructive" })
            return
        }

        // Auto-use faculty's department - no manual selection needed
        if (!user.departmentId) {
            toast({ title: "Error", description: "Faculty department not found", variant: "destructive" })
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

            // Create notice with auto-assigned department
            const result = await createNotice({
                title: formTitle,
                content: formContent,
                isImportant: formIsImportant,
                departmentId: user.departmentId,  // Auto-assigned from faculty profile
                type: formType,
                imageUrl,
            })

            if (result.success) {
                toast({ title: "Notice Created", description: result.message || "Notice has been created successfully." })
                setIsCreateModalOpen(false)
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

    const handleNoticeClick = (notice: NoticeData) => {
        setModalNotice(notice)
        setIsModalOpen(true)
    }

    const openDeleteDialog = (notice: NoticeData) => {
        setSelectedNotice(notice)
        setIsDeleteDialogOpen(true)
    }

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
            <DashboardSidebar role="faculty" />

            <MobileSidebar role="faculty" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="Digital Notice Board" user={headerUser} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-6 space-y-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Campus Notices</h2>
                            <p className="text-slate-300">Latest updates from around the campus</p>
                        </div>
                        <Button className="gap-2" onClick={() => { resetForm(); setIsCreateModalOpen(true) }}>
                            <Plus className="h-4 w-4" />
                            Post Notice
                        </Button>
                    </div>

                    {/* Search and Filter Bar */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search notices..."
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {categories.map((category) => (
                                        <Button
                                            key={category}
                                            variant={selectedCategory === category ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedCategory(category)}
                                        >
                                            {category}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                        <Bell className="h-6 w-6 text-destructive" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Important</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {notices.filter(n => n.isImportant).length}
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
                                        <p className="text-sm text-muted-foreground">This Week</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {notices.filter(n => {
                                                const weekAgo = new Date()
                                                weekAgo.setDate(weekAgo.getDate() - 7)
                                                return new Date(n.date) >= weekAgo
                                            }).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Notices Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                                <Badge variant={getBadgeVariant(notice.type)} className="shrink-0">
                                                    {notice.type}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardDescription className="line-clamp-3">{notice.description}</CardDescription>
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
                                            <span>Posted by {notice.postedBy}</span>
                                            <span>{format(new Date(notice.date), "MMM d, yyyy")}</span>
                                        </div>
                                    </CardContent>
                                    {/* Delete Button - Top Right */}
                                    <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
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

            {/* Create Notice Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create Notice</DialogTitle>
                        <DialogDescription>Post a new notice to the digital board.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="notice-title">Title</Label>
                            <Input
                                id="notice-title"
                                placeholder="Notice title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notice-content">Content</Label>
                            <Textarea
                                id="notice-content"
                                placeholder="Notice content"
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notice-type">Notice Type *</Label>
                            <Select value={formType} onValueChange={(value: any) => setFormType(value)}>
                                <SelectTrigger id="notice-type">
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
                        <div className="grid gap-2">
                            <Label htmlFor="notice-image">Image (Optional)</Label>
                            <div className="space-y-2">
                                {!formImagePreview ? (
                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 transition-colors">
                                        <input
                                            type="file"
                                            id="notice-image"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <label htmlFor="notice-image" className="cursor-pointer flex flex-col items-center gap-2">
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
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="notice-important"
                                checked={formIsImportant}
                                onCheckedChange={(checked) => setFormIsImportant(checked === true)}
                            />
                            <Label htmlFor="notice-important">Mark as Important</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isLoading || isUploading}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateNotice} disabled={isLoading || isUploading}>
                            {(isLoading || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isUploading ? "Uploading..." : "Post Notice"}
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
                    content: modalNotice.description,
                    type: modalNotice.type,
                    isImportant: modalNotice.isImportant,
                    imageUrl: modalNotice.imageUrl,
                    department: modalNotice.department,
                    postedBy: modalNotice.postedBy,
                    date: modalNotice.date
                } : null}
            />
        </div>
    )
}
