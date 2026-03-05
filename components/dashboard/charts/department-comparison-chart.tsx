"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { getDepartmentColor } from "@/lib/chart-colors"

interface DepartmentComparisonChartProps {
    data: Array<{ name: string; current: number; previous: number }>
}

export default function DepartmentComparisonChart({ data }: DepartmentComparisonChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No department data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                    }}
                />
                <Bar dataKey="current" radius={[0, 8, 8, 0]} name="Current">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getDepartmentColor(entry.name)} />
                    ))}
                </Bar>
                <Bar dataKey="previous" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} name="Previous" />
            </BarChart>
        </ResponsiveContainer>
    )
}
