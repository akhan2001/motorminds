import { createClient } from '@/utils/supabase/client'
import { AppointmentService } from './appointment-service'
import { workOrderService } from './work-order-service'
import type { AppointmentStats, AppointmentWithDetails } from '../types/appointment'
import type { WorkOrderWithDetails } from '../types/work-order'

const supabase = createClient()

export interface OperationsDashboardData {
    todaysAppointments: AppointmentWithDetails[]
    thisWeekAppointments: AppointmentWithDetails[]
    activeWorkOrders: WorkOrderWithDetails[]
    stats: OperationsStats
}

export interface OperationsStats {
    appointments: AppointmentStats
    workOrders: {
        pending: number
        inProgress: number
        completed: number
        total: number
    }
    revenue: {
        today: number
        thisWeek: number
        thisMonth: number
    }
    efficiency: {
        averageCompletionTime: number // in hours
        onTimeCompletionRate: number // percentage
    }
}

export class OperationsService {
    
    /**
     * Get comprehensive dashboard data for operations
     */
    static async getDashboardData(shopId: string): Promise<OperationsDashboardData> {
        try {
            const today = new Date().toISOString().split('T')[0]
            const startOfWeek = this.getStartOfWeek(new Date()).toISOString().split('T')[0]
            const endOfWeek = this.getEndOfWeek(new Date()).toISOString().split('T')[0]

            // Fetch data in parallel for better performance
            const [
                todaysAppointments,
                thisWeekAppointments,
                activeWorkOrders,
                stats
            ] = await Promise.all([
                AppointmentService.getAppointmentsWithDetails(shopId, {
                    start: today,
                    end: today
                }),
                AppointmentService.getAppointmentsWithDetails(shopId, {
                    start: startOfWeek,
                    end: endOfWeek
                }),
                workOrderService.getActiveWorkOrders(shopId),
                this.getOperationsStats(shopId)
            ])

            return {
                todaysAppointments,
                thisWeekAppointments,
                activeWorkOrders,
                stats
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            throw new Error(`Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Get operations statistics
     */
    static async getOperationsStats(shopId: string): Promise<OperationsStats> {
        try {
            const [appointmentStats, workOrderStats, revenueStats, efficiencyStats] = await Promise.all([
                AppointmentService.getAppointmentStats(shopId),
                this.getWorkOrderStats(shopId),
                this.getRevenueStats(shopId),
                this.getEfficiencyStats(shopId)
            ])

            return {
                appointments: appointmentStats,
                workOrders: workOrderStats,
                revenue: revenueStats,
                efficiency: efficiencyStats
            }
        } catch (error) {
            console.error('Error fetching operations stats:', error)
            throw new Error(`Failed to fetch operations stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Get work order statistics
     */
    private static async getWorkOrderStats(shopId: string) {
        const { data: workOrders, error } = await supabase
            .from('work_orders')
            .select('status')
            .eq('shop_id', shopId)

        if (error) throw new Error(`Failed to fetch work order stats: ${error.message}`)

        const orders = workOrders || []
        
        return {
            pending: orders.filter(wo => wo.status === 'pending' || wo.status === 'approved').length,
            inProgress: orders.filter(wo => 
                wo.status === 'in_progress' || 
                wo.status === 'waiting_parts' || 
                wo.status === 'waiting_customer'
            ).length,
            completed: orders.filter(wo => wo.status === 'completed' || wo.status === 'invoiced').length,
            total: orders.length
        }
    }

    /**
     * Get revenue statistics
     * TODO: Implement proper revenue calculation when database schema is ready
     */
    private static async getRevenueStats(shopId: string) {
        // For now, return zero values since the revenue calculation requires
        // a proper database schema with total_price/total_cost columns
        // or a more complex calculation from work_order_items
        
        console.info('Revenue calculation not yet implemented - returning zero values')
        
        return {
            today: 0,
            thisWeek: 0,
            thisMonth: 0
        }
    }

    /**
     * Get efficiency statistics
     */
    private static async getEfficiencyStats(shopId: string) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0]

        // Get completed work orders from the last 30 days
        const { data: completedOrders, error } = await supabase
            .from('work_orders')
            .select('created_at, completed_at, appointment_id')
            .eq('shop_id', shopId)
            .eq('status', 'completed')
            .not('completed_at', 'is', null)
            .gte('completed_at', thirtyDaysAgo)

        if (error) throw new Error(`Failed to fetch efficiency stats: ${error.message}`)

        const orders = completedOrders || []
        
        if (orders.length === 0) {
            return {
                averageCompletionTime: 0,
                onTimeCompletionRate: 0
            }
        }

        // Calculate average completion time
        const completionTimes = orders.map(order => {
            const created = new Date(order.created_at).getTime()
            const completed = new Date(order.completed_at!).getTime()
            return (completed - created) / (1000 * 60 * 60) // Convert to hours
        })

        const averageCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length

        // Calculate on-time completion rate (assuming expected completion within 24 hours)
        const onTimeCount = completionTimes.filter(time => time <= 24).length
        const onTimeCompletionRate = (onTimeCount / orders.length) * 100

        return {
            averageCompletionTime: Math.round(averageCompletionTime * 10) / 10, // Round to 1 decimal
            onTimeCompletionRate: Math.round(onTimeCompletionRate * 10) / 10 // Round to 1 decimal
        }
    }

    /**
     * Get upcoming appointments for the next few hours
     */
    static async getUpcomingAppointments(shopId: string, hours: number = 4): Promise<AppointmentWithDetails[]> {
        const now = new Date()
        const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000)
        
        const today = now.toISOString().split('T')[0]
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const futureTimeStr = `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`

        const appointments = await AppointmentService.getAppointmentsWithDetails(shopId, {
            start: today,
            end: today
        })

        return appointments.filter(apt => {
            if (!apt.start_time) return false
            return apt.start_time >= currentTime && apt.start_time <= futureTimeStr
        })
    }

    /**
     * Get overdue work orders
     */
    static async getOverdueWorkOrders(shopId: string): Promise<WorkOrderWithDetails[]> {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0]

        const { data: overdueOrders, error } = await supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(id, customer_name, customer_email, customer_phone),
                vehicle:customer_vehicles(id, year, make, model, license_plate),
                technician:employees(id, first_name, last_name)
            `)
            .eq('shop_id', shopId)
            .in('status', ['pending', 'in_progress', 'waiting_parts', 'waiting_customer'])
            .lt('created_at', twoDaysAgo)

        if (error) throw new Error(`Failed to fetch overdue work orders: ${error.message}`)

        return overdueOrders || []
    }

    /**
     * Helper function to get start of week (Monday)
     */
    private static getStartOfWeek(date: Date): Date {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
        return new Date(d.setDate(diff))
    }

    /**
     * Helper function to get end of week (Sunday)
     */
    private static getEndOfWeek(date: Date): Date {
        const startOfWeek = this.getStartOfWeek(date)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        return endOfWeek
    }

    /**
     * Create work order from appointment
     */
    static async createWorkOrderFromAppointment(
        appointmentId: string,
        workOrderData?: {
            title?: string
            description?: string
            priority?: 'low' | 'medium' | 'high' | 'urgent'
        }
    ) {
        try {
            // Get appointment details
            const appointment = await AppointmentService.getAppointmentById(appointmentId)
            if (!appointment) {
                throw new Error('Appointment not found')
            }

            // Create work order
            const workOrderPayload = {
                workOrder: {
                    work_order_number: '', // Will be auto-generated
                    title: workOrderData?.title || `${appointment.service_type} - ${appointment.customer.customer_name}`,
                    description: workOrderData?.description || appointment.notes || `${appointment.service_type} appointment`,
                    status: 'pending' as const,
                    priority: workOrderData?.priority || 'medium' as const,
                    shop_id: appointment.shop_id,
                    appointment_id: appointment.id,
                    tags: [appointment.service_type],
                    attachments: [],
                },
                customer: {
                    id: appointment.customer_id,
                    name: appointment.customer.customer_name,
                    email: appointment.customer.customer_email,
                    phone: appointment.customer.customer_phone,
                },
                vehicle: {
                    id: appointment.vehicle_id,
                    year: appointment.vehicle.year?.toString() || new Date().getFullYear().toString(),
                    make: appointment.vehicle.make || 'Unknown',
                    model: appointment.vehicle.model || 'Unknown',
                    color: appointment.vehicle.color,
                    vin: appointment.vehicle.vin,
                    license_plate: appointment.vehicle.license_plate,
                    mileage: appointment.vehicle.mileage?.toString(),
                }
            }

            return await workOrderService.createWorkOrderWithDependencies(workOrderPayload)
        } catch (error) {
            console.error('Error creating work order from appointment:', error)
            throw new Error(`Failed to create work order from appointment: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }
}
