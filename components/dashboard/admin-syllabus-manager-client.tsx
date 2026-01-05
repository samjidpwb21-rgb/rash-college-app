"use client"

// ============================================================================
// CAMPUSTRACK - ADMIN SYLLABUS MANAGER CLIENT COMPONENT
// Upload, view, replace, and delete semester-wise syllabus PDFs
// ============================================================================

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Upload, FileText, Trash2, Eye, Replace, Loader2, AlertTriangle } from "lucide-react"
import { uploadSyllabus, deleteSyllabus } from "@/actions/admin/syllabus"

interface Syllabus {
    id: string
    fileName: string
    fileUrl: string
    uploadedAt: Date
    semester: {
        id: string
        number: number
        name: string
    }
}

interface AdminSyllabusManagerClientProps {
    department: {
        id: string
        name: string
        code: string
    }
    semesters: Array<{
        id: string
        number: number
        name: string
    }>
    initialSyllabi: Syllabus[]
    user: {
        name: string
        email: string
        role: string
    }
}

export function AdminSyllabusManagerClient({
    department,
    semesters,
    initialSyllabi,
    user,
}: AdminSyllabusManagerClientProps) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { toast } = useToast()
    const [syllabi, setSyllabi] = useState<Syllabus[]>(initialSyllabi)
    const [isUploading, setIsUploading] = useState<string | null>(null) // semesterId being uploaded
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; syllabus: Syllabus | null }>({
        open: false,
        syllabus: null,
    })

    const getSyllabusForSemester = (semesterId: string): Syllabus | undefined => {
        return syllabi.find(s => s.semester.id === semesterId)
    }

    const handleFileSelect = async (semesterId: string, file: File | null) => {
        if (!file) return

        // Validate file type
        if (file.type !== "application/pdf") {
            toast({
                title: "Invalid File Type",
                description: "Only PDF files are allowed",
                variant: "destructive",
            })
            return
        }

        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            toast({
                title: "File Too Large",
                description: "File size must not exceed 10MB",
                variant: "destructive",
            })
            return
        }

        setIsUploading(semesterId)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const result = await uploadSyllabus(department.id, semesterId, formData)

            if (result.success && result.data) {
                toast({
                    title: "Success",
                    description: result.message || "Syllabus uploaded successfully",
                })

                // Update local state
                setSyllabi(prev => {
                    const filtered = prev.filter(s => s.semester.id !== semesterId)
                    return [...filtered, result.data]
                })

                // Refresh page data
                router.refresh()
            } else {
                toast({
                    title: "Upload Failed",
                    description: !result.success ? result.error : "Failed to upload syllabus",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsUploading(null)
        }
    }

    const handleDelete = async () => {
        if (!deleteDialog.syllabus) return

        setIsDeleting(true)

        try {
            const result = await deleteSyllabus(deleteDialog.syllabus.id)

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Syllabus deleted successfully",
                })

                // Update local state
                setSyllabi(prev => prev.filter(s => s.id !== deleteDialog.syllabus!.id))

                setDeleteDialog({ open: false, syllabus: null })
                router.refresh()
            } else {
                toast({
                    title: "Delete Failed",
                    description: !result.success ? result.error : "Failed to delete syllabus",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Delete error:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />

            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title={`${department.name} – Syllabus Management`} user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/admin/departments/${department.id}`)}
                        className="mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Department
                    </Button>

                    {/* Info Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Semester-Wise Syllabus Management</CardTitle>
                                <Badge variant="outline">{department.code}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Upload PDF syllabus documents for each semester. Only one syllabus per semester is allowed.
                                Uploading a new file will replace the existing one.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Semester Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {semesters.map((semester) => {
                            const existingSyllabus = getSyllabusForSemester(semester.id)
                            const isUploadingThis = isUploading === semester.id

                            return (
                                <Card key={semester.id} className="relative">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{semester.name}</CardTitle>
                                            <Badge variant="secondary">Sem {semester.number}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {existingSyllabus ? (
                                            <>
                                                {/* Existing Syllabus */}
                                                <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-md">
                                                    <FileText className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {existingSyllabus.fileName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(existingSyllabus.uploadedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => window.open(existingSyllabus.fileUrl, "_blank")}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1"
                                                        disabled={isUploadingThis}
                                                        onClick={() => {
                                                            const input = document.createElement("input")
                                                            input.type = "file"
                                                            input.accept = "application/pdf"
                                                            input.onchange = (e) => {
                                                                const file = (e.target as HTMLInputElement).files?.[0]
                                                                handleFileSelect(semester.id, file || null)
                                                            }
                                                            input.click()
                                                        }}
                                                    >
                                                        {isUploadingThis ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Replace className="h-4 w-4 mr-1" />
                                                                Replace
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setDeleteDialog({ open: true, syllabus: existingSyllabus })}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* No Syllabus */}
                                                <div className="py-6 text-center">
                                                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        No syllabus uploaded
                                                    </p>
                                                    <Button
                                                        size="sm"
                                                        disabled={isUploadingThis}
                                                        onClick={() => {
                                                            const input = document.createElement("input")
                                                            input.type = "file"
                                                            input.accept = "application/pdf"
                                                            input.onchange = (e) => {
                                                                const file = (e.target as HTMLInputElement).files?.[0]
                                                                handleFileSelect(semester.id, file || null)
                                                            }
                                                            input.click()
                                                        }}
                                                    >
                                                        {isUploadingThis ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                Upload PDF
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </main>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, syllabus: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Delete Syllabus?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the syllabus file:
                            <br />
                            <span className="font-medium text-foreground">
                                {deleteDialog.syllabus?.fileName}
                            </span>
                            <br />
                            <br />
                            Students and faculty will no longer be able to access this syllabus. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete Syllabus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
