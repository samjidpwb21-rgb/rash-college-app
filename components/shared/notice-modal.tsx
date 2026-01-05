"use client"

// ============================================================================
// CAMPUSTRACK - SHARED NOTICE MODAL COMPONENT
// ============================================================================
// Displays full notice details when clicking a notice card
// Used across Admin, Faculty, and Student portals

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface NoticeModalProps {
    isOpen: boolean
    onClose: () => void
    notice: {
        title: string
        content: string
        type: string
        isImportant: boolean
        imageUrl?: string | null
        department?: { name: string } | null
        postedBy: string
        date: Date
    } | null
}

export function NoticeModal({ isOpen, onClose, notice }: NoticeModalProps) {
    if (!notice) return null

    const getBadgeVariant = (type: string) => {
        const normalizedType = type.toUpperCase()
        switch (normalizedType) {
            case "EXAM": return "destructive"
            case "ACADEMIC": return "default"
            case "EVENT": return "secondary"
            default: return "outline"
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{notice.title}</DialogTitle>

                    {/* Badges */}
                    <div className="flex gap-2 flex-wrap mt-2">
                        {notice.isImportant && (
                            <Badge variant="destructive">Important</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                            {notice.department ? notice.department.name : "All Departments"}
                        </Badge>
                        <Badge variant={getBadgeVariant(notice.type)} className="text-xs">
                            {notice.type}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Full-size Image */}
                    {notice.imageUrl && (
                        <div className="w-full">
                            <img
                                src={notice.imageUrl}
                                alt="Notice image"
                                className="w-full h-auto rounded-lg object-contain max-h-96"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="prose prose-sm max-w-none">
                        <p className="text-base text-foreground whitespace-pre-wrap">{notice.content}</p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
                        <span>Posted by {notice.postedBy}</span>
                        <span>•</span>
                        <span>{format(new Date(notice.date), "MMMM d, yyyy")}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
