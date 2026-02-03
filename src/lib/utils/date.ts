// Date and time utility functions

import { FINANCIAL_TIMEZONE } from '@/lib/constants/financial'

// Default timezone - uses the centralized financial timezone constant
const DEFAULT_TIMEZONE = FINANCIAL_TIMEZONE

/**
 * Get the user's local timezone or fall back to default
 */
export function getLocalTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE
    } catch {
        return DEFAULT_TIMEZONE
    }
}

/**
 * Format date string to readable US format with local timezone
 */
export function formatDate(dateString: string, timezone?: string): string {
    const tz = timezone || getLocalTimezone()
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: tz
    })
}

/**
 * Format date string handling date-only strings (YYYY-MM-DD) as local dates
 * Prevents timezone issues when displaying dates without time components
 */
export function formatDateLocal(dateString: string | null | undefined): string {
    if (!dateString) return ''
    
    // Handle date-only strings (YYYY-MM-DD) as local dates
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number)
        return new Date(year, month - 1, day).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }
    
    // For dates with time components, use the standard formatDate function
    return formatDate(dateString)
}

/**
 * Format date string to include time with local timezone
 */
export function formatDateTime(dateString: string, timezone?: string): string {
    const tz = timezone || getLocalTimezone()
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: tz
    })
}

/**
 * Format time only with local timezone
 */
export function formatTime(dateString: string, timezone?: string): string {
    const tz = timezone || getLocalTimezone()
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: tz
    })
}

/**
 * Get current date/time in local timezone as ISO string
 */
export function getLocalNow(timezone?: string): string {
    const tz = timezone || getLocalTimezone()
    const now = new Date()
    return now.toLocaleString('en-CA', { timeZone: tz }).replace(', ', 'T') + '.000Z'
}

/**
 * Convert UTC date to local timezone date object
 */
export function toLocalDate(dateString: string, timezone?: string): Date {
    const tz = timezone || getLocalTimezone()
    const date = new Date(dateString)
    // Create a new date in the local timezone
    const localString = date.toLocaleString('en-US', { timeZone: tz })
    return new Date(localString)
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
        return 'Just now'
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
    }

    const diffInYears = Math.floor(diffInMonths / 12)
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
}

/**
 * Check if date is within the last N days
 */
export function isWithinDays(dateString: string, days: number): boolean {
    const date = new Date(dateString)
    const now = new Date()
    const diffInTime = now.getTime() - date.getTime()
    const diffInDays = diffInTime / (1000 * 3600 * 24)
    return diffInDays <= days
}

/**
 * Get start and end of current month
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start, end }
}

/**
 * Format date to YYYY-MM-DD string in local timezone (date only, no time)
 * Used for filtering expenses by date
 * Handles date-only strings (YYYY-MM-DD) by parsing as local dates to prevent timezone shift
 */
export function formatDateForFilter(date: Date | string, timezone?: string): string {
    const tz = timezone || getLocalTimezone()
    
    // Handle date-only strings (YYYY-MM-DD) - parse as local date to prevent timezone shift
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in YYYY-MM-DD format, return as-is
        return date
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Format to local date string (YYYY-MM-DD)
    const localDateString = dateObj.toLocaleDateString('en-CA', { timeZone: tz })
    return localDateString
}

/**
 * Get start of day in local timezone as YYYY-MM-DD
 * Used for date filtering (ensures we filter by date only, not time)
 */
export function getStartOfDayLocal(dateString: string, timezone?: string): string {
    const tz = timezone || getLocalTimezone()
    const date = new Date(dateString)
    
    // Get date components in local timezone
    const localDateString = date.toLocaleDateString('en-CA', { timeZone: tz })
    return localDateString
}

/**
 * Get end of day in local timezone as YYYY-MM-DD
 * Used for date filtering (ensures we filter by date only, not time)
 */
export function getEndOfDayLocal(dateString: string, timezone?: string): string {
    const tz = timezone || getLocalTimezone()
    const date = new Date(dateString)
    
    // Get date components in local timezone (same as start since we're filtering by date only)
    const localDateString = date.toLocaleDateString('en-CA', { timeZone: tz })
    return localDateString
}

