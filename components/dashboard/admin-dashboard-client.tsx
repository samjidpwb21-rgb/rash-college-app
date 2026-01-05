"use client"

// ============================================================================
// CAMPUSTRACK - ADMIN DASHBOARD CLIENT COMPONENT
// ============================================================================
// Client wrapper for interactive elements

import { useState } from "react"
import Link from "next/link"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Users, BookOpen, Building2, GraduationCap, ArrowRight, Bell, Calendar } from "lucide-react"

interface AdminDashboardProps {
    data: {
        user: {
            name: string
            email: string
            role: string
        }
        stats: {
            totalStudents: number
            totalFaculty: number
            totalSubjects: number
            totalDepartments: number
        }
        userDistribution: Array<{
            name: string
            value: number
            color: string
        }>
        recentNotices: Array<{
            id: string
            title: string
            publishedAt: Date
            isImportant: boolean
        }>
        upcomingEvents: Array<{
            id: string
            title: string
            eventDate: Date
            location: string | null
        }>
    }
}

export function AdminDashboardClient({ data }: AdminDashboardProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const user = data.user

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />
            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />

            <div className="lg:ml-64">
                <DashboardHeader title="Admin Dashboard" user={user} onMenuClick={() => setSidebarOpen(true)} hideSearch={true} />

                <main className="p-4 sm:p-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsCard
                            title="Total Students"
                            value={String(data.stats.totalStudents)}
                            description="Active students"
                            icon={GraduationCap}
                            className="shadow-2xl bg-white border-slate-200"
                        />
                        <StatsCard
                            title="Total Faculty"
                            value={String(data.stats.totalFaculty)}
                            description="Active faculty"
                            icon={Users}
                            className="shadow-2xl bg-white border-slate-200"
                        />
                        <StatsCard
                            title="Subjects"
                            value={String(data.stats.totalSubjects)}
                            description="Total courses"
                            icon={BookOpen}
                            className="shadow-2xl bg-white border-slate-200"
                        />
                        <StatsCard
                            title="Departments"
                            value={String(data.stats.totalDepartments)}
                            description="Academic departments"
                            icon={Building2}
                            className="shadow-2xl bg-white border-slate-200"
                        />
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* User Distribution Chart */}
                        <Card className="shadow-2xl bg-white border-slate-200">
                            <CardHeader>
                                <CardTitle>User Distribution</CardTitle>
                                <CardDescription>Active users by role</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.userDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {data.userDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 mt-4">
                                    {data.userDistribution.map((item) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-sm text-muted-foreground">
                                                {item.name}: {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Notices */}
                        <Card className="shadow-2xl bg-white border-slate-200">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Recent Notices</CardTitle>
                                        <CardDescription>Latest announcements</CardDescription>
                                    </div>
                                    <Link href="/dashboard/admin/notices">
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            View All
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.recentNotices.length > 0 ? (
                                        data.recentNotices.map((notice) => (
                                            <div
                                                key={notice.id}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                            >
                                                <Bell className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-foreground truncate">{notice.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(notice.publishedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {notice.isImportant && (
                                                    <Badge variant="destructive" className="text-xs">Important</Badge>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No notices yet
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upcoming Events */}
                        <Card className="shadow-2xl bg-white border-slate-200">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Upcoming Events</CardTitle>
                                        <CardDescription>Scheduled events</CardDescription>
                                    </div>
                                    <Link href="/dashboard/admin/events">
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            View All
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.upcomingEvents.length > 0 ? (
                                        data.upcomingEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                            >
                                                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-foreground truncate">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(event.eventDate).toLocaleDateString()} • {event.location || "TBA"}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No upcoming events
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card className="shadow-2xl bg-white border-slate-200">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Administrative tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Link href="/dashboard/admin/users">
                                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                                        <Users className="h-5 w-5" />
                                        <span className="text-sm">Manage Users</span>
                                    </Button>
                                </Link>
                                <Link href="/dashboard/admin/departments">
                                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                                        <Building2 className="h-5 w-5" />
                                        <span className="text-sm">Departments</span>
                                    </Button>
                                </Link>
                                <Link href="/dashboard/admin/courses">
                                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        <span className="text-sm">Subjects</span>
                                    </Button>
                                </Link>
                                <Link href="/dashboard/admin/attendance">
                                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                                        <GraduationCap className="h-5 w-5" />
                                        <span className="text-sm">Attendance</span>
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
