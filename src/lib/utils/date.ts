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
