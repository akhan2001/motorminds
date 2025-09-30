// Re-export types from other files
export * from './voice-call'
export * from './status'

// Voice calling specific types
export type PartsRequestPriority = 'low' | 'normal' | 'high' | 'urgent'

// Interface for CallForm part info (different from database PartItem)
export interface PartItem {
    partName: string
    partNumber?: string
    quantity: number
    description?: string
}

// Interface for CallForm vehicle info (different from database VehicleInfo)
export interface VehicleInfo {
    year?: string
    make?: string
    model?: string
    vin?: string
    mileage?: string
    engine?: string
    trim?: string
    color?: string
    transmission?: string
    drivetrain?: string
    fuel_type?: string
    body_style?: string
}

// Selected supplier interface for CallForm
export interface SelectedSupplier {
    id: string
    name: string
    phone_number?: string
    contact_person?: string
    email?: string
    account_number?: string
    isCustom?: boolean
}
