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
import { Download, TrendingUp, TrendingDown } from "lucide-react"
import { getDepartmentColor, getDayColor } from "@/lib/chart-colors"
import { CustomBarTooltip } from "@/lib/custom-bar-tooltip"

const semesterTrend = [
  { month: "Aug", attendance: 92, target: 85 },
  { month: "Sep", attendance: 88, target: 85 },
  { month: "Oct", attendance: 85, target: 85 },
  { month: "Nov", attendance: 87, target: 85 },
  { month: "Dec", attendance: 83, target: 85 },
  { month: "Jan", attendance: 89, target: 85 },
]

const departmentComparison = [
  { name: "Computer Science", current: 89, previous: 85 },
  { name: "Electrical Eng.", current: 85, previous: 88 },
  { name: "Mechanical Eng.", current: 82, previous: 80 },
  { name: "Civil Eng.", current: 88, previous: 86 },
  { name: "MBA", current: 91, previous: 89 },
  { name: "Mathematics", current: 86, previous: 84 },
]

const attendanceByDay = [
  { day: "Monday", rate: 92 },
  { day: "Tuesday", rate: 89 },
  { day: "Wednesday", rate: 88 },
  { day: "Thursday", rate: 85 },
  { day: "Friday", rate: 78 },
]

const attendanceDistribution = [
  { range: "90-100%", count: 2450, color: "#22c55e" },
  { range: "75-89%", count: 1820, color: "#3b82f6" },
  { range: "60-74%", count: 890, color: "#f59e0b" },
  { range: "Below 60%", count: 260, color: "#ef4444" },
]

const hourlyPattern = [
  { hour: "8AM", attendance: 75 },
  { hour: "9AM", attendance: 92 },
  { hour: "10AM", attendance: 95 },
  { hour: "11AM", attendance: 88 },
  { hour: "12PM", attendance: 72 },
  { hour: "1PM", attendance: 68 },
  { hour: "2PM", attendance: 85 },
  { hour: "3PM", attendance: 88 },
  { hour: "4PM", attendance: 82 },
  { hour: "5PM", attendance: 75 },
]

export default function AnalyticsPage() {
  const user = {
    name: "Admin User",
    email: "admin@university.edu",
    role: "System Administrator",
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
              <Button variant="outline">
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
                    <p className="text-3xl font-bold text-foreground">87.2%</p>
                  </div>
                  <div className="flex items-center gap-1 text-accent">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+2.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Peak Attendance Day</p>
                    <p className="text-3xl font-bold text-foreground">Monday</p>
                  </div>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">At-Risk Students</p>
                    <p className="text-3xl font-bold text-foreground">260</p>
                  </div>
                  <div className="flex items-center gap-1 text-destructive">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-medium">-15</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Classes Tracked</p>
                    <p className="text-3xl font-bold text-foreground">1,247</p>
                  </div>
                  <span className="text-sm text-muted-foreground">This month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Semester Trend vs Target</CardTitle>
                <CardDescription>Monthly attendance rate compared to 85% target</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={semesterTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" domain={[70, 100]} />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Distribution by Attendance</CardTitle>
                <CardDescription>Number of students in each attendance bracket</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Comparison</CardTitle>
                <CardDescription>Current vs previous semester</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Attendance Pattern</CardTitle>
                <CardDescription>Average attendance by time of day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyPattern}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="hour" className="text-xs" />
                      <YAxis className="text-xs" domain={[60, 100]} />
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
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance by Day of Week</CardTitle>
              <CardDescription>Average attendance rate for each day</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
