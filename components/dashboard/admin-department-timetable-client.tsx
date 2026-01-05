"use client"

// ============================================================================
// CAMPUSTRACK - ADMIN DEPARTMENT TIMETABLE CLIENT COMPONENT
// Semester selector + timetable grid with CRUD operations
// ============================================================================

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { getDepartmentSemesterTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry, getDepartmentSubjects, getDepartmentFaculty } from "@/actions/admin/timetable"

interface TimetableEntry {
    id: string
    dayOfWeek: number
    period: number
    room?: string
    subjectColor: string  // Persistent color from server
    subject: {
        id: string
        name: string
        code: string
    }
    faculty: {
        id: string
        user: {
            name: string
        }
    }
}

interface AdminDepartmentTimetableClientProps {
    department: {
        id: string
        name: string
        code: string
    }
    semesters: Array<{
        id: string
        number: number
        name: string
        academicYearId: string
    }>
    currentAcademicYear: {
        id: string
        year: number
    } | null
    user: {
        name: string
        email: string
        role: string
    }
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const PERIODS = [1, 2, 3, 4, 5]

export function AdminDepartmentTimetableClient({
    department,
    semesters,
    currentAcademicYear,
    user,
}: AdminDepartmentTimetableClientProps) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { toast } = useToast()
    const [selectedSemester, setSelectedSemester] = useState<string>(semesters[0]?.id || "")
    const [timetable, setTimetable] = useState<TimetableEntry[]>([])
    const [subjects, setSubjects] = useState<any[]>([])
    const [faculty, setFaculty] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ day: number; period: number } | null>(null)
    const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null)
    const [entryToDelete, setEntryToDelete] = useState<TimetableEntry | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        subjectId: "",
        facultyId: "",
        room: "",
    })

    // Load timetable when semester changes
    useEffect(() => {
        if (selectedSemester && currentAcademicYear) {
            loadTimetable()
            loadSubjects()
            loadFaculty()
        }
    }, [selectedSemester])

    const loadTimetable = async () => {
        setIsLoading(true)
        try {
            const result = await getDepartmentSemesterTimetable(department.id, selectedSemester)
            if (result.success && result.data) {
                // Colors are now server-provided and persistent
                setTimetable(result.data)
            } else {
                toast({
                    title: "Error",
                    description: !result.success ? result.error : "Failed to load timetable",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Load timetable error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadSubjects = async () => {
        const result = await getDepartmentSubjects(department.id, selectedSemester)
        if (result.success && result.data) {
            setSubjects(result.data)
        }
    }

    const loadFaculty = async () => {
        const result = await getDepartmentFaculty(department.id)
        if (result.success && result.data) {
            setFaculty(result.data)
        }
    }



    const getTimetableEntry = (day: number, period: number): TimetableEntry | undefined => {
        return timetable.find(entry => entry.dayOfWeek === day && entry.period === period)
    }

    const handleAddPeriod = (day: number, period: number) => {
        setSelectedSlot({ day, period })
        setSelectedEntry(null)
        setFormData({ subjectId: "", facultyId: "", room: "" })
        setIsDialogOpen(true)
    }

    const handleEditPeriod = (entry: TimetableEntry) => {
        setSelectedEntry(entry)
        setSelectedSlot({ day: entry.dayOfWeek, period: entry.period })
        setFormData({
            subjectId: entry.subject.id,
            facultyId: entry.faculty.id,
            room: entry.room || "",
        })
        setIsDialogOpen(true)
    }

    const handleDeletePeriod = (entry: TimetableEntry) => {
        setEntryToDelete(entry)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!entryToDelete) return

        setIsLoading(true)
        setDeleteDialogOpen(false)
        try {
            const result = await deleteTimetableEntry(entryToDelete.id)
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Period deleted successfully",
                })
                await loadTimetable()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete period",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Delete error:", error)
            toast({
                title: "Error",
                description: "Failed to delete period",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
            setEntryToDelete(null)
        }
    }

    const handleSavePeriod = async () => {
        if (!selectedSlot || !currentAcademicYear) return

        if (!formData.subjectId || !formData.facultyId) {
            toast({
                title: "Validation Error",
                description: "Please select both subject and faculty",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)
        try {
            const data = {
                dayOfWeek: selectedSlot.day,
                period: selectedSlot.period,
                subjectId: formData.subjectId,
                facultyId: formData.facultyId,
                room: formData.room,
                departmentId: department.id,
                semesterId: selectedSemester,
                academicYearId: currentAcademicYear.id,
            }

            let result
            if (selectedEntry) {
                result = await updateTimetableEntry(selectedEntry.id, data)
            } else {
                result = await createTimetableEntry(data)
            }

            if (result.success) {
                toast({
                    title: "Success",
                    description: selectedEntry ? "Period updated successfully" : "Period added successfully",
                })
                setIsDialogOpen(false)
                await loadTimetable()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to save period",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Save error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />

            <MobileSidebar role="admin" open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <div className="lg:ml-64">
                <DashboardHeader title={`${department.name} – Timetable Management`} user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-6 space-y-6">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/admin/departments/${department.id}`)}
                        className="mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Department
                    </Button>

                    {/* Semester Selector */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Select Semester</CardTitle>
                                <Badge variant="outline">{department.code}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                <SelectTrigger className="w-full md:w-[300px]">
                                    <SelectValue placeholder="Select semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {semesters.map((semester) => (
                                        <SelectItem key={semester.id} value={semester.id}>
                                            {semester.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Timetable Grid */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Timetable - {semesters.find(s => s.id === selectedSemester)?.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading && !timetable.length ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="border border-border bg-muted p-3 text-left font-semibold">
                                                    Day / Period
                                                </th>
                                                {PERIODS.map((period) => (
                                                    <th
                                                        key={period}
                                                        className="border border-border bg-muted p-3 text-center font-semibold"
                                                    >
                                                        Period {period}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {DAYS.map((day, dayIndex) => (
                                                <tr key={day}>
                                                    <td className="border border-border bg-muted p-3 font-semibold">
                                                        {day}
                                                    </td>
                                                    {PERIODS.map((period) => {
                                                        const entry = getTimetableEntry(dayIndex + 1, period)
                                                        return (
                                                            <td
                                                                key={period}
                                                                className="border border-border p-2 align-top"
                                                            >
                                                                {entry ? (
                                                                    <div
                                                                        className={`rounded-md p-3 min-h-[100px] ${entry.subjectColor}`}
                                                                    >
                                                                        <div className="flex items-start justify-between mb-2">
                                                                            <div className="font-semibold text-sm">
                                                                                {entry.subject.name}
                                                                            </div>
                                                                            <div className="flex gap-1">
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-6 w-6 p-0"
                                                                                    onClick={() => handleEditPeriod(entry)}
                                                                                >
                                                                                    <Edit className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-6 w-6 p-0"
                                                                                    onClick={() => handleDeletePeriod(entry)}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-xs space-y-1">
                                                                            <div className="flex items-center gap-1">
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {entry.subject.code}
                                                                                </Badge>
                                                                            </div>
                                                                            <div>{entry.faculty.user.name}</div>
                                                                            {entry.room && <div>📍 {entry.room}</div>}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="min-h-[100px] flex items-center justify-center">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleAddPeriod(dayIndex + 1, period)}
                                                                        >
                                                                            <Plus className="h-4 w-4 mr-1" />
                                                                            Add
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEntry ? "Edit Period" : "Add Period"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedSlot && `${DAYS[(selectedSlot.day - 1)]} - Period ${selectedSlot.period}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="subject">Subject *</Label>
                            <Select
                                value={formData.subjectId}
                                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                            >
                                <SelectTrigger id="subject">
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            {subject.code} - {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="faculty">Faculty *</Label>
                            <Select
                                value={formData.facultyId}
                                onValueChange={(value) => setFormData({ ...formData, facultyId: value })}
                            >
                                <SelectTrigger id="faculty">
                                    <SelectValue placeholder="Select faculty" />
                                </SelectTrigger>
                                <SelectContent>
                                    {faculty.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="room">Room (Optional)</Label>
                            <Input
                                id="room"
                                placeholder="e.g., Room 101, Lab 2"
                                value={formData.room}
                                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSavePeriod} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {selectedEntry ? "Update" : "Add"} Period
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Timetable Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{entryToDelete?.subject.name}</strong> from this slot?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
