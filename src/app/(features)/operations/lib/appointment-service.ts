import { createClient } from '@/utils/supabase/client'
import type { 
    Appointment, 
    AppointmentWithDetails, 
    AppointmentCreateData, 
    AppointmentUpdateData,
    DateRange,
    AppointmentStats
} from '../types/appointment'

const supabase = createClient()

export class AppointmentService {
    static readonly VERSION = '2.0.0' // Cache busting version
    
    /**
     * Get appointments with proper joins based on actual FK relationships
     */
    static async getAppointmentsWithDetails(
        shopId: string, 
        dateRange?: DateRange
    ): Promise<AppointmentWithDetails[]> {
        let query = supabase
            .from('appointments')
            .select(`
                id,
                created_at,
                shop_id,
                customer_id,
                vehicle_id,
                appointment_date,
                notes,
                start_time,
                end_time,
                service_type,
                updated_at,
                status,
                confirmation_code,
                created_by_customer,
                customer:customers!appointments_customer_id_fkey(
                    id,
                    customer_name,
                    customer_email,
                    customer_phone
                ),
                vehicle:customer_vehicles!appointments_vehicle_id_fkey(
                    id,
                    year,
                    make,
                    model,
                    license_plate,
                    color,
                    vin,
                    mileage
                ),
                work_order:work_orders!work_orders_appointment_id_fkey(
                    id,
                    work_order_number,
                    status
                )
            `)
            .eq('shop_id', shopId)
            .order('appointment_date', { ascending: true })
            .order('start_time', { ascending: true })

        if (dateRange) {
            query = query
                .gte('appointment_date', dateRange.start)
                .lte('appointment_date', dateRange.end)
        }

        const { data, error } = await query

        if (error) throw new Error(`Failed to fetch appointments: ${error.message}`)
        return (data as unknown as AppointmentWithDetails[]) || []
    }

