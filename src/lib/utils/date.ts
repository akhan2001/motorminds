// Date and time utility functions

// Default timezone - can be overridden by shop settings
const DEFAULT_TIMEZONE = 'America/Toronto'

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
 * Get date in local timezone as YYYY-MM-DD string
 * This ensures we get the local date, not UTC date
 * Useful for date inputs and date comparisons
 */
export function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Convert a date string (YYYY-MM-DD) to a Date object in local timezone
 * Useful for parsing date inputs without timezone conversion issues
 */
export function parseLocalDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00')
}
