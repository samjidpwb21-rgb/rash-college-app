"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Search, Download, Mail, Users, AlertTriangle, TrendingUp, TrendingDown, Filter } from "lucide-react"

interface StudentData {
    id: string
    name: string
    email: string
    course: string
    section: string
    attendance: number
    status: "excellent" | "good" | "warning" | "critical"
    enrollmentNo: string
    avatar?: string | null
}

interface FacultyStudentsClientProps {
    initialData: {
        stats: {
            total: number
            atRisk: number
            excellent: number
            avgAttendance: number
        }
        students: StudentData[]
    }
}

const statusColors = {
    excellent: "bg-accent text-accent-foreground",
    good: "bg-primary text-primary-foreground",
    warning: "bg-orange-500 text-white", // Fixed warning color
    critical: "bg-destructive text-destructive-foreground",
}

export function FacultyStudentsClient({ initialData }: FacultyStudentsClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCourse, setSelectedCourse] = useState("all")
    const [selectedSection, setSelectedSection] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")

    // Derive unique courses/sections for filters
    const courses = Array.from(new Set(initialData.students.map(s => s.course)))
    const sections = Array.from(new Set(initialData.students.map(s => s.section)))

    const filteredStudents = initialData.students.filter((student) => {
        const matchesSearch =
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.id.toLowerCase().includes(searchQuery.toLowerCase()) // Fallback to ID
        const matchesCourse = selectedCourse === "all" || student.course === selectedCourse
        const matchesSection = selectedSection === "all" || student.section === selectedSection
        const matchesStatus = selectedStatus === "all" || student.status === selectedStatus
        return matchesSearch && matchesCourse && matchesSection && matchesStatus
    })

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Students</p>
                                <p className="text-2xl font-bold text-foreground">{initialData.stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">At Risk</p>
                                <p className="text-2xl font-bold text-foreground">{initialData.stats.atRisk}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Excellent</p>
                                <p className="text-2xl font-bold text-foreground">{initialData.stats.excellent}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                <TrendingDown className="h-6 w-6 text-chart-3" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                                <p className="text-2xl font-bold text-foreground">{initialData.stats.avgAttendance}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Students List */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Student List</CardTitle>
                            <CardDescription>Manage and view student attendance</CardDescription>
                        </div>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or enrollment no..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                            <SelectTrigger className="w-full sm:w-40">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Section" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Student</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">
                                        Course
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">
                                        Section
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Attendance</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={student.avatar || "/placeholder.svg"} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                            {student.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-foreground text-sm">{student.name}</p>
                                                        <p className="text-xs text-muted-foreground">{student.enrollmentNo}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-foreground hidden md:table-cell">{student.course}</td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                {student.section !== "N/A" && <Badge variant="outline">{student.section}</Badge>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Progress value={student.attendance} className="w-16 h-2" />
                                                    <span className="text-sm font-medium">{student.attendance}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={statusColors[student.status]}>
                                                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm">
                                                    <Mail className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            No students found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Showing {filteredStudents.length} of {initialData.students.length} students
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
