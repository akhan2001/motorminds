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
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Smart capitalize - capitalizes first letter of each word while preserving 
 * common abbreviations and special cases (e.g., "BMW", "VIN", "LLC", "A/C")
 */
const PRESERVE_CASE_WORDS = new Set([
    // Vehicle makes/brands
    'BMW', 'GMC', 'RAM', 'MINI', 'VW', 'MB', 'AMG', 'GT', 'RS', 'SS', 'SRT', 'TRD',
    // Business suffixes
    'LLC', 'INC', 'CO', 'LTD', 'LP', 'LLP', 'PC', 'PA', 'PLLC',
    // Vehicle terms
    'VIN', 'OEM', 'OE', 'A/C', 'AC', 'ABS', 'AWD', 'FWD', 'RWD', '4WD', 'SUV', 'EV', 'PHEV', 'HEV',
    // Common abbreviations
    'USA', 'US', 'UK', 'CA', 'TX', 'NY', 'FL', 'IL', 'OH', 'PA', 'NJ', 'NC', 'GA', 'MI', 'VA', 'AZ', 'WA', 'CO', 'TN', 'MO', 'SC',
    'ID', 'PO', 'APT', 'STE',
])

const LOWERCASE_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'by', 'with'
])

export function smartCapitalize(text: string | null | undefined): string {
    if (!text) return ''
    
    return text
        .split(' ')
        .map((word, index) => {
            const upperWord = word.toUpperCase()
            
            // Preserve all-caps abbreviations
            if (PRESERVE_CASE_WORDS.has(upperWord)) {
                return upperWord
            }
            
            // Handle words with slashes (e.g., "a/c" -> "A/C")
            if (word.includes('/')) {
                return word.split('/').map(part => 
                    PRESERVE_CASE_WORDS.has(part.toUpperCase()) 
                        ? part.toUpperCase() 
                        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                ).join('/')
            }
            
            // Keep lowercase words lowercase (unless first word)
            if (index > 0 && LOWERCASE_WORDS.has(word.toLowerCase())) {
                return word.toLowerCase()
            }
            
            // Standard title case
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join(' ')
}

/**
 * Capitalize customer name (handles first/last name scenarios)
 */
export function capitalizeCustomerName(name: string | null | undefined): string {
    if (!name) return ''
    return smartCapitalize(name.trim())
}

/**
 * Capitalize vehicle info (year, make, model)
 */
export function capitalizeVehicleInfo(info: string | null | undefined): string {
    if (!info) return ''
    return smartCapitalize(info.trim())
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
