// ============================================================================
// CAMPUSTRACK - NOTICE CARD COLORS
// Client-side color utilities for notice card backgrounds
// ============================================================================

/**
 * Generates a consistent pastel color for a notice card based on its ID
 * Uses a hash of the ID to pick from a predefined palette of soft colors
 * 
 * @param noticeId - The unique ID of the notice
 * @returns Tailwind CSS classes for card background
 */
export function getNoticeCardColor(noticeId: string): string {
    // Predefined palette of darker pastel colors with good contrast
    const colorPalettes = [
        "bg-blue-100 border-l-4 border-blue-500",
        "bg-purple-100 border-l-4 border-purple-500",
        "bg-pink-100 border-l-4 border-pink-500",
        "bg-green-100 border-l-4 border-green-500",
        "bg-yellow-100 border-l-4 border-yellow-500",
        "bg-orange-100 border-l-4 border-orange-500",
        "bg-teal-100 border-l-4 border-teal-500",
        "bg-indigo-100 border-l-4 border-indigo-500",
        "bg-cyan-100 border-l-4 border-cyan-500",
        "bg-rose-100 border-l-4 border-rose-500",
        "bg-emerald-100 border-l-4 border-emerald-500",
        "bg-violet-100 border-l-4 border-violet-500",
    ]

    // Simple hash function to convert ID to a number
    let hash = 0
    for (let i = 0; i < noticeId.length; i++) {
        const char = noticeId.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
    }

    // Use absolute value and modulo to get consistent index
    const index = Math.abs(hash) % colorPalettes.length

    return colorPalettes[index]
}
