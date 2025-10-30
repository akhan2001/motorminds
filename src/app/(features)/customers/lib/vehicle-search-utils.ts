/**
 * Vehicle search utilities for license plate normalization and validation
 */

/**
 * Normalize a license plate for consistent storage and searching
 * - Convert to uppercase
 * - Remove spaces, dashes, and special characters
 * - Trim whitespace
 */
export function normalizeLicensePlate(plate: string): string {
    if (!plate) return ''
    
    return plate
        .toString()
        .trim()
        .toUpperCase()
        .replace(/[\s\-_\.]/g, '') // Remove spaces, dashes, underscores, dots
        .replace(/[^A-Z0-9]/g, '') // Keep only alphanumeric characters
}

/**
 * Validate a license plate format
 * Basic validation - can be extended for specific regional formats
 */
export function validateLicensePlate(plate: string): {
    isValid: boolean
    error?: string
} {
    if (!plate || plate.trim().length === 0) {
        return { isValid: false, error: 'License plate is required' }
    }

    const normalized = normalizeLicensePlate(plate)
    
    if (normalized.length < 2) {
        return { isValid: false, error: 'License plate must be at least 2 characters' }
    }
    
    if (normalized.length > 10) {
        return { isValid: false, error: 'License plate cannot exceed 10 characters' }
    }
    
    // Check for valid characters (alphanumeric only after normalization)
    if (!/^[A-Z0-9]+$/.test(normalized)) {
        return { isValid: false, error: 'License plate can only contain letters and numbers' }
    }
    
    return { isValid: true }
}

/**
 * Format a license plate for display
 * Adds spacing for common formats if needed
 */
export function formatLicensePlateForDisplay(plate: string): string {
    if (!plate) return ''
    
    const normalized = normalizeLicensePlate(plate)
    
    // Add common formatting patterns
    // Example: ABC123 -> ABC 123 (3 letters + 3 numbers)
    if (/^[A-Z]{3}[0-9]{3}$/.test(normalized)) {
        return `${normalized.slice(0, 3)} ${normalized.slice(3)}`
    }
    
    // Example: AB1234 -> AB 1234 (2 letters + 4 numbers)
    if (/^[A-Z]{2}[0-9]{4}$/.test(normalized)) {
        return `${normalized.slice(0, 2)} ${normalized.slice(2)}`
    }
    
    // Return as-is for other formats
    return normalized
}

/**
 * Generate search patterns for fuzzy matching
 * Returns variations of the plate for broader search results
 */
export function generateSearchPatterns(plate: string): string[] {
    if (!plate) return []
    
    const normalized = normalizeLicensePlate(plate)
    const patterns: string[] = [normalized]
    
    // Add original input (in case user typed with spaces/dashes)
    if (plate.trim().toUpperCase() !== normalized) {
        patterns.push(plate.trim().toUpperCase())
    }
    
    // Add partial matches (for autocomplete-style search)
    if (normalized.length > 2) {
        patterns.push(`${normalized}%`) // Starts with
        patterns.push(`%${normalized}`) // Ends with
        patterns.push(`%${normalized}%`) // Contains
    }
    
    return [...new Set(patterns)] // Remove duplicates
}

/**
 * Check if two license plates are equivalent
 * Useful for deduplication and matching
 */
export function arePlatesEquivalent(plate1: string, plate2: string): boolean {
    if (!plate1 && !plate2) return true
    if (!plate1 || !plate2) return false
    
    return normalizeLicensePlate(plate1) === normalizeLicensePlate(plate2)
}
