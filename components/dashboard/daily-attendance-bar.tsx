"use client"

// ============================================================================
// DAILY ATTENDANCE STATUS BAR
// ============================================================================
// Displays 5-block status bar showing today's attendance
// Green = Present, Red = Absent, Grey = Not Marked

import { AttendanceStatus } from "@prisma/client"

interface DailyAttendanceBlock {
    period: number
    status: AttendanceStatus | "NOT_MARKED"
    facultyName: string | null
}

interface DailyAttendanceBarProps {
    blocks: DailyAttendanceBlock[]
}

export function DailyAttendanceBar({ blocks }: DailyAttendanceBarProps) {
    return (
        <div className="w-full px-4 sm:px-6">
            <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Today's Attendance</h3>
                    <span className="text-xs text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                    {blocks.map((block) => {
                        const isPresent = block.status === "PRESENT"
                        const isAbsent = block.status === "ABSENT"
                        const isNotMarked = block.status === "NOT_MARKED"

                        return (
                            <div
                                key={block.period}
                                className={`
                                    relative rounded-md p-3 text-center transition-all
                                    ${isPresent ? "bg-green-500/20 border-2 border-green-500" : ""}
                                    ${isAbsent ? "bg-red-500/20 border-2 border-red-500" : ""}
                                    ${isNotMarked ? "bg-muted border-2 border-border" : ""}
                                `}
                            >
                                {/* Period number */}
                                <div className="text-xs font-bold text-foreground mb-1">
                                    Period {block.period}
                                </div>

                                {/* Status indicator */}
                                <div className={`
                                    text-[10px] font-semibold mb-1
                                    ${isPresent ? "text-green-600 dark:text-green-400" : ""}
                                    ${isAbsent ? "text-red-600 dark:text-red-400" : ""}
                                    ${isNotMarked ? "text-muted-foreground" : ""}
                                `}>
                                    {isPresent && "✓ Present"}
                                    {isAbsent && "✗ Absent"}
                                    {isNotMarked && "Not Marked"}
                                </div>

                                {/* Faculty name (only if marked) */}
                                {block.facultyName && (
                                    <div className="text-[9px] text-muted-foreground truncate mt-1">
                                        by {block.facultyName}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
