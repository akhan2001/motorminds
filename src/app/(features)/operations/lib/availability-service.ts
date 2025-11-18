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
    
    // Simplified shop configuration - 6am to midnight availability
    private static readonly DEFAULT_SHOP_HOURS = {
        start: '06:00', // Start at 6am
        end: '24:00' // Allows slots up to 23:00 (appointments end at 00:00 next day)
    }

    private static readonly STANDARD_APPOINTMENT_DURATION = 60 // All appointments are 60 minutes
    private static readonly SLOT_INTERVAL = 30 // 30-minute intervals

    /**
     * Get available time slots for a specific date
     */
    static async getAvailableSlots(
        shopId: string,
        date: string
    ): Promise<AvailableSlot[]> {
        try {
            // Check if shop is open on this date
            if (!this.isShopOpen(date)) {
                return [] // Shop closed on this date
            }

            // Get existing appointments for the date
            const existingAppointments = await AppointmentService.getAppointmentsByDate(shopId, date)
            
            // Generate available slots
            const slots = this.generateAvailableSlots(existingAppointments, date)
            
            return slots
            
        } catch (error) {
            console.error('Error getting available slots:', error)
            throw new Error(`Failed to get available slots: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Check if a specific time slot is available
     */
    static async checkSlotAvailability(shopId: string, date: string, time: string): Promise<AvailabilityCheck> {
        try {
            // Get available slots for the date
            const availableSlots = await this.getAvailableSlots(shopId, date)
            
            // Check if the specific time slot is available
            const isAvailable = availableSlots.some(slot => slot.time === time && slot.isAvailable)
            
            return {
                isAvailable,
                suggestedAlternatives: isAvailable ? [] : availableSlots.filter(s => s.isAvailable).slice(0, 3),
                reason: isAvailable ? undefined : 'This time slot is not available'
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
        const isOpen = this.isShopOpen(date)
        
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
        
        // Generate available slots first
        const availableSlots = this.generateAvailableSlots(appointments, date)
        
        
        // Convert appointments to booked slots
        const bookedSlots = await Promise.all(
            appointments.map(async (apt) => {
                // Get appointment details for customer name
                const details = await AppointmentService.getAppointmentById(apt.id)
                const startTime = apt.start_time || '09:00'
                const endTime = this.calculateEndTime(startTime)
                
                return {
                    appointmentId: apt.id,
                    start: startTime,
                    end: endTime,
                    serviceType: apt.service_type,
                    customerName: details?.customer?.customer_name || 'Unknown'
                }
            })
        )

        return {
            date,
            isOpen: true,
            shopHours: this.DEFAULT_SHOP_HOURS,
            availableSlots,
            bookedSlots
        }
    }

    /**
     * Generate available time slots - simplified version
     */
    private static generateAvailableSlots(
        existingAppointments: Array<{ start_time?: string; end_time?: string }>,
        date: string
    ): AvailableSlot[] {
        const slots: AvailableSlot[] = []
        
        // Convert shop hours to minutes
        const shopStart = this.timeToMinutes(this.DEFAULT_SHOP_HOURS.start) // 00:00 = 0 minutes
        const shopEnd = this.timeToMinutes(this.DEFAULT_SHOP_HOURS.end)     // 24:00 = 1440 minutes (end of day)
        
        // Generate slots every 30 minutes for the full day (24 hours)
        for (let minutes = shopStart; minutes < shopEnd; minutes += this.SLOT_INTERVAL) {
            const slotStart = minutes
            const slotEnd = minutes + this.STANDARD_APPOINTMENT_DURATION
            
            // Skip if appointment would extend past shop closing time
            if (slotEnd > shopEnd) break
            
            // Check if this time slot conflicts with existing appointments
            const hasConflict = existingAppointments.some(apt => {
                if (!apt.start_time) return false
                
                const aptStart = this.timeToMinutes(apt.start_time)
                
                // Simple check: if appointment starts at this exact time, it's taken
                return aptStart === slotStart
            })
            
            // Check if time is in the past (only for today)
            // Parse both dates in local timezone to avoid timezone issues
            const today = new Date()
            const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            const isToday = date === todayString
            const currentMinutes = today.getHours() * 60 + today.getMinutes()
            const isPast = isToday && slotStart <= currentMinutes
            
            slots.push({
                time: this.minutesToTime(slotStart),
                endTime: this.minutesToTime(slotEnd),
                duration: this.STANDARD_APPOINTMENT_DURATION,
                isAvailable: !hasConflict && !isPast
            })
        }
        
        return slots
    }

    /**
     * Check if shop is open on a specific date
     * Default: Open every day, all day (24/7)
     */
    private static isShopOpen(date: string): boolean {
        // Always return true - shop is open 24/7 by default
        // This ensures Monday (and all days) are always available
        return true
    }

    /**
     * Calculate end time for an appointment (start time + 60 minutes)
     */
    private static calculateEndTime(startTime: string): string {
        const startMinutes = this.timeToMinutes(startTime)
        const endMinutes = startMinutes + this.STANDARD_APPOINTMENT_DURATION
        return this.minutesToTime(endMinutes)
    }


    /**
     * Convert time string (HH:MM) to minutes since midnight
     * Handles 24:00 as 1440 minutes (end of day)
     */
    private static timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number)
        // Handle 24:00 as end of day (1440 minutes)
        if (hours === 24 && minutes === 0) {
            return 1440
        }
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
        // Parse date string (YYYY-MM-DD) in local timezone to avoid day shift
        const [year, month, day] = dateString.split('-').map(Number)
        const date = new Date(year, month - 1, day) // month is 0-indexed
        date.setDate(date.getDate() + days)
        
        // Format back to YYYY-MM-DD in local timezone
        const resultYear = date.getFullYear()
        const resultMonth = String(date.getMonth() + 1).padStart(2, '0')
        const resultDay = String(date.getDate()).padStart(2, '0')
        return `${resultYear}-${resultMonth}-${resultDay}`
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
     * Check if a time is in the past
     */
    static isTimeTooSoon(date: string, time: string): boolean {
        const now = new Date()
        const appointmentTime = new Date(`${date}T${time}`)
        
        // Only check if it's in the past
        return appointmentTime.getTime() <= now.getTime()
    }

    /**
     * Check if a date is too far in the future (90 days max)
     */
    static isDateTooFar(date: string): boolean {
        const now = new Date()
        const appointmentDate = new Date(date)
        
        const maxAdvanceMs = 90 * 24 * 60 * 60 * 1000 // 90 days
        return (appointmentDate.getTime() - now.getTime()) > maxAdvanceMs
    }
}
