import { createClient } from '@/utils/supabase/client'
import { AppointmentService } from './appointment-service'
import type { 
    AvailableSlot, 
    ShopHours, 
    DayAvailability, 
    WeekAvailability,
    AvailabilityQuery,
    AvailabilityCheck,
    SlotConfig,
    WeeklyHours 
} from '../types/availability'
import type { SERVICE_DURATIONS } from '../types/appointment'

const supabase = createClient()

export class AvailabilityService {
    
    // Default shop configuration
    private static readonly DEFAULT_SHOP_HOURS: ShopHours = {
        start: '08:00',
        end: '17:00',
        breakStart: '12:00',
        breakEnd: '13:00'
    }

    private static readonly DEFAULT_SLOT_CONFIG: SlotConfig = {
        duration: 60,        // 1 hour default
        buffer: 15,          // 15 minutes between appointments
        maxAdvanceBooking: 90, // 90 days
        minAdvanceBooking: 2   // 2 hours
    }

    /**
     * Get available time slots for a specific date
     */
    static async getAvailableSlots(
        shopId: string,
        date: string,
        serviceType?: string
    ): Promise<AvailableSlot[]> {
        try {
            // Get shop operating hours for the date
            const shopHours = await this.getShopHours(shopId, date)
            
            if (!shopHours) {
                return [] // Shop closed on this date
            }

            // Get existing appointments for the date
            const existingAppointments = await AppointmentService.getAppointmentsByDate(shopId, date)
            
            // Get service duration
            const serviceDuration = this.getServiceDuration(serviceType)
            
            // Generate available slots
            return this.generateAvailableSlots(shopHours, existingAppointments, serviceDuration)
            
        } catch (error) {
            console.error('Error getting available slots:', error)
            throw new Error(`Failed to get available slots: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Check if a specific time slot is available
     */
    static async checkSlotAvailability(query: AvailabilityQuery): Promise<AvailabilityCheck> {
        try {
            const { shopId, date, serviceType, duration } = query
            
            // Get available slots for the date
            const availableSlots = await this.getAvailableSlots(shopId, date, serviceType)
            
            // Check if any slot matches our requirements
            const requestedDuration = duration || this.getServiceDuration(serviceType)
            const isAvailable = availableSlots.some(slot => slot.duration >= requestedDuration)
            
            return {
                isAvailable,
                suggestedAlternatives: isAvailable ? [] : availableSlots.slice(0, 3),
                reason: isAvailable ? undefined : 'No available slots for the requested duration'
            }
            
        } catch (error) {
            console.error('Error checking slot availability:', error)
            return {
                isAvailable: false,
                reason: `Error checking availability: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        }
    }

    /**
     * Get availability for an entire week
     */
    static async getWeekAvailability(
        shopId: string, 
        weekStart: string
    ): Promise<WeekAvailability> {
        const days: DayAvailability[] = []
        
        for (let i = 0; i < 7; i++) {
            const date = this.addDays(weekStart, i)
            const dayAvailability = await this.getDayAvailability(shopId, date)
            days.push(dayAvailability)
        }
        
        return {
            weekStart,
            days
        }
    }

    /**
     * Get availability for a single day
     */
    static async getDayAvailability(
        shopId: string, 
        date: string
    ): Promise<DayAvailability> {
        const shopHours = await this.getShopHours(shopId, date)
        const isOpen = shopHours !== null
        
        if (!isOpen) {
            return {
                date,
                isOpen: false,
                shopHours: this.DEFAULT_SHOP_HOURS,
                availableSlots: [],
                bookedSlots: []
            }
        }

        // Get existing appointments
        const appointments = await AppointmentService.getAppointmentsByDate(shopId, date)
        
        // Convert appointments to booked slots
        const bookedSlots = await Promise.all(
            appointments.map(async (apt) => {
                // Get appointment details for customer name
                const details = await AppointmentService.getAppointmentById(apt.id)
                return {
                    appointmentId: apt.id,
                    start: apt.start_time || '09:00',
                    end: apt.end_time || '10:00',
                    serviceType: apt.service_type,
                    customerName: details?.customer.customer_name || 'Unknown'
                }
            })
        )

        // Generate available slots
        const availableSlots = this.generateAvailableSlots(shopHours, appointments)

        return {
            date,
            isOpen: true,
            shopHours,
            availableSlots,
            bookedSlots
        }
    }

    /**
     * Generate available time slots
     */
    private static generateAvailableSlots(
        shopHours: ShopHours,
        existingAppointments: Array<{ start_time?: string; end_time?: string }>,
        slotDuration: number = this.DEFAULT_SLOT_CONFIG.duration
    ): AvailableSlot[] {
        const slots: AvailableSlot[] = []
        const config = this.DEFAULT_SLOT_CONFIG
        
        // Convert times to minutes
        const shopStart = this.timeToMinutes(shopHours.start)
        const shopEnd = this.timeToMinutes(shopHours.end)
        const breakStart = shopHours.breakStart ? this.timeToMinutes(shopHours.breakStart) : null
        const breakEnd = shopHours.breakEnd ? this.timeToMinutes(shopHours.breakEnd) : null

        // Generate slots from shop start to shop end
        for (let minutes = shopStart; minutes < shopEnd; minutes += slotDuration + config.buffer) {
            const slotStart = minutes
            const slotEnd = minutes + slotDuration

            // Skip if slot extends beyond shop hours
            if (slotEnd > shopEnd) break

            // Skip if slot conflicts with break time
            if (breakStart && breakEnd) {
                if (!(slotEnd <= breakStart || slotStart >= breakEnd)) {
                    continue
                }
            }

            // Check for conflicts with existing appointments
            const hasConflict = existingAppointments.some(apt => {
                if (!apt.start_time || !apt.end_time) return false
                
                const aptStart = this.timeToMinutes(apt.start_time)
                const aptEnd = this.timeToMinutes(apt.end_time)
                
                // Check for overlap
                return !(slotEnd <= aptStart || slotStart >= aptEnd)
            })

            slots.push({
                time: this.minutesToTime(slotStart),
                endTime: this.minutesToTime(slotEnd),
                duration: slotDuration,
                isAvailable: !hasConflict
            })
        }

        return slots
    }

    /**
     * Get shop hours for a specific date
     * This is a simplified version - in production you might have a shop_hours table
     */
    private static async getShopHours(shopId: string, date: string): Promise<ShopHours | null> {
        // For now, return default hours - in production, you'd query a shop_hours table
        const dayOfWeek = new Date(date).getDay()
        
        // Check if it's Sunday (0) - shop might be closed
        if (dayOfWeek === 0) {
            return null // Closed on Sundays
        }
        
        // Return default hours for other days
        return this.DEFAULT_SHOP_HOURS
    }

    /**
     * Get service duration in minutes
     */
    private static getServiceDuration(serviceType?: string): number {
        if (!serviceType) return this.DEFAULT_SLOT_CONFIG.duration
        
        // Map service types to durations
        const durations: Record<string, number> = {
            'Oil Change': 30,
            'Brake Service': 90,
            'Tire Service': 60,
            'Engine Diagnostic': 120,
            'Transmission Service': 180,
            'A/C Service': 75,
            'Battery Service': 30,
            'Inspection': 45,
            'General Repair': 120,
            'Maintenance': 90,
            'Other': 60
        }
        
        return durations[serviceType] || this.DEFAULT_SLOT_CONFIG.duration
    }

    /**
     * Convert time string (HH:MM) to minutes since midnight
     */
    private static timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
    }

