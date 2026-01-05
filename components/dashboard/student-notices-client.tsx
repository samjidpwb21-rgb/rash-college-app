"use client"

// ============================================================================
// CAMPUSTRACK - STUDENT NOTICES CLIENT COMPONENT
// ============================================================================

import { useState } from "react"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { format } from "date-fns"
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

interface StudentNoticesClientProps {
    notices: NoticeData[]
    user: {
        name: string
        departmentName: string
    }
}

export function StudentNoticesClient({ notices, user }: StudentNoticesClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedNotice, setSelectedNotice] = useState<NoticeData | null>(null)

    const categories = ["All", "Academic", "Exam", "Event", "General"]

    const filteredNotices = notices.filter((notice) => {
        const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notice.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || selectedCategory === "All" || notice.type === selectedCategory.toLowerCase()
        return matchesSearch && matchesCategory
    })

    const getBadgeVariant = (type: string) => {
        const normalizedType = type.toUpperCase()
        switch (normalizedType) {
            case "EXAM": return "destructive"
            case "ACADEMIC": return "default"
            case "EVENT": return "secondary"
            default: return "outline"
        }
    }

    const handleNoticeClick = (notice: NoticeData) => {
        setSelectedNotice(notice)
        setIsModalOpen(true)
    }

    const headerUser = {
        name: user.name,
        email: "",
        role: user.departmentName,
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="student" />

            <MobileSidebar role="student" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title="Digital Notice Board" user={headerUser} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-6 space-y-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Campus Notices</h2>
                            <p className="text-slate-300">Latest updates from around the campus</p>
                        </div>
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

                    {/* Notices Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredNotices.length > 0 ? (
                            filteredNotices.map((notice) => (
                                <Card
                                    key={notice.id}
                                    className={`hover:shadow-md transition-shadow cursor-pointer ${getNoticeCardColor(notice.id)}`}
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
                                </Card>
                            ))
                        ) : (
                            <Card className="col-span-full">
                                <CardContent className="p-12 text-center">
                                    <p className="text-muted-foreground">No notices found matching your criteria.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

            {/* Notice Detail Modal */}
            <NoticeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                notice={selectedNotice ? {
                    title: selectedNotice.title,
                    content: selectedNotice.description,
                    type: selectedNotice.type,
                    isImportant: selectedNotice.isImportant,
                    imageUrl: selectedNotice.imageUrl,
                    department: selectedNotice.department,
                    postedBy: selectedNotice.postedBy,
                    date: selectedNotice.date
                } : null}
            />
        </div>
    )
}
