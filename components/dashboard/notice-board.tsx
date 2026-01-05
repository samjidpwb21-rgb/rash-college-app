
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Clock, Info } from "lucide-react"
import { getNoticesPageData, type NoticeData } from "@/actions/shared/pages"
import { formatDistanceToNow } from "date-fns"

interface NoticeCardProps {
    notice: NoticeData
}

function NoticeCard({ notice }: NoticeCardProps) {
    const getBadgeVariant = (isImportant: boolean) => {
        return isImportant ? "destructive" : "default"
    }

    return (
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 w-full">
                    <div className="flex justify-between items-center w-full">
                        <Badge variant={getBadgeVariant(notice.isImportant)} className="capitalize">
                            {notice.isImportant ? "Important" : notice.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notice.date), { addSuffix: true })}
                        </span>
                    </div>
                    <h4 className="font-semibold leading-none tracking-tight">{notice.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notice.description}</p>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-medium text-primary">Posted by {notice.postedBy}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function NoticeBoard() {
    const [notices, setNotices] = useState<NoticeData[]>([])

    useEffect(() => {
        async function loadNotices() {
            try {
                const result = await getNoticesPageData()
                if (result.success) {
                    setNotices(result.data)
                }
            } catch (error) {
                console.error("Failed to load notices:", error)
            }
        }

        loadNotices()
    }, [])

    return (
        <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1.5">
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        Digital Notice Board
                    </CardTitle>
                    <CardDescription>Latest updates from around the campus</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {notices.map((notice) => (
                        <NoticeCard key={notice.id} notice={notice} />
                    ))}
                    {notices.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                            <Info className="w-8 h-8 opacity-50" />
                            <p>No new notices at this time.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
