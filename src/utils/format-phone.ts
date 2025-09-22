/**
 * Formats a phone number string to a consistent format
 * @param phoneNumber - The raw phone number string
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // Handle different lengths
    if (cleaned.length === 0) return ''
    if (cleaned.length <= 3) return `(${cleaned}`
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    if (cleaned.length <= 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    
    // Handle international numbers (11+ digits)
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        // US/Canada number with country code
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    
    // For longer numbers, just add + prefix
    return `+${cleaned}`
}

/**
 * Removes formatting from a phone number to get just the digits
 * @param formattedPhone - The formatted phone number string
 * @returns Clean phone number with only digits
 */
export function cleanPhoneNumber(formattedPhone: string): string {
    return formattedPhone.replace(/\D/g, '')
}

/**
 * Validates if a phone number has a valid format
 * @param phoneNumber - The phone number to validate
 * @returns True if the phone number is valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = cleanPhoneNumber(phoneNumber)
    
    // US/Canada: 10 digits or 11 digits starting with 1
    if (cleaned.length === 10) return true
    if (cleaned.length === 11 && cleaned.startsWith('1')) return true
    
    // International: 7-15 digits
    if (cleaned.length >= 7 && cleaned.length <= 15) return true
    
    return false
}

/**
 * Format phone number to E.164 format (international standard)
 * Required for telephony services like Vapi
 * @param phoneNumber - The phone number to format
 * @returns E.164 formatted phone number
 */
export function formatPhoneNumberE164(phoneNumber: string): string {
    if (!phoneNumber) return ''
    
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '')
    
    // If it starts with 1 and is 11 digits, it's already US format
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`
    }
    
    // If it's 10 digits, add US country code
    if (digits.length === 10) {
        return `+1${digits}`
    }
    
    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
        return phoneNumber
    }
    
    // For other lengths, try to add +1 (US default)
    if (digits.length >= 10) {
        return `+1${digits.slice(-10)}` // Take last 10 digits
    }
    
    // If less than 10 digits, return with +1 anyway (might be invalid but formatted)
    return `+1${digits}`
}

/**
 * Validate if phone number is in proper E.164 format
 * @param phoneNumber - The phone number to validate
 * @returns True if the phone number is valid E.164 format
 */
export function isValidE164(phoneNumber: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/
    return e164Regex.test(phoneNumber)
}
