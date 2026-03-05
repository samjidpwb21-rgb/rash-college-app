"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { getDayColor } from "@/lib/chart-colors"
import { CustomBarTooltip } from "@/lib/custom-bar-tooltip"

interface AttendanceByDayChartProps {
    data: Array<{ day: string; rate: number }>
}

export default function AttendanceByDayChart({ data }: AttendanceByDayChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No daily data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip content={<CustomBarTooltip colorKey="day" />} />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]} name="Attendance %">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getDayColor(entry.day)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
