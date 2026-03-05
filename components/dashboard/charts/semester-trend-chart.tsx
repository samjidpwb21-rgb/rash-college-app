"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts"

interface SemesterTrendChartProps {
    data: Array<{ month: string; attendance: number; target: number }>
}

export default function SemesterTrendChart({ data }: SemesterTrendChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No trend data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                    }}
                    formatter={(value: any) => [`${value}%`]}
                />
                <Legend />
                <ReferenceLine
                    y={85}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="5 5"
                    label={{ value: "Target 85%", position: "right", fontSize: 10, fill: "hsl(var(--destructive))" }}
                />
                <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    name="Actual %"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
