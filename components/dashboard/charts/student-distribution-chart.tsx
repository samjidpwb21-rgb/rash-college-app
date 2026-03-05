"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

interface StudentDistributionChartProps {
    data: Array<{ range: string; count: number; color: string }>
}

export default function StudentDistributionChart({ data }: StudentDistributionChartProps) {
    if (data.length === 0 || !data.some(d => d.count > 0)) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No distribution data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ range, percent }: any) => `${range} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    )
}
