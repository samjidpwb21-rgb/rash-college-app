import { getBarColor } from "./chart-colors"

/**
 * Custom Tooltip Component for Bar Charts
 * Shows category name, value, and colored indicator
 */
interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{
        value: number
        payload: any
        fill?: string
        name?: string
    }>
    label?: string
    colorKey?: string // Key to use for getting color (e.g., 'dept', 'subject', 'day')
}

export function CustomBarTooltip({
    active,
    payload,
    label,
    colorKey = "dept",
}: CustomTooltipProps) {
    if (active && payload && payload.length) {
        const data = payload[0]
        const categoryKey = data.payload[colorKey] || label
        const color = data.fill || getBarColor(categoryKey)

        return (
            <div
                className="bg-card border border-border rounded-lg p-3 shadow-lg"
                style={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-sm text-foreground">
                        {categoryKey}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {data.name}: {data.value}%
                </p>
            </div>
        )
    }
    return null
}