    /**
     * Convert minutes since midnight to time string (HH:MM)
     */
    private static minutesToTime(minutes: number): string {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }

    /**
     * Add days to a date string
     */
    private static addDays(dateString: string, days: number): string {
        const date = new Date(dateString)
        date.setDate(date.getDate() + days)
        return date.toISOString().split('T')[0]
    }

    /**
     * Check if a date is in the past
     */
    static isDateInPast(date: string): boolean {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const checkDate = new Date(date)
        return checkDate < today
    }

    /**
     * Check if a time is too soon (within minimum advance booking)
     */
    static isTimeTooSoon(date: string, time: string): boolean {
        const now = new Date()
        const appointmentTime = new Date(`${date}T${time}`)
        
        const minAdvanceMs = this.DEFAULT_SLOT_CONFIG.minAdvanceBooking * 60 * 60 * 1000
        return (appointmentTime.getTime() - now.getTime()) < minAdvanceMs
    }

    /**
     * Check if a date is too far in the future
     */
    static isDateTooFar(date: string): boolean {
        const now = new Date()
        const appointmentDate = new Date(date)
        
        const maxAdvanceMs = this.DEFAULT_SLOT_CONFIG.maxAdvanceBooking * 24 * 60 * 60 * 1000
        return (appointmentDate.getTime() - now.getTime()) > maxAdvanceMs
    }
}
