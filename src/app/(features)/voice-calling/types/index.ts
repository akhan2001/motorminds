// Export all types from voice calling feature
export * from './voice-call'
export * from './status'
export * from './parts-request'

// Common types (keep for backward compatibility)
export interface SelectedSupplier {
    id: string
    name: string
    phone_number?: string
    contact_person?: string
    email?: string
    account_number?: string
}

export type PartsRequestPriority = 'low' | 'normal' | 'high' | 'urgent'

