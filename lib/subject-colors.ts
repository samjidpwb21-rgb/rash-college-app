// ============================================================================
// CAMPUSTRACK - SUBJECT COLOR REGISTRY
// Persistent color system for timetable UI consistency
// ============================================================================

/**
 * Central color palette for subject cards in timetable views
 * - Minimum 20 distinct colors to avoid collisions
 * - Soft backgrounds with clear borders for accessibility
 * - Consistent across Admin, Faculty, and Student timetables
 */
export const SUBJECT_COLORS = [
    "bg-blue-100 border-l-4 border-blue-400 text-blue-900",
    "bg-purple-100 border-l-4 border-purple-400 text-purple-900",
    "bg-green-100 border-l-4 border-green-400 text-green-900",
    "bg-yellow-100 border-l-4 border-yellow-400 text-yellow-900",
    "bg-pink-100 border-l-4 border-pink-400 text-pink-900",
    "bg-cyan-100 border-l-4 border-cyan-400 text-cyan-900",
    "bg-orange-100 border-l-4 border-orange-400 text-orange-900",
    "bg-red-100 border-l-4 border-red-400 text-red-900",
    "bg-indigo-100 border-l-4 border-indigo-400 text-indigo-900",
    "bg-teal-100 border-l-4 border-teal-400 text-teal-900",
    "bg-lime-100 border-l-4 border-lime-400 text-lime-900",
    "bg-amber-100 border-l-4 border-amber-400 text-amber-900",
    "bg-emerald-100 border-l-4 border-emerald-400 text-emerald-900",
    "bg-violet-100 border-l-4 border-violet-400 text-violet-900",
    "bg-fuchsia-100 border-l-4 border-fuchsia-400 text-fuchsia-900",
    "bg-rose-100 border-l-4 border-rose-400 text-rose-900",
    "bg-sky-100 border-l-4 border-sky-400 text-sky-900",
    "bg-slate-100 border-l-4 border-slate-400 text-slate-900",
    "bg-zinc-100 border-l-4 border-zinc-400 text-zinc-900",
    "bg-stone-100 border-l-4 border-stone-400 text-stone-900",
] as const

/**
 * Get color classes for a given color index
 * @param colorIndex - Index from SubjectColorMap.colorIndex
 * @returns Tailwind CSS classes for background, border, and text
 */
export function getSubjectColor(colorIndex: number): string {
    // Wrap around if index exceeds array length
    return SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length]
}

/**
 * Default fallback color for subjects without assigned colors
 */
export const DEFAULT_SUBJECT_COLOR = "bg-gray-100 border-l-4 border-gray-400 text-gray-900"
