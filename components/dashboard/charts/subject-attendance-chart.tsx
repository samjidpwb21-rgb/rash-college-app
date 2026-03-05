"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { getSubjectColor } from "@/lib/chart-colors"
import { CustomBarTooltip } from "@/lib/custom-bar-tooltip"

interface SubjectAttendanceChartProps {
    data: Array<{
        subject: string
        present: number
        absent: number
    }>
}

export default function SubjectAttendanceChart({ data }: SubjectAttendanceChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No attendance data yet
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="subject" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomBarTooltip colorKey="subject" />} />
                <Bar dataKey="present" radius={[8, 8, 0, 0]} name="Present %">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getSubjectColor(entry.subject)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
