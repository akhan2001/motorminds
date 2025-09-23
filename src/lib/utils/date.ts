// Date and time utility functions

/**
 * Format date string to readable US format
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

/**
 * Format date string to include time
 */
export function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
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
