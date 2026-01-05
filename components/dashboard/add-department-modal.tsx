"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Plus } from "lucide-react"

export interface Department {
    id: string
    name: string
    code: string
    head: string
    students: number
    faculty: number
    courses: number
    avgAttendance: number
    status: "active" | "inactive"
    description?: string
}

interface AddDepartmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddDepartment: (department: Omit<Department, "id">) => void
}

export function AddDepartmentModal({ open, onOpenChange, onAddDepartment }: AddDepartmentModalProps) {
    const [name, setName] = React.useState("")
    const [code, setCode] = React.useState("")
    const [head, setHead] = React.useState("")
    const [status, setStatus] = React.useState<"active" | "inactive">("active")
    const [description, setDescription] = React.useState("")
    const [facultyCount, setFacultyCount] = React.useState("")
    const [courseCount, setCourseCount] = React.useState("")

    const resetForm = () => {
        setName("")
        setCode("")
        setHead("")
        setStatus("active")
        setDescription("")
        setFacultyCount("")
        setCourseCount("")
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !code || !head) {
            return
        }

        const newDepartment: Omit<Department, "id"> = {
            name,
            code: code.toUpperCase(),
            head,
            status,
            students: 0, // New departments start with 0 students
            faculty: facultyCount ? parseInt(facultyCount) : 0,
            courses: courseCount ? parseInt(courseCount) : 0,
            avgAttendance: 0,
            description: description || undefined,
        }

        onAddDepartment(newDepartment)
        resetForm()
        onOpenChange(false)
    }

    const isFormValid = name && code && head

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Department</DialogTitle>
                    <DialogDescription>
                        Create a new academic department. All fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Department Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Department Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g., Computer Science"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Department Code */}
                    <div className="space-y-2">
                        <Label htmlFor="code">
                            Department Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="code"
                            placeholder="e.g., CS, EE, ME"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            maxLength={10}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Short code used to identify the department (e.g., CS for Computer Science)
                        </p>
                    </div>

                    {/* Head of Department */}
                    <div className="space-y-2">
                        <Label htmlFor="head">
                            Head of Department <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="head"
                            placeholder="e.g., Dr. John Smith"
                            value={head}
                            onChange={(e) => setHead(e.target.value)}
                            required
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status">
                            Status <span className="text-destructive">*</span>
                        </Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as "active" | "inactive")}>
                            <SelectTrigger id="status" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the department..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Optional Counts */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="facultyCount">Initial Faculty Count</Label>
                            <Input
                                id="facultyCount"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={facultyCount}
                                onChange={(e) => setFacultyCount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="courseCount">Initial Course Count</Label>
                            <Input
                                id="courseCount"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={courseCount}
                                onChange={(e) => setCourseCount(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                resetForm()
                                onOpenChange(false)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isFormValid}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Department
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
