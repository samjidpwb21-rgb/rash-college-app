"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Bell, Check, Filter, Trash, Search, Calendar, FileText, CheckCircle2, UserCheck, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from "@/actions/shared/notifications"
import type { Notification } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import { PushNotificationSettings } from "@/components/notifications/push-notification-settings"

export function NotificationsPage() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<"ALL" | "UNREAD" | "ATTENDANCE" | "NOTICE" | "EVENT">("ALL")

    // Fetch notifications
    const loadNotifications = async () => {
        setIsLoading(true)
        try {
            // Fetch more than usual to handle clientside filtering if needed
            // Or we could add filtering to backend
            const result = await getMyNotifications({ limit: 50 })
            if (result.success) {
                setNotifications(result.data)
            } else {
                toast.error("Failed to load notifications")
            }
        } catch (error) {
            console.error(error)
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadNotifications()
    }, [])

    // Actions
    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
            await markAsRead(id)
        } catch {
            toast.error("Failed to mark as read")
        }
    }

    const handleMarkAllRead = async () => {
        try {
            // Optimistic
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            const result = await markAllAsRead()
            if (result.success) {
                toast.success("All marked as read")
            }
        } catch {
            toast.error("Failed to mark all as read")
        }
    }

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        try {
            // Optimistic
            setNotifications(prev => prev.filter(n => n.id !== id))
            await deleteNotification(id)
            toast.success("Notification removed")
        } catch {
            toast.error("Failed to delete notification")
        }
    }

    const handleNotificationClick = (n: Notification) => {
        if (!n.isRead) {
            handleMarkAsRead(n.id)
        }
        if (n.link) {
            router.push(n.link)
        }
    }

    // Filter logic
    const filteredNotifications = notifications.filter(n => {
        if (filter === "ALL") return true
        if (filter === "UNREAD") return !n.isRead
        if (filter === "ATTENDANCE") return n.type === "ATTENDANCE"
        if (filter === "NOTICE") return n.type === "NOTICE"
        if (filter === "EVENT") return n.type === "EVENT"
        return true
    })

    // Group by date logic could go here, but simple list first

    const getIcon = (type: string) => {
        switch (type) {
            case "ATTENDANCE": return <UserCheck className="h-5 w-5 text-blue-500" />
            case "NOTICE": return <FileText className="h-5 w-5 text-amber-500" />
            case "EVENT": return <Calendar className="h-5 w-5 text-purple-500" />
            case "SYSTEM": return <CheckCircle2 className="h-5 w-5 text-green-500" />
            default: return <Bell className="h-5 w-5 text-gray-500" />
        }
    }

    return (
        <div className="container mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Back to Dashboard Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2 text-foreground hover:bg-muted"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">Stay updated with your latest alerts</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                        <Check className="mr-2 h-4 w-4" />
                        Mark all read
                    </Button>
                    <Button variant="outline" size="icon" onClick={loadNotifications}>
                        <Search className="h-4 w-4" /> {/* Actually refresh */}
                    </Button>
                </div>
            </div>

            {/* Push Notification Settings */}
            <PushNotificationSettings />

            <div className="flex flex-col md:flex-row gap-6">

                {/* Filters Sidebar (Mobile: Top bar) */}
                <Card className="w-full md:w-64 h-fit">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-1">
                        <Button
                            variant={filter === "ALL" ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setFilter("ALL")}
                        >
                            <Bell className="mr-2 h-4 w-4" /> All
                            <Badge variant="secondary" className="ml-auto">{notifications.length}</Badge>
                        </Button>
                        <Button
                            variant={filter === "UNREAD" ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setFilter("UNREAD")}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Unread
                            <Badge variant="secondary" className="ml-auto">
                                {notifications.filter(n => !n.isRead).length}
                            </Badge>
                        </Button>
                        <Separator className="my-2" />
                        <Button
                            variant={filter === "ATTENDANCE" ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setFilter("ATTENDANCE")}
                        >
                            <UserCheck className="mr-2 h-4 w-4" /> Attendance
                        </Button>
                        <Button
                            variant={filter === "NOTICE" ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setFilter("NOTICE")}
                        >
                            <FileText className="mr-2 h-4 w-4" /> Notices
                        </Button>
                        <Button
                            variant={filter === "EVENT" ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setFilter("EVENT")}
                        >
                            <Calendar className="mr-2 h-4 w-4" /> Events
                        </Button>
                    </CardContent>
                </Card>

                {/* Notifications List */}
                <Card className="flex-1 min-h-[500px]">
                    <CardHeader>
                        <CardTitle>
                            {filter === "ALL" ? "All Notifications" :
                                filter.charAt(0) + filter.slice(1).toLowerCase() + " Notifications"}
                        </CardTitle>
                        <CardDescription>
                            {filteredNotifications.length} result{filteredNotifications.length !== 1 ? 's' : ''} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <p>Loading notifications...</p>
                            </div>
                        ) : filteredNotifications.length > 0 ? (
                            <div className="space-y-4">
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${!notification.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className={`p-2 rounded-full shrink-0 ${!notification.isRead ? 'bg-background shadow-sm' : 'bg-muted'}`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notification.isRead && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-primary"
                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={(e) => handleDelete(notification.id, e)}
                                                title="Delete"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Bell className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-lg font-medium">No notifications</p>
                                <p className="text-sm">You're all caught up!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
