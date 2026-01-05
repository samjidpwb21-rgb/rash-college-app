"use client"

// ============================================================================
// CAMPUSTRACK - ADMIN DEPARTMENT DETAILS CLIENT COMPONENT
// ============================================================================

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    ArrowLeft,
    Users,
    BookOpen,
    GraduationCap,
    Search,
    Mail,
    Network,
} from "lucide-react"

interface DepartmentDetailsProps {
    department: {
        id: string
        name: string
        code: string
        description: string | null
        faculty: Array<{
            id: string
            userId: string
            employeeId: string
            designation: string
            user: {
                id: string
                name: string
                email: string
                isActive: boolean
                deletedAt: Date | null
            }
        }>
        students: Array<{
            id: string
            userId: string
            enrollmentNo: string
            user: {
                id: string
                name: string
                email: string
                isActive: boolean
                deletedAt: Date | null
            }
            semester: {
                number: number
                academicYear: {
                    year: number
                }
            }
        }>
        subjects: Array<{
            id: string
            name: string
            code: string
            credits: number
            type: string
            semester: {
                number: number
            }
        }>
    }
    user: {
        name: string
        email: string
        role: string
    }
}

export function AdminDepartmentDetailsClient({ department, user }: DepartmentDetailsProps) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("students")

    // Calculate counts
    const studentCount = department.students.length
    const facultyCount = department.faculty.length
    const courseCount = department.subjects.length

    // Filter logic
    const filteredStudents = department.students.filter(student =>
        student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredFaculty = department.faculty.filter(faculty =>
        faculty.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.designation.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredCourses = department.subjects.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />

            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title={`${department.name} – Overview`} user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/admin/departments")}
                        className="mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Departments
                    </Button>

                    {/* Department Header */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <CardTitle className="text-2xl">{department.name}</CardTitle>
                                        <Badge variant="outline" className="text-base">{department.code}</Badge>
                                        <Badge className="bg-accent text-accent-foreground">Active</Badge>
                                    </div>
                                    {department.description && (
                                        <CardDescription className="text-base mt-2">
                                            {department.description}
                                        </CardDescription>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Key Metrics - Interactive Cards (Stage 1) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Students Card - Clickable */}
                        <Card
                            className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                            onClick={() => {
                                // Stage 2: Navigate to timetable management
                                router.push(`/dashboard/admin/departments/${department.id}/timetable`)
                            }}
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <GraduationCap className="h-5 w-5 text-accent" />
                                    </div>
                                    Students
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-foreground">{studentCount}</p>
                                <p className="text-sm text-muted-foreground mt-1">Total enrolled</p>
                            </CardContent>
                        </Card>

                        {/* Faculty Card - Clickable */}
                        <Card
                            className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                            onClick={() => {
                                // Stage 3: Navigate to faculty timetable
                                router.push(`/dashboard/admin/departments/${department.id}/faculty-timetable`)
                            }}
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-chart-3" />
                                    </div>
                                    Faculty
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-foreground">{facultyCount}</p>
                                <p className="text-sm text-muted-foreground mt-1">Total assigned</p>
                            </CardContent>
                        </Card>

                        {/* Courses Card - Clickable */}
                        <Card
                            className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                            onClick={() => {
                                // Stage 4: Navigate to syllabus management
                                router.push(`/dashboard/admin/departments/${department.id}/syllabus`)
                            }}
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                                        <BookOpen className="h-5 w-5 text-chart-4" />
                                    </div>
                                    Courses
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-foreground">{courseCount}</p>
                                <p className="text-sm text-muted-foreground mt-1">Total available</p>
                            </CardContent>
                        </Card>

                        {/* MDC Card - Clickable */}
                        <Card
                            className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                            onClick={() => {
                                // Navigate to MDC department selector
                                router.push(`/dashboard/admin/departments/${department.id}/mdc`)
                            }}
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                        <Network className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    MDC
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-foreground">0</p>
                                <p className="text-sm text-muted-foreground mt-1">Multi-Disciplinary Courses</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabbed Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Department Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="students">Students</TabsTrigger>
                                    <TabsTrigger value="faculty">Faculty</TabsTrigger>
                                    <TabsTrigger value="courses">Courses</TabsTrigger>
                                </TabsList>

                                {/* Search Bar */}
                                <div className="mt-4 mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={`Search ${activeTab}...`}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Students Tab */}
                                <TabsContent value="students" className="space-y-4">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Enrollment Number</TableHead>
                                                    <TableHead>Year</TableHead>
                                                    <TableHead>Semester</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredStudents.length > 0 ? (
                                                    filteredStudents.map((student) => (
                                                        <TableRow key={student.id}>
                                                            <TableCell className="font-medium">{student.user.name}</TableCell>
                                                            <TableCell>{student.enrollmentNo}</TableCell>
                                                            <TableCell>{student.semester.academicYear.year}</TableCell>
                                                            <TableCell>{student.semester.number}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="text-muted-foreground">{student.user.email}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={student.user.isActive ? "outline" : "destructive"}>
                                                                    {student.user.deletedAt ? "Suspended" : student.user.isActive ? "Active" : "Inactive"}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                            {department.students.length === 0 ? "No students enrolled in this department" : "No students found"}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Showing {filteredStudents.length} of {department.students.length} students
                                    </p>
                                </TabsContent>

                                {/* Faculty Tab */}
                                <TabsContent value="faculty" className="space-y-4">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Designation</TableHead>
                                                    <TableHead>Employee ID</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredFaculty.length > 0 ? (
                                                    filteredFaculty.map((faculty) => (
                                                        <TableRow key={faculty.id}>
                                                            <TableCell className="font-medium">{faculty.user.name}</TableCell>
                                                            <TableCell>{faculty.designation}</TableCell>
                                                            <TableCell>{faculty.employeeId}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="text-muted-foreground">{faculty.user.email}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={faculty.user.isActive ? "outline" : "destructive"}>
                                                                    {faculty.user.deletedAt ? "Suspended" : faculty.user.isActive ? "Active" : "Inactive"}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                            {department.faculty.length === 0 ? "No faculty assigned to this department" : "No faculty found"}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Showing {filteredFaculty.length} of {department.faculty.length} faculty members
                                    </p>
                                </TabsContent>

                                {/* Courses Tab */}
                                <TabsContent value="courses" className="space-y-4">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Course Name</TableHead>
                                                    <TableHead>Course Code</TableHead>
                                                    <TableHead>Semester</TableHead>
                                                    <TableHead>Credits</TableHead>
                                                    <TableHead>Type</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredCourses.length > 0 ? (
                                                    filteredCourses.map((course) => (
                                                        <TableRow key={course.id}>
                                                            <TableCell className="font-medium">{course.name}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{course.code}</Badge>
                                                            </TableCell>
                                                            <TableCell>Semester {course.semester.number}</TableCell>
                                                            <TableCell>{course.credits}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={course.type === "THEORY" ? "default" : "secondary"}>
                                                                    {course.type}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                            {department.subjects.length === 0 ? "No courses available in this department" : "No courses found"}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Showing {filteredCourses.length} of {department.subjects.length} courses
                                    </p>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
