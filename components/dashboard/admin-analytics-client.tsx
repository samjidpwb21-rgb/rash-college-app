"use client"

import { useState, useTransition } from "react"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import dynamic from "next/dynamic"
const SemesterTrendChart = dynamic(() => import("@/components/dashboard/charts/semester-trend-chart"), { ssr: false })
const StudentDistributionChart = dynamic(() => import("@/components/dashboard/charts/student-distribution-chart"), { ssr: false })
const DepartmentComparisonChart = dynamic(() => import("@/components/dashboard/charts/department-comparison-chart"), { ssr: false })
const HourlyPatternChart = dynamic(() => import("@/components/dashboard/charts/hourly-pattern-chart"), { ssr: false })
const AttendanceByDayChart = dynamic(() => import("@/components/dashboard/charts/attendance-by-day-chart"), { ssr: false })
import { Download, TrendingUp, TrendingDown, AlertCircle, Loader2 } from "lucide-react"
import { generateCSV, downloadCSV } from "@/lib/csv-export"
import {
    getAnalyticsStats,
    getSemesterTrendData,
    getDepartmentComparisonData,
    getAttendanceByDayData,
    getAttendanceDistributionData,
    getHourlyPatternData,
    type TimePeriod
} from "@/actions/admin/analytics-data"

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

const PERIOD_LABELS: Record<TimePeriod, string> = {
    week: "This Week",
    month: "This Month",
    semester: "This Semester",
    year: "This Year"
}

