/**
 * Chart Color Configuration for CampusTrack
 * Provides consistent, professional colors for bar charts across all dashboards
 */

// Department color mapping
export const DEPARTMENT_COLORS: Record<string, string> = {
    CS: "#3B82F6", // Blue - Computer Science
    EE: "#10B981", // Green - Electrical Engineering
    ME: "#F59E0B", // Amber - Mechanical Engineering
    CE: "#8B5CF6", // Violet - Civil Engineering
    MBA: "#EC4899", // Rose - MBA
    PHY: "#06B6D4", // Cyan - Physics
    Mathematics: "#A855F7", // Purple - Mathematics
}

// Subject color mapping (for student dashboard)
export const SUBJECT_COLORS: Record<string, string> = {
    CS101: "#3B82F6", // Blue
    MATH201: "#10B981", // Green
    PHY101: "#F59E0B", // Amber
    ENG102: "#8B5CF6", // Violet
    DB301: "#EC4899", // Rose
}

// Day of week color mapping
export const DAY_COLORS: Record<string, string> = {
    Monday: "#3B82F6", // Blue
    Tuesday: "#10B981", // Green
    Wednesday: "#F59E0B", // Amber
    Thursday: "#8B5CF6", // Violet
    Friday: "#EC4899", // Rose
}

// Full department names to short codes mapping
export const DEPARTMENT_NAME_TO_CODE: Record<string, string> = {
    "Computer Science": "CS",
    "Electrical Eng.": "EE",
    "Mechanical Eng.": "ME",
    "Civil Eng.": "CE",
    MBA: "MBA",
    Mathematics: "Mathematics",
}

// Fallback color for unknown categories
const FALLBACK_COLOR = "#71717A" // Neutral gray

/**
 * Get color for a department by code or name
 */
export function getDepartmentColor(deptKey: string): string {
    // Try direct lookup
    if (DEPARTMENT_COLORS[deptKey]) {
        return DEPARTMENT_COLORS[deptKey]
    }

    // Try mapping from full name to code
    const code = DEPARTMENT_NAME_TO_CODE[deptKey]
    if (code && DEPARTMENT_COLORS[code]) {
        return DEPARTMENT_COLORS[code]
    }

    return FALLBACK_COLOR
}

/**
 * Get color for a subject by code
 */
export function getSubjectColor(subjectKey: string): string {
    return SUBJECT_COLORS[subjectKey] || FALLBACK_COLOR
}

/**
 * Get color for a day of the week
 */
export function getDayColor(day: string): string {
    return DAY_COLORS[day] || FALLBACK_COLOR
}

/**
 * Get color by generic key - tries all color maps
 */
export function getBarColor(key: string): string {
    return (
        DEPARTMENT_COLORS[key] ||
        SUBJECT_COLORS[key] ||
        DAY_COLORS[key] ||
        FALLBACK_COLOR
    )
}
