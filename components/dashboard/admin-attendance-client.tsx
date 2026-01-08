"use client"

import { useState } from "react"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts"
import { Download, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Clock, Filter, AlertCircle } from "lucide-react"
import { getDepartmentColor } from "@/lib/chart-colors"
import { CustomBarTooltip } from "@/lib/custom-bar-tooltip"

interface AttendanceOverviewClientProps {
    stats: {
        overallAttendance: number
        classesToday: number
        atRiskStudents: number
        perfectAttendance: number
        trend: number
    } | null
    departmentAttendance: Array<{ dept: string; attendance: number }>
    weeklyTrend: Array<{ week: string; attendance: number }>
    lowAttendanceStudents: Array<{
        id: string
        name: string
        department: string
        attendance: number
        course: string
    }>
    recentRecords: Array<{
        date: string
        course: string
        section: string
        present: number
        absent: number
        total: number
        faculty: string
    }>
}

export function AttendanceOverviewClient({
    stats,
    departmentAttendance,
    weeklyTrend,
    lowAttendanceStudents,
    recentRecords
}: AttendanceOverviewClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState("all")
    const [selectedDate, setSelectedDate] = useState("")

    const user = {
        name: "Admin User",
        email: "admin@university.edu",
        role: "System Administrator",
    }

    const hasData = stats !== null && (departmentAttendance.length > 0 || weeklyTrend.length > 0)

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />
            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />

            <div className="lg:ml-64">
                <DashboardHeader title="Attendance Overview" user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Overall Attendance</p>
                                        <p className="text-3xl font-bold text-foreground">
                                            {stats ? `${stats.overallAttendance}%` : "N/A"}
                                        </p>
                                    </div>
                                    {stats && stats.trend !== 0 && (
                                        <div className={`flex items-center gap-1 ${stats.trend > 0 ? "text-accent" : "text-destructive"}`}>
                                            {stats.trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            <span className="text-sm font-medium">{stats.trend > 0 ? "+" : ""}{stats.trend}%</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Classes Today</p>
                                        <p className="text-3xl font-bold text-foreground">{stats?.classesToday ?? 0}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">At-Risk Students</p>
                                        <p className="text-3xl font-bold text-foreground">{stats?.atRiskStudents ?? 0}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <span className="text-sm font-medium">{"<75%"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Perfect Attendance</p>
                                        <p className="text-3xl font-bold text-foreground">{stats?.perfectAttendance ?? 0}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-accent/50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {!hasData && (
                        <Card>
                            <CardContent className="p-12">
                                <div className="flex flex-col items-center justify-center text-center space-y-3">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold text-foreground">No Attendance Data Available</h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        No attendance records have been marked yet. Once faculty start marking attendance, data will appear here.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {hasData && (
                        <Tabs defaultValue="overview" className="space-y-6">
                            <TabsList>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="records">Recent Records</TabsTrigger>
                                <TabsTrigger value="alerts">Low Attendance</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Department-wise Attendance</CardTitle>
                                            <CardDescription>Average attendance by department</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {departmentAttendance.length > 0 ? (
                                                <div className="h-72">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={departmentAttendance}>
                                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                                            <XAxis dataKey="dept" className="text-xs" />
                                                            <YAxis className="text-xs" domain={[0, 100]} />
                                                            <Tooltip content={<CustomBarTooltip colorKey="dept" />} />
                                                            <Bar dataKey="attendance" radius={[8, 8, 0, 0]} name="Attendance %">
                                                                {departmentAttendance.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={getDepartmentColor(entry.dept)} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="h-72 flex items-center justify-center text-muted-foreground">
                                                    <p>No department data available</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Weekly Trend</CardTitle>
                                            <CardDescription>Institution-wide attendance over weeks</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {weeklyTrend.length > 0 ? (
                                                <div className="h-72">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={weeklyTrend}>
                                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                                            <XAxis dataKey="week" className="text-xs" />
                                                            <YAxis className="text-xs" domain={[0, 100]} />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: "hsl(var(--card))",
                                                                    border: "1px solid hsl(var(--border))",
                                                                    borderRadius: "8px",
                                                                }}
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="attendance"
                                                                stroke="hsl(var(--primary))"
                                                                strokeWidth={2}
                                                                dot={{ fill: "hsl(var(--primary))" }}
                                                                name="Attendance %"
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="h-72 flex items-center justify-center text-muted-foreground">
                                                    <p>No weekly trend data available</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="records">
                                <Card>
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle>Recent Attendance Records</CardTitle>
                                                <CardDescription>Latest attendance entries</CardDescription>
                                            </div>
                                            <div className="flex gap-3">
                                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                                    <SelectTrigger className="w-40">
                                                        <Filter className="h-4 w-4 mr-2" />
                                                        <SelectValue placeholder="Department" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Depts</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="date"
                                                    value={selectedDate}
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                    className="w-40"
                                                />
                                                <Button variant="outline">
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {recentRecords.length > 0 ? (
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full">
                                                    <thead className="bg-muted/50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Course</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">
                                                                Faculty
                                                            </th>
                                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Present</th>
                                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Absent</th>
                                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Rate</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {recentRecords.map((record, index) => {
                                                            const rate = Math.round((record.present / record.total) * 100)
                                                            return (
                                                                <tr key={index} className="hover:bg-muted/30 transition-colors">
                                                                    <td className="px-4 py-3 text-sm text-foreground">{record.date}</td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-foreground text-sm">{record.course}</span>
                                                                            <Badge variant="outline">{record.section}</Badge>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                                                                        {record.faculty}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <Badge className="bg-accent/20 text-accent">{record.present}</Badge>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <Badge variant="destructive">{record.absent}</Badge>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <Badge variant={rate >= 85 ? "default" : rate >= 75 ? "secondary" : "destructive"}>
                                                                            {rate}%
                                                                        </Badge>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center text-muted-foreground">
                                                <p>No recent records available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="alerts">
                                <Card>
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                                    Low Attendance Alerts
                                                </CardTitle>
                                                <CardDescription>Students below 75% attendance threshold</CardDescription>
                                            </div>
                                            <Button variant="outline">
                                                <Download className="h-4 w-4 mr-2" />
                                                Export List
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {lowAttendanceStudents.length > 0 ? (
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full">
                                                    <thead className="bg-muted/50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Student</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">
                                                                Department
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">
                                                                Course
                                                            </th>
                                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                                                                Attendance
                                                            </th>
                                                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {lowAttendanceStudents.map((student) => (
                                                            <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <div>
                                                                        <p className="font-medium text-foreground text-sm">{student.name}</p>
                                                                        <p className="text-xs text-muted-foreground">{student.id}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                                                                    {student.department}
                                                                </td>
                                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                                    <Badge variant="outline">{student.course}</Badge>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <Badge variant="destructive">{student.attendance}%</Badge>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <Button variant="outline" size="sm">
                                                                        Notify
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center space-y-2">
                                                <CheckCircle className="h-12 w-12 text-accent mx-auto" />
                                                <p className="text-foreground font-medium">No Students At Risk</p>
                                                <p className="text-sm text-muted-foreground">All students are maintaining good attendance (≥75%)</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </main>
            </div>
        </div>
    )
}
