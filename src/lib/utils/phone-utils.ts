/**
 * Phone number utilities for formatting and validation
 */

export function formatPhoneNumberE164(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '')
    
    // If it starts with 1 and has 11 digits, it's already in E.164 format
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`
    }
    
    // If it has 10 digits, assume it's a US number and add +1
    if (digits.length === 10) {
        return `+1${digits}`
    }
    
    // If it already starts with + return as is
    if (phoneNumber.startsWith('+')) {
        return phoneNumber
    }
    
    // Default: add + prefix
    return `+${digits}`
}

export function isValidE164(phoneNumber: string): boolean {
    // E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/
    return e164Regex.test(phoneNumber)
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '')
    
    // Valid if it has 10 or 11 digits
    return digits.length >= 10 && digits.length <= 15
}

export function formatPhoneNumberDisplay(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    
    // Format as +1 (XXX) XXX-XXXX for US numbers with country code
    if (digits.length === 11 && digits.startsWith('1')) {
        const usDigits = digits.slice(1)
        return `+1 (${usDigits.slice(0, 3)}) ${usDigits.slice(3, 6)}-${usDigits.slice(6)}`
    }
    
    // Return original for international numbers
    return phoneNumber
}
