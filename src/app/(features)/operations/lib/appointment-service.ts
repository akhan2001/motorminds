import { createClient } from '@/utils/supabase/client'
import type { 
    Appointment, 
    AppointmentWithDetails, 
    AppointmentCreateData, 
    AppointmentUpdateData,
    DateRange,
    AppointmentStats
} from '../types/appointment'
import type { WalkInVehicleInfo } from '../../customers/types/vehicle'

const supabase = createClient()

export class AppointmentService {
    
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
                customer_type,
                walk_in_vehicle_info,
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
                customer_type,
                walk_in_vehicle_info,
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
     * Create a walk-in appointment (no customer record)
     */
    static async createWalkInAppointment(data: {
        appointment: Omit<AppointmentCreateData, 'customer_id' | 'vehicle_id' | 'customer_type' | 'walk_in_vehicle_info'>
        walkInVehicleInfo: WalkInVehicleInfo
        vehicleId?: string | null
    }): Promise<Appointment> {
        // Validate required walk-in vehicle fields
        if (!data.walkInVehicleInfo.year || !data.walkInVehicleInfo.make || 
            !data.walkInVehicleInfo.model || !data.walkInVehicleInfo.license_plate) {
            throw new Error('Year, make, model, and license plate are required for walk-in customers')
        }

        // Generate confirmation code
        const confirmationCode = AppointmentService.generateConfirmationCode()

        const appointmentData: AppointmentCreateData = {
            ...data.appointment,
            customer_id: null,
            vehicle_id: data.vehicleId || null,
            customer_type: 'walk_in',
            walk_in_vehicle_info: data.walkInVehicleInfo,
        }

        const { data: appointmentResult, error } = await supabase
            .from('appointments')
            .insert({
                ...appointmentData,
                confirmation_code: confirmationCode
            })
            .select()
            .single()

        if (error) throw new Error(`Failed to create walk-in appointment: ${error.message}`)
        return appointmentResult
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

    static async createWorkOrderFromAppointment(appointmentId: string): Promise<string> {
        // Fetch appointment with all fields including customer_type and walk_in_vehicle_info
        // Explicitly select customer_type and walk_in_vehicle_info to ensure they're included
        const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select(`
                *,
                customer_type,
                walk_in_vehicle_info,
                customer:customers(*),
                vehicle:customer_vehicles(*)
            `)
            .eq('id', appointmentId)
            .single()
        
        if (fetchError || !appointment) {
            throw new Error('Appointment not found')
        }

        // Import WorkOrderService dynamically to avoid circular dependencies
        const { WorkOrderService } = await import('./work-order-service')
        const workOrderService = new WorkOrderService()

        const workOrderNumber = `WO-${Date.now()}`

        let workOrderId: string

        // Check customer_type - default to 'registered' if not set
        const customerType = appointment.customer_type || 'registered'
        const walkInVehicleInfo = appointment.walk_in_vehicle_info

        console.log('Creating work order from appointment:', {
            appointmentId,
            customerType,
            hasWalkInVehicleInfo: !!walkInVehicleInfo,
            walkInVehicleInfo
        })

        if (customerType === 'walk_in') {
            // Handle walk-in appointment
            if (!walkInVehicleInfo) {
                console.error('Walk-in appointment missing vehicle info:', appointment)
                throw new Error('Walk-in vehicle information is required. Please ensure the appointment has walk_in_vehicle_info set.')
            }

            // Validate walk-in vehicle info structure
            if (typeof walkInVehicleInfo !== 'object' || !walkInVehicleInfo.year || !walkInVehicleInfo.make || !walkInVehicleInfo.model) {
                console.error('Invalid walk-in vehicle info structure:', walkInVehicleInfo)
                throw new Error('Walk-in vehicle information is missing required fields (year, make, model)')
            }

            const vehicleDisplay = `${walkInVehicleInfo.year} ${walkInVehicleInfo.make} ${walkInVehicleInfo.model}${walkInVehicleInfo.license_plate ? ` (${walkInVehicleInfo.license_plate})` : ''}`

            // Convert appointment_date to timestamp for started_at
            // Combine appointment_date with start_time if available, otherwise use midnight
            const appointmentDateTime = appointment.start_time
                ? `${appointment.appointment_date}T${appointment.start_time}`
                : `${appointment.appointment_date}T00:00:00`
            const startedAt = new Date(appointmentDateTime).toISOString()

            console.log('Creating walk-in work order with:', {
                workOrderNumber,
                shop_id: appointment.shop_id,
                vehicle_id: appointment.vehicle_id,
                appointment_id: appointmentId,
                walkInVehicleInfo,
                started_at: startedAt
            })

            const workOrder = await workOrderService.createWalkInWorkOrder({
                workOrder: {
                    work_order_number: workOrderNumber,
                    shop_id: appointment.shop_id,
                    vehicle_id: appointment.vehicle_id || undefined,
                    appointment_id: appointmentId,
                    title: `${appointment.service_type} - ${vehicleDisplay}`,
                    notes: appointment.notes || undefined,
                    status: 'pending',
                    priority: 'medium',
                    tags: [],
                    attachments: [],
                    started_at: startedAt,
                },
                walkInVehicleInfo: walkInVehicleInfo,
            })

            console.log('Walk-in work order created successfully:', workOrder.id)
            workOrderId = workOrder.id
        } else {
            // Handle registered customer appointment
            const customer = Array.isArray(appointment.customer) ? appointment.customer[0] : appointment.customer
            const customerName = customer?.customer_name || 'Customer'

            // Convert appointment_date to timestamp for started_at
            // Combine appointment_date with start_time if available, otherwise use midnight
            const appointmentDateTime = appointment.start_time
                ? `${appointment.appointment_date}T${appointment.start_time}`
                : `${appointment.appointment_date}T00:00:00`
            const startedAt = new Date(appointmentDateTime).toISOString()

            const { data: workOrder, error } = await supabase
                .from('work_orders')
                .insert({
                    work_order_number: workOrderNumber,
                    shop_id: appointment.shop_id,
                    customer_id: appointment.customer_id,
                    vehicle_id: appointment.vehicle_id,
                    appointment_id: appointmentId,
                    title: `${appointment.service_type}`,
                    notes: appointment.notes,
                    status: 'pending',
                    priority: 'medium',
                    customer_type: 'registered',
                    started_at: startedAt,
                })
                .select()
                .single()

            if (error) throw new Error(`Failed to create work order: ${error.message}`)
            workOrderId = workOrder.id
        }

        await supabase
            .from('appointments')
            .update({ status: 'in_progress' })
            .eq('id', appointmentId)

        return workOrderId
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