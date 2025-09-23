// Availability and time slot types
export interface TimeSlot {
    start: string      // HH:MM format
    end: string        // HH:MM format
    available: boolean
    duration: number   // minutes
}

export interface AvailableSlot {
    time: string       // HH:MM format
    endTime: string    // HH:MM format
    duration: number   // minutes
    isAvailable: boolean
}

export interface ShopHours {
    start: string      // HH:MM format
    end: string        // HH:MM format
    breakStart?: string // HH:MM format
    breakEnd?: string   // HH:MM format
}

export interface DayAvailability {
    date: string       // YYYY-MM-DD format
    isOpen: boolean
    shopHours: ShopHours
    availableSlots: AvailableSlot[]
    bookedSlots: BookedSlot[]
}

export interface BookedSlot {
    appointmentId: string
    start: string      // HH:MM format
    end: string        // HH:MM format
    serviceType: string
    customerName: string
}

export interface AvailabilityQuery {
    shopId: string
    date: string       // YYYY-MM-DD format
    serviceType?: string
    duration?: number  // minutes
}

export interface WeekAvailability {
    weekStart: string  // YYYY-MM-DD format
    days: DayAvailability[]
}

// Time slot configuration
export interface SlotConfig {
    duration: number     // Default slot duration in minutes
    buffer: number       // Buffer time between appointments in minutes
    maxAdvanceBooking: number // Maximum days in advance for booking
    minAdvanceBooking: number // Minimum hours in advance for booking
}

// Operating hours by day of week
export interface WeeklyHours {
    monday: ShopHours | null
    tuesday: ShopHours | null
    wednesday: ShopHours | null
    thursday: ShopHours | null
    friday: ShopHours | null
    saturday: ShopHours | null
    sunday: ShopHours | null
}

// Availability check result
export interface AvailabilityCheck {
    isAvailable: boolean
    conflictingAppointments?: string[]
    suggestedAlternatives?: AvailableSlot[]
    reason?: string
}

// Time utility types
export interface TimeRange {
    start: string
    end: string
}

export interface DateTimeRange {
    date: string
    timeRange: TimeRange
}