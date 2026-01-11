"use client"

// ============================================================================
// CAMPUSTRACK - REGULAR ATTENDANCE PERIODS VIEW
// Shows today's periods for faculty with time-window validation
// ============================================================================

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, MapPin, BookOpen, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isWithinPeriodWindow, getPeriodTimeDisplay } from "@/lib/period-times"

interface TodayClass {
    period: number
    time: string
    subjectId: string
    subjectCode: string
    subjectName: string
    room: string | null
    studentCount: number
    attendanceMarked: boolean
    semester: number
}

interface RegularAttendancePeriodsProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    todayClasses: TodayClass[]
    onSelectPeriod: (period: TodayClass) => void
}

// Time window validation now uses centralized period-times utility
// Automatically handles different Friday schedule

export function RegularAttendancePeriods({
    open,
    onOpenChange,
    todayClasses,
    onSelectPeriod,
}: RegularAttendancePeriodsProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Regular Attendance - Today's Classes</DialogTitle>
                    <DialogDescription>
                        Select a period to mark attendance. Marking is allowed only during the period's time window.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {todayClasses.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                No classes scheduled for today. Please check your timetable or contact the admin.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {todayClasses.map((cls) => {
                                // Get current day of week (1=Monday, 5=Friday)
                                const today = new Date().getDay()
                                const dayOfWeek = today === 0 ? 7 : today // Convert Sunday=0 to 7
                                const timeWindow = isWithinPeriodWindow(dayOfWeek, cls.period)

                                return (
                                    <Card
                                        key={`${cls.subjectId}-${cls.period}`}
                                        className={`relative ${timeWindow.allowed
                                            ? "border-primary/50 bg-primary/5"
                                            : "opacity-70"
                                            }`}
                                    >
                                        <CardContent className="p-5">
                                            {/* Period Badge */}
                                            <div className="flex items-start justify-between mb-3">
                                                <Badge className="text-base px-3 py-1">
                                                    Period {cls.period}
                                                </Badge>
                                                {cls.attendanceMarked && (
                                                    <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500/30">
                                                        ✓ Marked
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Subject Info */}
                                            <div className="mb-3">
                                                <h4 className="font-semibold text-lg text-foreground">
                                                    {cls.subjectName}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {cls.subjectCode}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        Semester {cls.semester}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{cls.time}</span>
                                                </div>
                                                {cls.room && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{cls.room}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    <span>{cls.studentCount} students</span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <Button
                                                className="w-full"
                                                variant={timeWindow.allowed ? "default" : "outline"}
                                                disabled={!timeWindow.allowed}
                                                onClick={() => onSelectPeriod(cls)}
                                            >
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                {timeWindow.message}
                                            </Button>

                                            {!timeWindow.allowed && (
                                                <p className="text-xs text-muted-foreground text-center mt-2">
                                                    {timeWindow.message}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}

                    {/* Info Note */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            <strong>Note:</strong> Attendance can be marked only during the period's time window.
                            For past dates, use the date picker in the attendance sheet.
                        </AlertDescription>
                    </Alert>
                </div>
            </DialogContent>
        </Dialog>
    )
}