/**
 * Get current date as YYYY-MM-DD string in local timezone
 * Used for default date inputs and filters
 */
export function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Parse a YYYY-MM-DD string into a Date object in local timezone
 * Prevents timezone shifts when working with date-only strings
 */
export function parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
}

/**
 * Format a date-only string (YYYY-MM-DD) for display without timezone conversion
 * Parses as local date to prevent day shift issues
 */
export function formatDateOnly(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A'
    const datePart = dateString.substring(0, 10)
    const date = new Date(datePart + 'T00:00:00') // Parse as local date
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}

/**
 * Get the UTC offset in minutes for Toronto timezone on a given date.
 * Accounts for DST transitions (EST = UTC-5, EDT = UTC-4).
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Offset in minutes (negative for behind UTC, e.g., -300 for EST)
 */
function getTorontoOffsetMinutes(dateStr: string): number {
    // Use noon UTC to avoid DST transition edge cases
    const date = new Date(dateStr + 'T12:00:00Z')
    
    // Get the date formatted in Toronto timezone with offset info
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: FINANCIAL_TIMEZONE,
        timeZoneName: 'shortOffset'
    })
    const parts = formatter.formatToParts(date)
    const offsetPart = parts.find(p => p.type === 'timeZoneName')
    
    if (offsetPart?.value) {
        // Parse offset from string like "GMT-5" or "GMT-4"
        const match = offsetPart.value.match(/GMT([+-])(\d+)(?::(\d+))?/)
        if (match) {
            const sign = match[1] === '+' ? 1 : -1
            const hours = parseInt(match[2], 10)
            const minutes = match[3] ? parseInt(match[3], 10) : 0
            return sign * (hours * 60 + minutes)
        }
    }
    
    // Default to EST (-5 hours = -300 minutes) if parsing fails
    return -300
}

/**
 * Get start and end of a calendar day in Toronto timezone, returned as UTC ISO strings.
 * Works identically in browser and server environments.
 * 
 * This function is critical for financial reports to ensure that:
 * - A work order completed at 11:30 PM EST appears on the correct Toronto date
 * - Date boundaries are consistent between DEV and PROD environments
 * - UTC rollover issues are prevented (late EST activity showing as next day)
 * 
 * @param dateStr - Date string in YYYY-MM-DD format (interpreted as Toronto calendar date)
 * @returns UTC ISO timestamp bounds for the Toronto calendar day
 * 
 * @example
 * // For 2026-01-30 during EST (UTC-5):
 * // Start: 2026-01-30T05:00:00.000Z (midnight Toronto = 5 AM UTC)
 * // End: 2026-01-31T04:59:59.999Z (11:59:59 PM Toronto)
 * getTorontoDayBoundsUTC('2026-01-30')
 */
export function getTorontoDayBoundsUTC(dateStr: string): { 
    start: string
    end: string 
} {
    // Validate input format
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD.`)
    }
    
    // Get the Toronto UTC offset for this date (handles DST)
    const offsetMinutes = getTorontoOffsetMinutes(dateStr)
    
    // Parse the date components
    const [year, month, day] = dateStr.split('-').map(Number)
    
    // Create midnight Toronto time as UTC
    // If Toronto is UTC-5, midnight Toronto = 5:00 AM UTC
    // offsetMinutes is negative (e.g., -300), so we subtract it to get UTC
    const midnightTorontoAsUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    midnightTorontoAsUTC.setUTCMinutes(midnightTorontoAsUTC.getUTCMinutes() - offsetMinutes)
    
    // End of day is 23:59:59.999 Toronto time
    const endOfDayTorontoAsUTC = new Date(midnightTorontoAsUTC.getTime() + (24 * 60 * 60 * 1000) - 1)
    
    return {
        start: midnightTorontoAsUTC.toISOString(),
        end: endOfDayTorontoAsUTC.toISOString()
    }
}

/**
 * Get the current date in Toronto timezone as YYYY-MM-DD string.
 * Useful for defaulting date inputs to "today" in Toronto.
 * 
 * @returns Current date in Toronto as YYYY-MM-DD
 */
export function getTorontoDateString(date: Date = new Date()): string {
    return date.toLocaleDateString('en-CA', { timeZone: FINANCIAL_TIMEZONE })
}
