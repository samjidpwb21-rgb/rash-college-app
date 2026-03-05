"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface HourlyPatternChartProps {
    data: Array<{ hour: string; attendance: number }>
}

export default function HourlyPatternChart({ data }: HourlyPatternChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No hourly pattern data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))" }}
                    name="Attendance %"
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