    /**
     * Get a single appointment by ID
     */
    static async getAppointmentById(appointmentId: string): Promise<AppointmentWithDetails | null> {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id,
                created_at,
                shop_id,
                customer_id,
                vehicle_id,
                appointment_date,
                notes,
                start_time,
                end_time,
                service_type,
                updated_at,
                status,
                confirmation_code,
                created_by_customer,
                customer:customers!appointments_customer_id_fkey(
                    id,
                    customer_name,
                    customer_email,
                    customer_phone
                ),
                vehicle:customer_vehicles!appointments_vehicle_id_fkey(
                    id,
                    year,
                    make,
                    model,
                    license_plate,
                    color,
                    vin,
                    mileage
                ),
                work_order:work_orders!work_orders_appointment_id_fkey(
                    id,
                    work_order_number,
                    status
                )
            `)
            .eq('id', appointmentId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            throw new Error(`Failed to fetch appointment: ${error.message}`)
        }

        return data as unknown as AppointmentWithDetails
    }

    /**
     * Create a new appointment
     */
    static async createAppointment(appointmentData: AppointmentCreateData): Promise<Appointment> {
        // Generate confirmation code
        const confirmationCode = AppointmentService.generateConfirmationCode()

        const { data, error } = await supabase
            .from('appointments')
            .insert({
                ...appointmentData,
                confirmation_code: confirmationCode
            })
            .select()
            .single()

        if (error) throw new Error(`Failed to create appointment: ${error.message}`)
        return data
    }

    /**
     * Update an existing appointment
     */
    static async updateAppointment(
        appointmentId: string, 
        updateData: AppointmentUpdateData
    ): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId)
            .select()
            .single()

        if (error) throw new Error(`Failed to update appointment: ${error.message}`)
        return data
    }

    /**
     * Cancel an appointment by setting status to 'cancelled'
     */
    static async cancelAppointment(appointmentId: string): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId)
            .select()
            .single()

        if (error) throw new Error(`Failed to cancel appointment: ${error.message}`)
        return data
    }

    /**
     * Delete an appointment
     */
    static async deleteAppointment(appointmentId: string): Promise<void> {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', appointmentId)

        if (error) throw new Error(`Failed to delete appointment: ${error.message}`)
    }

    /**
     * Check time slot availability - simplified to match availability service
     */
    static async checkTimeSlotAvailability(
        shopId: string,
        appointmentDate: string,
        startTime: string,
        endTime: string,
        excludeAppointmentId?: string
    ): Promise<boolean> {
        let query = supabase
            .from('appointments')
            .select('id, start_time')
            .eq('shop_id', shopId)
            .eq('appointment_date', appointmentDate)
            .eq('start_time', startTime) // Simple check: exact start time match
            .neq('status', 'cancelled')

        if (excludeAppointmentId) {
            query = query.neq('id', excludeAppointmentId)
        }

        const { data, error } = await query

        if (error) throw new Error(`Failed to check availability: ${error.message}`)
        return data?.length === 0 // Available if no appointments found at this exact time
    }

    /**
     * Get appointments for a specific date
     */
    static async getAppointmentsByDate(
        shopId: string, 
        date: string
    ): Promise<Pick<Appointment, 'start_time' | 'end_time' | 'id' | 'service_type'>[]> {
        const { data, error } = await supabase
            .from('appointments')
            .select('id, start_time, end_time, service_type')
            .eq('shop_id', shopId)
            .eq('appointment_date', date)
            .neq('status', 'cancelled')

        if (error) throw new Error(`Failed to get appointments by date: ${error.message}`)
        return data || []
    }

    /**
     * Get appointment statistics for dashboard
     */
    static async getAppointmentStats(shopId: string): Promise<AppointmentStats> {
        const today = new Date().toISOString().split('T')[0]
        const startOfWeek = AppointmentService.getStartOfWeek(new Date()).toISOString().split('T')[0]
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString().split('T')[0]

        // Get all appointments for calculations
        const { data: allAppointments, error } = await supabase
            .from('appointments')
            .select('appointment_date, status')
            .eq('shop_id', shopId)
            .gte('appointment_date', startOfMonth)

        if (error) throw new Error(`Failed to fetch appointment stats: ${error.message}`)

        const appointments = allAppointments || []

        return {
            today: appointments.filter(apt => apt.appointment_date === today).length,
            thisWeek: appointments.filter(apt => apt.appointment_date >= startOfWeek).length,
            thisMonth: appointments.length,
            pending: appointments.filter(apt => apt.status === 'scheduled').length,
            confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
            completed: appointments.filter(apt => apt.status === 'completed').length
        }
    }

    /**
     * Generate available time slots for a given date
     */
    static generateAvailableSlots(
        shopHours: { start: string; end: string },
        existingAppointments: Pick<Appointment, 'start_time' | 'end_time'>[],
        appointmentDuration: number = 60 // minutes
    ): string[] {
        const slots: string[] = []
        const startMinutes = AppointmentService.timeToMinutes(shopHours.start)
        const endMinutes = AppointmentService.timeToMinutes(shopHours.end)

        for (let minutes = startMinutes; minutes < endMinutes; minutes += appointmentDuration) {
            const slotStart = AppointmentService.minutesToTime(minutes)
            const slotEnd = AppointmentService.minutesToTime(minutes + appointmentDuration)

            // Check if slot conflicts with existing appointments
            const hasConflict = existingAppointments.some(apt => {
                if (!apt.start_time || !apt.end_time) return false
                
                const aptStart = AppointmentService.timeToMinutes(apt.start_time)
                const aptEnd = AppointmentService.timeToMinutes(apt.end_time)
                
                return !(minutes >= aptEnd || minutes + appointmentDuration <= aptStart)
            })

            if (!hasConflict) {
                slots.push(slotStart)
            }
        }

        return slots
    }

    /**
     * Get service duration for a given service type
     */
    static getServiceDuration(serviceType: string): number {
        // Map service types to durations (in minutes)
        const serviceDurations: Record<string, number> = {
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
        
        return serviceDurations[serviceType] || 60
    }

    /**
     * Generate confirmation code
     */
    private static generateConfirmationCode(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase()
    }

    /**
     * Convert time string to minutes since midnight
     */
    private static timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
    }

    /**
     * Convert minutes since midnight to time string
     */
    private static minutesToTime(minutes: number): string {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }

    /**
     * Create a work order from an appointment (v2 - cache busted)
     */
    static async createWorkOrderFromAppointmentV2(appointmentId: string): Promise<string> {
        console.log('Creating work order for appointment:', appointmentId) // Debug log
        // First get the appointment details (inlined to avoid caching issues)
        const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select(`
                id,
                created_at,
                shop_id,
                customer_id,
                vehicle_id,
                appointment_date,
                notes,
                start_time,
                end_time,
                service_type,
                updated_at,
                status,
                confirmation_code,
                created_by_customer,
                customer, customer_id,
                vehicle, vehicle_id
            `)
            .eq('id', appointmentId)
            .single()
        
        if (fetchError || !appointment) {
            throw new Error('Appointment not found')
        }

        // Generate work order number (format: WO-YYYYMMDD-XXXX)
        const today = new Date()
        const dateStr = today.getFullYear() + 
                      String(today.getMonth() + 1).padStart(2, '0') + 
                      String(today.getDate()).padStart(2, '0')
        const randomSuffix = Math.floor(1000 + Math.random() * 9000)
        const workOrderNumber = `WO-${dateStr}-${randomSuffix}`

        // Create work order
        const { data: workOrder, error } = await supabase
            .from('work_orders')
            .insert([{
                work_order_number: workOrderNumber,
                shop_id: appointment.shop_id,
                customer_id: appointment.customer_id,
                vehicle_id: appointment.vehicle_id,
                appointment_id: appointmentId,
                title: `${appointment.service_type} - ${(appointment as any).customer.customer_name}`,
                description: `Work order created from appointment scheduled for ${appointment.appointment_date}`,
                notes: appointment.notes,
                status: 'pending',
                priority: 'medium'
            }])
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create work order: ${error.message}`)
        }

        // Update appointment status to indicate it has been converted (inlined to avoid caching issues)
        await supabase
            .from('appointments')
            .update({ status: 'in_progress' })
            .eq('id', appointmentId)

        return workOrder.id
    }

    /**
     * Legacy method for compatibility (delegates to V2)
     */
    static async createWorkOrderFromAppointment(appointmentId: string): Promise<string> {
        return AppointmentService.createWorkOrderFromAppointmentV2(appointmentId)
    }

    /**
     * Get start of week (Monday)
     */
    private static getStartOfWeek(date: Date): Date {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
        return new Date(d.setDate(diff))
    }
}

