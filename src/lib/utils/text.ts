// Text and name formatting utility functions

/**
 * Generate initials from a name (up to 2 characters)
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

/**
 * Generate initials from first and last name
 */
export function getInitialsFromFullName(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    const last = lastName?.charAt(0)?.toUpperCase() || ''
    return `${first}${last}`
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
    return text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

/**
 * Capitalize only the first letter of the string
 */
export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Convert text to slug format (lowercase, hyphens)
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Extract domain from email address
 */
export function getDomainFromEmail(email: string): string {
    const parts = email.split('@')
    return parts.length === 2 ? parts[1] : ''
}

/**
 * Mask email address (show first 2 chars and domain)
 */
export function maskEmail(email: string): string {
    const [localPart, domain] = email.split('@')
    if (!domain) return email
    
    const maskedLocal = localPart.length > 2 
        ? localPart.slice(0, 2) + '*'.repeat(localPart.length - 2)
        : localPart
    
    return `${maskedLocal}@${domain}`
}

// Phone number formatting moved to @/utils/format-phone
// Import from there: import { formatPhoneNumber } from '@/utils/format-phone'