export function AnalyticsClient({
    stats: initialStats,
    semesterTrend: initialSemesterTrend,
    departmentComparison: initialDepartmentComparison,
    attendanceByDay: initialAttendanceByDay,
    attendanceDistribution: initialAttendanceDistribution,
    hourlyPattern: initialHourlyPattern
}: AnalyticsClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("semester")
    const [isPending, startTransition] = useTransition()

    // Live state — starts with server-fetched data, updates on filter change
    const [stats, setStats] = useState(initialStats)
    const [semesterTrend, setSemesterTrend] = useState(initialSemesterTrend)
    const [departmentComparison, setDepartmentComparison] = useState(initialDepartmentComparison)
    const [attendanceByDay, setAttendanceByDay] = useState(initialAttendanceByDay)
    const [attendanceDistribution, setAttendanceDistribution] = useState(initialAttendanceDistribution)
    const [hourlyPattern, setHourlyPattern] = useState(initialHourlyPattern)

    const user = {
        name: "Admin User",
        email: "admin@university.edu",
        role: "System Administrator",
    }

    const hasData = stats !== null && (semesterTrend.length > 0 || departmentComparison.length > 0 || attendanceByDay.length > 0)

    // Called when the user changes the time period
    function handlePeriodChange(value: string) {
        const period = value as TimePeriod
        setSelectedPeriod(period)

        startTransition(async () => {
            const [statsRes, trendRes, deptRes, dayRes, distRes, hourlyRes] = await Promise.all([
                getAnalyticsStats(period),
                getSemesterTrendData(period),
                getDepartmentComparisonData(period),
                getAttendanceByDayData(period),
                getAttendanceDistributionData(period),
                getHourlyPatternData(period)
            ])

            if (statsRes.success) setStats(statsRes.data)
            if (trendRes.success) setSemesterTrend(trendRes.data)
            if (deptRes.success) setDepartmentComparison(deptRes.data)
            if (dayRes.success) setAttendanceByDay(dayRes.data)
            if (distRes.success) setAttendanceDistribution(distRes.data)
            if (hourlyRes.success) setHourlyPattern(hourlyRes.data)
        })
    }

    const handleExport = () => {
        const exportData = []

        if (stats) {
            exportData.push(
                { Section: "Summary", Metric: "Period", Value: PERIOD_LABELS[selectedPeriod] },
                { Section: "Summary", Metric: "Average Attendance", Value: `${stats.averageAttendance}%` },
                { Section: "Summary", Metric: "Peak Day", Value: stats.peakDay },
                { Section: "Summary", Metric: "Peak Day Rate", Value: `${stats.peakDayRate}%` },
                { Section: "Summary", Metric: "At-Risk Students", Value: stats.atRiskStudents.toString() },
                { Section: "Summary", Metric: "Classes Tracked", Value: stats.classesTracked.toString() },
                { Section: "Summary", Metric: "Trend", Value: `${stats.trend > 0 ? "+" : ""}${stats.trend}%` },
                { Section: "", Metric: "", Value: "" }
            )
        }

        if (semesterTrend.length > 0) {
            exportData.push({ Section: "Trend", Metric: "Bucket", Value: "Attendance %" })
            semesterTrend.forEach(item => {
                exportData.push({ Section: "Trend", Metric: item.month, Value: `${item.attendance}%` })
            })
            exportData.push({ Section: "", Metric: "", Value: "" })
        }

        if (departmentComparison.length > 0) {
            exportData.push({ Section: "Department", Metric: "Name", Value: "Current %" })
            departmentComparison.forEach(item => {
                exportData.push({ Section: "Department", Metric: item.name, Value: `${item.current}%` })
            })
            exportData.push({ Section: "", Metric: "", Value: "" })
        }

        if (attendanceByDay.length > 0) {
            exportData.push({ Section: "By Day", Metric: "Day", Value: "Rate %" })
            attendanceByDay.forEach(item => {
                exportData.push({ Section: "By Day", Metric: item.day, Value: `${item.rate}%` })
            })
            exportData.push({ Section: "", Metric: "", Value: "" })
        }

        if (attendanceDistribution.length > 0) {
            exportData.push({ Section: "Distribution", Metric: "Range", Value: "Count" })
            attendanceDistribution.forEach(item => {
                exportData.push({ Section: "Distribution", Metric: item.range, Value: item.count.toString() })
            })
            exportData.push({ Section: "", Metric: "", Value: "" })
        }

        if (hourlyPattern.length > 0) {
            exportData.push({ Section: "Hourly", Metric: "Period", Value: "Attendance %" })
            hourlyPattern.forEach(item => {
                exportData.push({ Section: "Hourly", Metric: item.hour, Value: `${item.attendance}%` })
            })
        }

        const headers = exportData.length > 0 ? Object.keys(exportData[0]) : ["Section", "Metric", "Value"]
        const csv = generateCSV(exportData, headers)
        const timestamp = new Date().toISOString().split('T')[0]
        downloadCSV(csv, `analytics-${selectedPeriod}-${timestamp}.csv`)
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardSidebar role="admin" />
            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />

            <div className="lg:ml-64">
                <DashboardHeader title="Analytics & Reports" user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 sm:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Attendance Analytics</h2>
                            <p className="text-muted-foreground">
                                Comprehensive insights for{" "}
                                <span className="font-semibold text-foreground">{PERIOD_LABELS[selectedPeriod]}</span>
                            </p>
                        </div>
                        <div className="flex gap-3 items-center">
                            {isPending && (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading...
                                </div>
                            )}
                            <Select value={selectedPeriod} onValueChange={handlePeriodChange} disabled={isPending}>
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
                            <Button variant="outline" onClick={handleExport} disabled={isPending}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 transition-opacity duration-200 ${isPending ? "opacity-50" : "opacity-100"}`}>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Average Attendance</p>
                                        <p className="text-3xl font-bold text-foreground">{stats ? `${stats.averageAttendance}%` : "N/A"}</p>
                                    </div>
                                    {stats && stats.trend !== 0 && (
                                        <div className={`flex items-center gap-1 ${stats.trend > 0 ? "text-green-500" : "text-destructive"}`}>
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
                                    <span className="text-sm text-muted-foreground">{PERIOD_LABELS[selectedPeriod]}</span>
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
                                        No attendance records found for {PERIOD_LABELS[selectedPeriod]}. Try selecting a longer time period.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {hasData && (
                        <div className={`space-y-6 transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Attendance Trend vs Target</CardTitle>
                                        <CardDescription>
                                            {selectedPeriod === "week" ? "Daily" : selectedPeriod === "month" ? "Weekly" : "Monthly"} attendance rate compared to 85% target
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {semesterTrend.length > 0 ? (
                                            <div className="h-72">
                                                <SemesterTrendChart data={semesterTrend} />
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
                                                    <StudentDistributionChart data={attendanceDistribution} />
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
                                        <CardDescription>Current vs previous period attendance rates</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {departmentComparison.length > 0 ? (
                                            <div className="h-72">
                                                <DepartmentComparisonChart data={departmentComparison} />
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
                                                <HourlyPatternChart data={hourlyPattern} />
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
                                    <CardDescription>Average attendance rate for each weekday</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {attendanceByDay.length > 0 ? (
                                        <div className="h-72">
                                            <AttendanceByDayChart data={attendanceByDay} />
                                        </div>
                                    ) : (
                                        <div className="h-72 flex items-center justify-center text-muted-foreground">
                                            <p>No daily data available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
