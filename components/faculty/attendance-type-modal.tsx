"use client"

// ============================================================================
// CAMPUSTRACK - ATTENDANCE TYPE SELECTION MODAL
// First step in redesigned Faculty attendance flow
// ============================================================================

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCheck, Users } from "lucide-react"

interface AttendanceTypeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectRegular: () => void
    onSelectMDC: () => void
}

export function AttendanceTypeModal({
    open,
    onOpenChange,
    onSelectRegular,
    onSelectMDC,
}: AttendanceTypeModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Select Attendance Type</DialogTitle>
                    <DialogDescription>
                        Choose the type of attendance you want to mark for your classes
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Regular Attendance */}
                    <Card
                        className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary"
                        onClick={onSelectRegular}
                    >
                        <CardHeader className="space-y-4">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <ClipboardCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Regular Attendance</CardTitle>
                                <CardDescription className="mt-2">
                                    Mark attendance for your scheduled classes based on the timetable
                                </CardDescription>
                            </div>
                            <Button className="w-full" variant="default">
                                Select Regular
                            </Button>
                        </CardHeader>
                    </Card>

                    {/* MDC Attendance */}
                    <Card
                        className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary"
                        onClick={onSelectMDC}
                    >
                        <CardHeader className="space-y-4">
                            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">MDC Attendance</CardTitle>
                                <CardDescription className="mt-2">
                                    Mark attendance for Multi-Disciplinary Course classes (Admin configured)
                                </CardDescription>
                            </div>
                            <Button className="w-full" variant="outline">
                                Select MDC
                            </Button>
                        </CardHeader>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
