// ============================================================================
// CAMPUSTRACK - GLOBAL PERIOD TIMING CONFIGURATION
// ============================================================================
// Single source of truth for all period slot timings across the college.
// Different schedules for Monday-Thursday vs Friday.
// 
// IMPORTANT: This file is the ONLY place period times should be defined.
// All other files must import from here.

export type DayType = "weekday" | "friday"

export interface PeriodTime {
    start: { h: number; m: number }
    end: { h: number; m: number }
}

export interface PeriodTimings {
    [period: number]: PeriodTime
}

// ============================================================================
// MONDAY–THURSDAY PERIOD TIMINGS
// ============================================================================
// Period 1: 9:20 AM – 10:20 AM
// Period 2: 10:20 AM – 11:20 AM
// (Break: 10 minutes)
// Period 3: 11:30 AM – 12:20 PM
// (Lunch Break: 12:20 PM – 1:30 PM)
// Period 4: 1:30 PM – 2:20 PM
// Period 5: 2:20 PM – 3:20 PM

const WEEKDAY_TIMINGS: PeriodTimings = {
    1: { start: { h: 9, m: 20 }, end: { h: 10, m: 20 } },
    2: { start: { h: 10, m: 20 }, end: { h: 11, m: 20 } },
    3: { start: { h: 11, m: 30 }, end: { h: 12, m: 20 } },
    4: { start: { h: 13, m: 30 }, end: { h: 14, m: 20 } },
    5: { start: { h: 14, m: 20 }, end: { h: 15, m: 20 } },
}

// ============================================================================
// FRIDAY PERIOD TIMINGS
// ============================================================================
// Period 1: 9:20 AM – 10:20 AM
// Period 2: 10:20 AM – 11:10 AM
// (Interval: 10 minutes)
// Period 3: 11:20 AM – 12:10 PM
// (Lunch Break: 12:10 PM – 1:50 PM)
// Period 4: 1:50 PM – 2:20 PM
// Period 5: 2:20 PM – 3:20 PM

const FRIDAY_TIMINGS: PeriodTimings = {
    1: { start: { h: 9, m: 20 }, end: { h: 10, m: 20 } },
    2: { start: { h: 10, m: 20 }, end: { h: 11, m: 10 } },
    3: { start: { h: 11, m: 20 }, end: { h: 12, m: 10 } },
    4: { start: { h: 13, m: 50 }, end: { h: 14, m: 20 } },
    5: { start: { h: 14, m: 20 }, end: { h: 15, m: 20 } },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines the day type based on dayOfWeek (1=Monday, ..., 5=Friday, 6=Saturday)
 */
export function getDayType(dayOfWeek: number): DayType {
    return dayOfWeek === 5 ? "friday" : "weekday"
}

/**
 * Gets the period timing configuration for a specific day and period
 */
export function getPeriodTiming(dayOfWeek: number, period: number): PeriodTime | null {
    const timings = dayOfWeek === 5 ? FRIDAY_TIMINGS : WEEKDAY_TIMINGS
    return timings[period] || null
}

/**
 * Formats a time object to display string (e.g., "9:20 AM")
 */
function formatTime(time: { h: number; m: number }): string {
    const hour = time.h
    const minute = time.m
    const period = hour >= 12 ? "PM" : "AM"
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const displayMin = minute.toString().padStart(2, "0")
    return `${displayHour}:${displayMin} ${period}`
}

/**
 * Gets the formatted display string for a period (e.g., "9:20 AM – 10:20 AM")
 */
export function getPeriodTimeDisplay(dayOfWeek: number, period: number): string {
    const timing = getPeriodTiming(dayOfWeek, period)
    if (!timing) {
        return `Period ${period}`
    }
    return `${formatTime(timing.start)} – ${formatTime(timing.end)}`
}

/**
 * Checks if current time is within the attendance marking window for a period.
 * Window opens 15 minutes before period starts and closes 15 minutes after period ends.
 */
export function isWithinPeriodWindow(
    dayOfWeek: number,
    period: number
): { allowed: boolean; message: string } {
    const timing = getPeriodTiming(dayOfWeek, period)
    if (!timing) {
        return { allowed: false, message: "Invalid period" }
    }

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    // Window: 15 minutes before start to 15 minutes after end
    const windowStartMinutes = timing.start.h * 60 + timing.start.m - 15
    const windowEndMinutes = timing.end.h * 60 + timing.end.m + 15

    if (currentMinutes < windowStartMinutes) {
        const minutesUntilStart = windowStartMinutes - currentMinutes
        const hoursUntil = Math.floor(minutesUntilStart / 60)
        const minsUntil = minutesUntilStart % 60
        return {
            allowed: false,
            message: hoursUntil > 0 ? `Opens in ${hoursUntil}h ${minsUntil}m` : `Opens in ${minsUntil}m`,
        }
    }

    if (currentMinutes > windowEndMinutes) {
        return { allowed: false, message: "Time window closed" }
    }

    return { allowed: true, message: "Mark now" }
}

/**
 * Gets all period display strings for a given day
 */
export function getAllPeriodTimesForDay(dayOfWeek: number): string[] {
    return [1, 2, 3, 4, 5].map((period) => getPeriodTimeDisplay(dayOfWeek, period))
}

/**
 * Gets the period number from the current time (returns 0 if no active period)
 */
export function getCurrentPeriod(dayOfWeek: number): number {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    for (let period = 1; period <= 5; period++) {
        const timing = getPeriodTiming(dayOfWeek, period)
        if (timing) {
            const startMinutes = timing.start.h * 60 + timing.start.m
            const endMinutes = timing.end.h * 60 + timing.end.m
            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                return period
            }
        }
    }
    return 0
}