// Direct export function to bypass class caching issues
export async function createWorkOrderFromAppointmentDirect(appointmentId: string): Promise<string> {
    console.log('Direct function: Creating work order for appointment:', appointmentId) // Debug log
    
    const supabaseClient = createClient()
    
    // First get the appointment details
    const { data: appointment, error: fetchError } = await supabaseClient
        .from('appointments')
        .select(`
            id, created_at, shop_id, customer_id, vehicle_id,
            appointment_date, notes, start_time, end_time,
            service_type, updated_at, status, confirmation_code,
            created_by_customer,
            customer:customers!appointments_customer_id_fkey(
                id, customer_name, customer_phone, customer_email
            ),
            vehicle:customer_vehicles!appointments_vehicle_id_fkey(
                id, year, make, model, license_plate, color, vin, mileage
            )
        `)
        .eq('id', appointmentId)
        .single()
    
    if (fetchError || !appointment) {
        throw new Error('Appointment not found')
    }

    // Generate work order number (format: WO-YYYYMMDD-XXXX)
    const today = new Date()
    const dateStr = today.getFullYear() + 
                  String(today.getMonth() + 1).padStart(2, '0') + 
                  String(today.getDate()).padStart(2, '0')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const workOrderNumber = `WO-${dateStr}-${randomSuffix}`

    // Create work order
    const { data: workOrder, error } = await supabaseClient
        .from('work_orders')
        .insert([{
            work_order_number: workOrderNumber,
            shop_id: appointment.shop_id,
            customer_id: appointment.customer_id,
            vehicle_id: appointment.vehicle_id,
            appointment_id: appointmentId,
            title: `${appointment.service_type}`,
            notes: appointment.notes,
            status: 'pending',
            priority: 'medium'
        }])
    .select()
    .single()

    if (error) {
        throw new Error(`Failed to create work order: ${error.message}`)
    }

    // Update appointment status to indicate it has been converted
    await supabaseClient
        .from('appointments')
        .update({ status: 'in_progress' })
        .eq('id', appointmentId)

    return workOrder.id
}
