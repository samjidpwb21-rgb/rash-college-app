"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from "recharts"
import { Download, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { getDepartmentColor, getDayColor } from "@/lib/chart-colors"
import { CustomBarTooltip } from "@/lib/custom-bar-tooltip"
import { generateCSV, downloadCSV } from "@/lib/csv-export"

interface AnalyticsClientProps {
    stats: {
        averageAttendance: number
        peakDay: string
        peakDayRate: number
        atRiskStudents: number
        classesTracked: number
        trend: number
    } | null
    semesterTrend: Array<{ month: string; attendance: number; target: number }>
    departmentComparison: Array<{ name: string; current: number; previous: number }>
    attendanceByDay: Array<{ day: string; rate: number }>
    attendanceDistribution: Array<{ range: string; count: number; color: string }>
    hourlyPattern: Array<{ hour: string; attendance: number }>
}

export function AnalyticsClient({
    stats,
    semesterTrend,
    departmentComparison,
    attendanceByDay,
    attendanceDistribution,
    hourlyPattern
}: AnalyticsClientProps) {
    const user = {
        name: "Admin User",
        email: "admin@university.edu",
        role: "System Administrator",
    }

    const hasData = stats !== null && (semesterTrend.length > 0 || departmentComparison.length > 0 || attendanceByDay.length > 0)

    const handleExport = () => {
        // Prepare export data
        const exportData = []

        // Add summary stats
        if (stats) {
            exportData.push(
                { Section: "Summary", Metric: "Average Attendance", Value: `${stats.averageAttendance}%` },
                { Section: "Summary", Metric: "Peak Day", Value: stats.peakDay },
                { Section: "Summary", Metric: "Peak Day Rate", Value: `${stats.peakDayRate}%` },
                { Section: "Summary", Metric: "At-Risk Students", Value: stats.atRiskStudents.toString() },
                { Section: "Summary", Metric: "Classes Tracked", Value: stats.classesTracked.toString() },
                { Section: "Summary", Metric: "Trend", Value: `${stats.trend > 0 ? "+" : ""}${stats.trend}%` },
                { Section: "", Metric: "", Value: "" } // Empty row
            )
        }

        // Add semester trend data
        if (semesterTrend.length > 0) {
            exportData.push({ Section: "Semester Trend", Metric: "Month", Value: "Attendance %" })
            semesterTrend.forEach(item => {
                exportData.push({
                    Section: "Semester Trend",
                    Metric: item.month,
                    Value: `${item.attendance}%`
                })
            })
            exportData.push({ Section: "", Metric: "", Value: "" }) // Empty row
        }

        // Add department comparison data
        if (departmentComparison.length > 0) {
            exportData.push({ Section: "Department Comparison", Metric: "Department", Value: "Current %" })
            departmentComparison.forEach(item => {
                exportData.push({
                    Section: "Department Comparison",
                    Metric: item.name,
                    Value: `${item.current}%`
                })
            })
            exportData.push({ Section: "", Metric: "", Value: "" }) // Empty row
        }

        // Add attendance by day data
        if (attendanceByDay.length > 0) {
            exportData.push({ Section: "Attendance by Day", Metric: "Day", Value: "Rate %" })
            attendanceByDay.forEach(item => {
                exportData.push({
                    Section: "Attendance by Day",
                    Metric: item.day,
                    Value: `${item.rate}%`
                })
            })
            exportData.push({ Section: "", Metric: "", Value: "" }) // Empty row
        }

        // Add attendance distribution data
        if (attendanceDistribution.length > 0) {
            exportData.push({ Section: "Student Distribution", Metric: "Range", Value: "Count" })
            attendanceDistribution.forEach(item => {
                exportData.push({
                    Section: "Student Distribution",
                    Metric: item.range,
                    Value: item.count.toString()
                })
            })
            exportData.push({ Section: "", Metric: "", Value: "" }) // Empty row
        }

        // Add hourly pattern data
        if (hourlyPattern.length > 0) {
            exportData.push({ Section: "Hourly Pattern", Metric: "Hour", Value: "Attendance %" })
            hourlyPattern.forEach(item => {
                exportData.push({
                    Section: "Hourly Pattern",
                    Metric: item.hour,
                    Value: `${item.attendance}%`
                })
            })
        }

        // Generate and download CSV
        const csv = generateCSV(exportData)
        const timestamp = new Date().toISOString().split('T')[0]
        downloadCSV(csv, `attendance-analytics-${timestamp}.csv`)
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />

            <div className="lg:ml-64">
                <DashboardHeader title="Analytics & Reports" user={user} />

                <main className="p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Attendance Analytics</h2>
                            <p className="text-muted-foreground">Comprehensive insights and trends</p>
                        </div>
                        <div className="flex gap-3">
                            <Select defaultValue="semester">
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Time Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                    <SelectItem value="semester">This Semester</SelectItem>
                                    <SelectItem value="year">This Year</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={handleExport}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Average Attendance</p>
                                        <p className="text-3xl font-bold text-foreground">{stats ? `${stats.averageAttendance}%` : "N/A"}</p>
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
                                        <p className="text-sm text-muted-foreground">Peak Attendance Day</p>
                                        <p className="text-3xl font-bold text-foreground">{stats?.peakDay ?? "N/A"}</p>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{stats?.peakDayRate ?? 0}%</span>
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
                                        <span className="text-sm font-medium">{"<60%"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Classes Tracked</p>
                                        <p className="text-3xl font-bold text-foreground">{stats?.classesTracked ?? 0}</p>
                                    </div>
                                    <span className="text-sm text-muted-foreground">This month</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {!hasData && (
                        <Card>
                            <CardContent className="p-12">
                                <div className="flex flex-col items-center justify-center text-center space-y-3">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold text-foreground">No Analytics Data Available</h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        No attendance records found. Analytics will be generated once faculty start marking attendance.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {hasData && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Semester Trend vs Target</CardTitle>
                                        <CardDescription>Monthly attendance rate compared to 85% target</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {semesterTrend.length > 0 ? (
                                            <div className="h-72">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={semesterTrend}>
                                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                                        <XAxis dataKey="month" className="text-xs" />
                                                        <YAxis className="text-xs" domain={[0, 100]} />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: "hsl(var(--card))",
                                                                border: "1px solid hsl(var(--border))",
                                                                borderRadius: "8px",
                                                            }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="attendance"
                                                            stroke="hsl(var(--primary))"
                                                            fill="hsl(var(--primary))"
                                                            fillOpacity={0.2}
                                                            name="Actual"
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="target"
                                                            stroke="hsl(var(--destructive))"
                                                            strokeDasharray="5 5"
                                                            dot={false}
                                                            name="Target"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="h-72 flex items-center justify-center text-muted-foreground">
                                                <p>No trend data available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Student Distribution by Attendance</CardTitle>
                                        <CardDescription>Number of students in each attendance bracket</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {attendanceDistribution.length > 0 && attendanceDistribution.some(d => d.count > 0) ? (
                                            <>
                                                <div className="h-52">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={attendanceDistribution}
                                                                cx="50%"
                                                                cy="50%"
                                                                outerRadius={80}
                                                                dataKey="count"
                                                                label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}
                                                                labelLine={false}
                                                            >
                                                                {attendanceDistribution.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mt-4">
                                                    {attendanceDistribution.map((item) => (
                                                        <div key={item.range} className="flex items-center gap-2">
                                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                            <span className="text-xs text-muted-foreground">
                                                                {item.range}: {item.count}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-52 flex items-center justify-center text-muted-foreground">
                                                <p>No distribution data available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Department Comparison</CardTitle>
                                        <CardDescription>Current vs previous period</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {departmentComparison.length > 0 ? (
                                            <div className="h-72">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={departmentComparison} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                                        <XAxis type="number" domain={[0, 100]} className="text-xs" />
                                                        <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: "hsl(var(--card))",
                                                                border: "1px solid hsl(var(--border))",
                                                                borderRadius: "8px",
                                                            }}
                                                        />
                                                        <Bar dataKey="current" radius={[0, 8, 8, 0]} name="Current">
                                                            {departmentComparison.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={getDepartmentColor(entry.name)} />
                                                            ))}
                                                        </Bar>
                                                        <Bar dataKey="previous" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} name="Previous" />
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
                                        <CardTitle>Hourly Attendance Pattern</CardTitle>
                                        <CardDescription>Average attendance by time of day</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {hourlyPattern.length > 0 ? (
                                            <div className="h-72">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={hourlyPattern}>
                                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                                        <XAxis dataKey="hour" className="text-xs" />
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
                                                            stroke="hsl(var(--accent))"
                                                            strokeWidth={2}
                                                            dot={{ fill: "hsl(var(--accent))" }}
                                                            name="Attendance %"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="h-72 flex items-center justify-center text-muted-foreground">
                                                <p>No hourly pattern data available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Attendance by Day of Week</CardTitle>
                                    <CardDescription>Average attendance rate for each day</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {attendanceByDay.length > 0 ? (
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={attendanceByDay}>
                                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                                    <XAxis dataKey="day" className="text-xs" />
                                                    <YAxis className="text-xs" domain={[0, 100]} />
                                                    <Tooltip content={<CustomBarTooltip colorKey="day" />} />
                                                    <Bar dataKey="rate" radius={[8, 8, 0, 0]} name="Attendance %">
                                                        {attendanceByDay.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={getDayColor(entry.day)} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-72 flex items-center justify-center text-muted-foreground">
                                            <p>No daily data available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}
