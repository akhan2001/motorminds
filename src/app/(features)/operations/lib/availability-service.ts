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
    
    // Simplified shop configuration
    private static readonly DEFAULT_SHOP_HOURS = {
        start: '08:00',
        end: '17:00'
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
                    customerName: details?.customer.customer_name || 'Unknown'
                }
            })
        )

        // Generate available slots
        const availableSlots = this.generateAvailableSlots(appointments, date)

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
        const shopStart = this.timeToMinutes(this.DEFAULT_SHOP_HOURS.start) // 8:00 AM = 480 minutes
        const shopEnd = this.timeToMinutes(this.DEFAULT_SHOP_HOURS.end)     // 5:00 PM = 1020 minutes
        
        // Generate slots every 30 minutes from 8:00 AM to 5:00 PM
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
            const isToday = date === new Date().toISOString().split('T')[0]
            const now = new Date()
            const currentMinutes = now.getHours() * 60 + now.getMinutes()
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
     */
    private static isShopOpen(date: string): boolean {
        const dayOfWeek = new Date(date).getDay()
        
        // Closed on Sundays (0)
        return dayOfWeek !== 0
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
