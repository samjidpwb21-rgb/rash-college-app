/**
 * CSV Export Utility Functions
 * Handles CSV generation and browser downloads
 */

/**
 * Convert array of objects to CSV string
 * @param data - Array of objects to convert
 * @param headers - Array of header strings
 * @returns CSV formatted string
 */
export function generateCSV(
    data: Record<string, any>[],
    headers: string[]
): string {
    if (data.length === 0) {
        return headers.join(",")
    }

    // Create header row
    const headerRow = headers.join(",")

    // Create data rows
    const dataRows = data.map(row => {
        return headers.map(header => {
            const value = row[header]

            // Handle null/undefined
            if (value === null || value === undefined) {
                return ""
            }

            // Convert to string and escape quotes
            const stringValue = String(value)

            // If value contains comma, newline, or quotes, wrap in quotes and escape internal quotes
            if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`
            }

            return stringValue
        }).join(",")
    })

    return [headerRow, ...dataRows].join("\n")
}

/**
 * Trigger browser download of CSV content
 * @param csvContent - CSV string content
 * @param filename - Name of file to download
 */
export function downloadCSV(csvContent: string, filename: string): void {
    // Add BOM for Excel compatibility with UTF-8
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })

    // Create download link
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)
}

/**
 * Combined helper: generate and download CSV
 * @param data - Array of objects to export
 * @param headers - Array of header strings (keys to extract from objects)
 * @param filename - Name of file to download
 */
export function exportToCSV(
    data: Record<string, any>[],
    headers: string[],
    filename: string
): void {
    const csv = generateCSV(data, headers)
    downloadCSV(csv, filename)
}

/**
 * Generate timestamp-based filename
 * @param prefix - File prefix (e.g., "users-export")
 * @returns Filename with timestamp
 */
export function getTimestampedFilename(prefix: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    return `${prefix}-${timestamp}.csv`
}
