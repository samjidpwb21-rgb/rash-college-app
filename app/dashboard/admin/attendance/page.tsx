"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts"
import { Download, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Clock, Filter } from "lucide-react"
import { getDepartmentColor } from "@/lib/chart-colors"
import { CustomBarTooltip } from "@/lib/custom-bar-tooltip"

const departmentAttendance = [
  { dept: "CS", attendance: 89 },
  { dept: "EE", attendance: 85 },
  { dept: "ME", attendance: 82 },
  { dept: "CE", attendance: 88 },
  { dept: "MBA", attendance: 91 },
  { dept: "PHY", attendance: 86 },
]

const weeklyTrend = [
  { week: "Week 1", attendance: 88 },
  { week: "Week 2", attendance: 85 },
  { week: "Week 3", attendance: 87 },
  { week: "Week 4", attendance: 89 },
  { week: "Week 5", attendance: 86 },
]

const lowAttendanceStudents = [
  { id: "CS2021003", name: "Michael Brown", department: "Computer Science", attendance: 68, course: "CS101" },
  { id: "CS2021009", name: "Christopher Lee", department: "Computer Science", attendance: 65, course: "CS101" },
  { id: "ME2021015", name: "Robert Wilson", department: "Mechanical Eng.", attendance: 70, course: "ME101" },
  { id: "EE2021022", name: "Jennifer Martinez", department: "Electrical Eng.", attendance: 72, course: "EE201" },
  { id: "PHY2021008", name: "Daniel Anderson", department: "Physics", attendance: 69, course: "PHY101" },
]

const recentRecords = [
  { date: "2025-01-31", course: "CS101", section: "CS-A", present: 42, absent: 3, total: 45, faculty: "Dr. Wilson" },
  { date: "2025-01-31", course: "DB301", section: "CS-A", present: 44, absent: 1, total: 45, faculty: "Prof. Johnson" },
  { date: "2025-01-31", course: "MATH201", section: "CS-A", present: 38, absent: 7, total: 45, faculty: "Prof. Adams" },
  { date: "2025-01-30", course: "PHY101", section: "CS-A", present: 40, absent: 5, total: 45, faculty: "Dr. Williams" },
  { date: "2025-01-30", course: "ENG102", section: "CS-A", present: 43, absent: 2, total: 45, faculty: "Ms. Davis" },
]

export default function AdminAttendancePage() {
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedDate, setSelectedDate] = useState("")

  const user = {
    name: "Admin User",
    email: "admin@university.edu",
    role: "System Administrator",
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardSidebar role="admin" />

      <div className="lg:ml-64">
        <DashboardHeader title="Attendance Overview" user={user} />

        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Attendance</p>
                    <p className="text-3xl font-bold text-foreground">87%</p>
                  </div>
                  <div className="flex items-center gap-1 text-accent">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+2.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Classes Today</p>
                    <p className="text-3xl font-bold text-foreground">156</p>
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
                    <p className="text-3xl font-bold text-foreground">45</p>
                  </div>
                  <div className="flex items-center gap-1 text-destructive">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-medium">-8</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Perfect Attendance</p>
                    <p className="text-3xl font-bold text-foreground">892</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="records">Recent Records</TabsTrigger>
              <TabsTrigger value="alerts">Low Attendance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Department-wise Attendance</CardTitle>
                    <CardDescription>Average attendance by department</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Trend</CardTitle>
                    <CardDescription>Institution-wide attendance over weeks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyTrend}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="week" className="text-xs" />
                          <YAxis className="text-xs" domain={[70, 100]} />
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
                          <SelectItem value="cs">Computer Science</SelectItem>
                          <SelectItem value="ee">Electrical Eng.</SelectItem>
                          <SelectItem value="me">Mechanical Eng.</SelectItem>
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
