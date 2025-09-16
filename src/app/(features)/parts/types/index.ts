// Re-export all types from hooks for easier importing
export type { VehicleEngine } from '../hooks/useVehicleSelection'
export type { PartsCategory, Part } from '../hooks/usePartsData'
export type { ChatMessage, MiaProduct, Source } from '../hooks/useChat'

// Additional shared types
export interface VehicleContext {
    year?: number
    make?: string
    model?: string
    manufacturer_id?: number
    vehicle_id?: number
    engine?: string
    vin?: string
    vin_engine?: string
    vin_trim?: string
    vin_drivetrain?: string
}
