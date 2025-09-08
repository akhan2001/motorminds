import { Message } from 'ai'

// MIA-specific message types for automotive diagnostics
export interface DiagnosticMessage extends Message {
    // Vehicle context for this diagnostic session
    vehicleInfo?: {
        vin?: string
        year?: string
        make?: string
        model?: string
        engine?: string
        mileage?: string
    }
    // Diagnostic-specific metadata
    diagnosticData?: {
        dtcCodes?: string[]
        symptoms?: string[]
        references?: DiagnosticReference[]
        visualAids?: DiagnosticVisualAid[]
        severity?: 'low' | 'medium' | 'high' | 'critical'
        estimatedCost?: {
            min: number
            max: number
            currency: string
        }
    }
}

export interface DiagnosticReference {
    id: string
    title: string
    source: 'service_manual' | 'tsb' | 'oem_bulletin' | 'repair_guide' | 'perplexity'
    url?: string
    excerpt?: string
    relevanceScore?: number
}

export interface DiagnosticVisualAid {
    id: string
    type: 'diagram' | 'photo' | 'chart' | 'video'
    title: string
    description?: string
    url?: string
    placeholder?: boolean
}

export interface VehicleInputData {
    vin?: string
    year?: string
    make?: string
    model?: string
    engine?: string
    mileage?: string
    symptoms: string
}

// Diagnostic session state
export interface DiagnosticSession {
    id: string
    vehicleInfo?: VehicleInputData
    messages: DiagnosticMessage[]
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}