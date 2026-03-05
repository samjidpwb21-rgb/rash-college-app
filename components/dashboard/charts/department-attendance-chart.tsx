"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { getDepartmentColor } from "@/lib/chart-colors"
import { CustomBarTooltip } from "@/lib/custom-bar-tooltip"

interface DepartmentAttendanceChartProps {
    data: Array<{ dept: string; attendance: number }>
}

export default function DepartmentAttendanceChart({ data }: DepartmentAttendanceChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No department data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="dept" className="text-xs" />
                <YAxis className="text-xs" domain={[0, 100]} />
                <Tooltip content={<CustomBarTooltip colorKey="dept" />} />
                <Bar dataKey="attendance" radius={[8, 8, 0, 0]} name="Attendance %">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getDepartmentColor(entry.dept)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
