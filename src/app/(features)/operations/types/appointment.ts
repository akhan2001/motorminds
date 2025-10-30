// Appointment types based on actual database schema
import type { WalkInVehicleInfo } from '../../customers/types/vehicle'
export interface Appointment {
    id: string
    created_at: string
    shop_id: string
    customer_id?: string // Made option for walk-ins
    vehicle_id?: string // Made option for walk-ins
    appointment_date: string
    notes?: string
    start_time?: string
    end_time?: string
    service_type: string
    updated_at: string
    status?: AppointmentStatus
    confirmation_code?: string
    created_by_customer?: boolean
    // New walk-in fields
    customer_type: 'registered' | 'walk_in'
    walk_in_vehicle_info?: WalkInVehicleInfo
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

// Extended type with joined data for display
export interface AppointmentWithDetails extends Appointment {
    customer?: {
        id: string
        customer_name: string
        customer_email?: string
        customer_phone?: string
    }
    vehicle?: {
        id: string
        year?: number
        make?: string
        model?: string
        license_plate?: string
        color?: string
        vin?: string
        mileage?: number
    }
    work_order?: {
        id: string
        work_order_number: string
        status: string
    }
}

// For calendar component integration
export interface CalendarAppointment extends AppointmentWithDetails {
    title: string
    start: Date
    end: Date
}

// Create appointment form data
export interface AppointmentCreateData {
    shop_id: string
    customer_id?: string // Made option for walk-ins
    vehicle_id?: string // Made option for walk-ins
    appointment_date: string
    start_time: string
    end_time: string
    service_type: string
    notes?: string
    status?: AppointmentStatus
    created_by_customer?: boolean
    // Add walk-in fields
    customer_type?: 'registered' | 'walk_in'
    walk_in_vehicle_info?: WalkInVehicleInfo
}

// Update appointment form data
export interface AppointmentUpdateData {
    appointment_date?: string
    start_time?: string
    end_time?: string
    service_type?: string
    notes?: string
    status?: AppointmentStatus
}

// Service types enum
export const SERVICE_TYPES = {
    OIL_CHANGE: 'Oil Change',
    BRAKE_SERVICE: 'Brake Service',
    TIRE_SERVICE: 'Tire Service',
    ENGINE_DIAGNOSTIC: 'Engine Diagnostic',
    TRANSMISSION_SERVICE: 'Transmission Service',
    AC_SERVICE: 'A/C Service',
    BATTERY_SERVICE: 'Battery Service',
    INSPECTION: 'Inspection',
    GENERAL_REPAIR: 'General Repair',
    MAINTENANCE: 'Maintenance',
    OTHER: 'Other'
} as const

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES]

// Service duration mapping (in minutes)
export const SERVICE_DURATIONS: Record<ServiceType, number> = {
    [SERVICE_TYPES.OIL_CHANGE]: 30,
    [SERVICE_TYPES.BRAKE_SERVICE]: 90,
    [SERVICE_TYPES.TIRE_SERVICE]: 60,
    [SERVICE_TYPES.ENGINE_DIAGNOSTIC]: 120,
    [SERVICE_TYPES.TRANSMISSION_SERVICE]: 180,
    [SERVICE_TYPES.AC_SERVICE]: 75,
    [SERVICE_TYPES.BATTERY_SERVICE]: 30,
    [SERVICE_TYPES.INSPECTION]: 45,
    [SERVICE_TYPES.GENERAL_REPAIR]: 120,
    [SERVICE_TYPES.MAINTENANCE]: 90,
    [SERVICE_TYPES.OTHER]: 60
}

// Date range for filtering
export interface DateRange {
    start: string
    end: string
}

// Dashboard statistics
export interface AppointmentStats {
    today: number
    thisWeek: number
    thisMonth: number
    pending: number
    confirmed: number
    completed: number
}