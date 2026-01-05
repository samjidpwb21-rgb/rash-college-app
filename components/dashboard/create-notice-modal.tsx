"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText } from "lucide-react"
import { type Notice, type NoticeType } from "@/lib/mock-data"

interface CreateNoticeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreateNotice: (notice: Omit<Notice, "id">) => void
    role: "faculty" | "admin"
    userName: string
}

export function CreateNoticeModal({ open, onOpenChange, onCreateNotice, role, userName }: CreateNoticeModalProps) {
    const [title, setTitle] = React.useState("")
    const [category, setCategory] = React.useState<NoticeType>("general")
    const [content, setContent] = React.useState("")
    const [targetAudience, setTargetAudience] = React.useState<"all" | "students" | "faculty">("all")
    const [expiryDate, setExpiryDate] = React.useState("")
    const [attachmentUrl, setAttachmentUrl] = React.useState("")

    // Role-based category options
    const getCategoryOptions = () => {
        if (role === "faculty") {
            return [
                { value: "academic", label: "Academic" },
                { value: "event", label: "Event" },
            ]
        }
        // Admin can post all types
        return [
            { value: "academic", label: "Academic" },
            { value: "exam", label: "Exam" },
            { value: "event", label: "Event" },
            { value: "general", label: "General" },
        ]
    }

    const resetForm = () => {
        setTitle("")
        setCategory("general")
        setContent("")
        setTargetAudience("all")
        setExpiryDate("")
        setAttachmentUrl("")
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!title || !content) {
            return
        }

        const newNotice: Omit<Notice, "id"> = {
            title,
            description: content,
            type: category,
            postedBy: userName,
            date: new Date(),
        }

        onCreateNotice(newNotice)
        resetForm()
        onOpenChange(false)
    }

    const isFormValid = title.trim() && content.trim()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Notice</DialogTitle>
                    <DialogDescription>
                        Post a new notice to the campus notice board. All fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Notice Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            placeholder="e.g., Mid-Semester Exam Schedule Released"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">
                            Category <span className="text-destructive">*</span>
                        </Label>
                        <Select value={category} onValueChange={(value) => setCategory(value as NoticeType)}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {getCategoryOptions().map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <Label htmlFor="content">
                            Notice Content <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="content"
                            placeholder="Enter the notice details..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            required
                        />
                    </div>

                    {/* Target Audience - Admin only */}
                    {role === "admin" && (
                        <div className="space-y-2">
                            <Label htmlFor="audience">Target Audience</Label>
                            <Select value={targetAudience} onValueChange={(value) => setTargetAudience(value as any)}>
                                <SelectTrigger id="audience">
                                    <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="students">Students</SelectItem>
                                    <SelectItem value="faculty">Faculty</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Expiry Date (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                        <Input
                            id="expiryDate"
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave empty if this notice has no expiration
                        </p>
                    </div>

                    {/* Attachment URL (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="attachment">Attachment / Document URL (optional)</Label>
                        <Input
                            id="attachment"
                            type="url"
                            placeholder="https://example.com/document.pdf"
                            value={attachmentUrl}
                            onChange={(e) => setAttachmentUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Link to a document, PDF, or image related to this notice
                        </p>
                    </div>

                    {/* Posted By Info */}
                    <div className="rounded-lg bg-muted/50 p-3 border">
                        <p className="text-sm text-muted-foreground">
                            This notice will be posted by <span className="font-medium text-foreground">{userName}</span>
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                resetForm()
                                onOpenChange(false)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isFormValid}>
                            <FileText className="h-4 w-4 mr-2" />
                            Post Notice
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
