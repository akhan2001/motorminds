// Trigger types for automated messaging
export type TriggerType = 'work_order_complete' | 'manual' | 'service_reminder'

// Common service types for automotive shops
export type ServiceType = 
    | 'oil_change'
    | 'brake_service'
    | 'tire_rotation'
    | 'tire_replacement'
    | 'wheel_alignment'
    | 'engine_diagnostic'
    | 'transmission_service'
    | 'battery_service'
    | 'air_filter_replacement'
    | 'coolant_flush'
    | 'spark_plug_replacement'
    | 'brake_fluid_flush'
    | 'power_steering_flush'
    | 'general_inspection'
    | 'other'
    | null // null means applies to all service types

// Template variable definition
export interface TemplateVariable {
    name: string
    description: string
    example: string
}

export interface MessageTemplate {
    id: string
    shop_id: string
    name: string
    trigger_type: TriggerType
    service_type: ServiceType
    message_template: string
    variables: TemplateVariable[] | null
    delay_hours: number // Delay in hours after trigger event
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface MessageTemplateCreateData {
    shop_id: string
    name: string
    trigger_type: TriggerType
    service_type?: ServiceType
    message_template: string
    variables?: TemplateVariable[]
    delay_hours?: number // Default: 0 (immediate)
    is_active?: boolean
}

export interface MessageTemplateUpdateData {
    name?: string
    trigger_type?: TriggerType
    service_type?: ServiceType
    message_template?: string
    variables?: TemplateVariable[]
    delay_hours?: number
    is_active?: boolean
}

// Available template variables for replacement
export const AVAILABLE_VARIABLES: TemplateVariable[] = [
    { name: 'customer_name', description: 'Customer full name', example: 'John Smith' },
    { name: 'shop_name', description: 'Your shop name', example: 'Quality Auto Repair' },
    { name: 'shop_phone', description: 'Your shop phone number', example: '(555) 123-4567' },
    { name: 'vehicle_info', description: 'Vehicle year, make, model', example: '2020 Toyota Camry' },
    { name: 'vehicle_make', description: 'Vehicle make', example: 'Toyota' },
    { name: 'vehicle_model', description: 'Vehicle model', example: 'Camry' },
    { name: 'vehicle_year', description: 'Vehicle year', example: '2020' },
    { name: 'service_type', description: 'Type of service performed', example: 'Oil Change' },
    { name: 'work_order_title', description: 'Work order title', example: 'Oil Change & Inspection' },
    { name: 'delay_time', description: 'Time since service', example: '1 month' },
]

// Helper to format delay hours into human-readable string
export function formatDelayHours(hours: number): string {
    if (hours === 0) return 'Immediately'
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`
    
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`
    
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''}`
    
    const months = Math.floor(days / 30)
    return `${months} month${months !== 1 ? 's' : ''}`
}

// Helper to convert common time periods to hours
export const TIME_PERIODS = {
    IMMEDIATE: 0,
    ONE_HOUR: 1,
    SIX_HOURS: 6,
    ONE_DAY: 24,
    THREE_DAYS: 72,
    ONE_WEEK: 168,
    TWO_WEEKS: 336,
    ONE_MONTH: 720, // ~30 days
    THREE_MONTHS: 2160,
    SIX_MONTHS: 4320,
    ONE_YEAR: 8760,
} as const
