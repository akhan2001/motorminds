import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppointmentService } from '../../lib/appointment-service'
import { toast } from 'sonner'
import type { 
    AppointmentWithDetails,
    CalendarAppointment,
    AppointmentCreateData,
    AppointmentUpdateData,
    DateRange 
} from '../../types/appointment'

// Query keys
export const appointmentKeys = {
    all: ['appointments'] as const,
    lists: () => [...appointmentKeys.all, 'list'] as const,
    list: (shopId: string, dateRange?: DateRange) => 
        [...appointmentKeys.lists(), shopId, dateRange] as const,
    details: () => [...appointmentKeys.all, 'detail'] as const,
    detail: (id: string) => [...appointmentKeys.details(), id] as const,
    stats: (shopId: string) => [...appointmentKeys.all, 'stats', shopId] as const,
}

/**
 * Hook to fetch appointments with details for a shop
 */
export const useAppointments = (
    shopId: string, 
    dateRange?: DateRange
) => {
    return useQuery({
        queryKey: appointmentKeys.list(shopId, dateRange),
        queryFn: () => AppointmentService.getAppointmentsWithDetails(shopId, dateRange),
        enabled: !!shopId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

/**
 * Hook to fetch appointments formatted for calendar component
 */
export const useCalendarAppointments = (
    shopId: string, 
    dateRange?: DateRange
) => {
    return useQuery({
        queryKey: [...appointmentKeys.list(shopId, dateRange), 'calendar'],
        queryFn: async (): Promise<CalendarAppointment[]> => {
            const appointments = await AppointmentService.getAppointmentsWithDetails(shopId, dateRange)
            
            // Transform appointments for calendar component
            return appointments.map(apt => ({
                ...apt,
                title: `${apt.customer?.customer_name} - ${apt.service_type}`,
                start: new Date(`${apt.appointment_date}T${apt.start_time || '09:00'}`),
                end: new Date(`${apt.appointment_date}T${apt.end_time || '10:00'}`)
            }))
        },
        enabled: !!shopId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

/**
 * Hook to fetch a single appointment by ID
 */
export const useAppointment = (appointmentId: string) => {
    return useQuery({
        queryKey: appointmentKeys.detail(appointmentId),
        queryFn: () => AppointmentService.getAppointmentById(appointmentId),
        enabled: !!appointmentId,
        staleTime: 30 * 1000, // 30 seconds
    })
}

/**
 * Hook to fetch appointment statistics
 */
export const useAppointmentStats = (shopId: string) => {
    return useQuery({
        queryKey: appointmentKeys.stats(shopId),
        queryFn: () => AppointmentService.getAppointmentStats(shopId),
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook to create a new appointment
 */
export const useCreateAppointment = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async (data: AppointmentCreateData) => {
            // Validation
            if (!data.customer_id || !data.vehicle_id || !data.appointment_date) {
                throw new Error('Missing required fields: customer, vehicle, or date')
            }

            if (!data.start_time || !data.end_time) {
                throw new Error('Missing required time fields')
            }

            // Check availability
            const isAvailable = await AppointmentService.checkTimeSlotAvailability(
                data.shop_id,
                data.appointment_date,
                data.start_time,
                data.end_time
            )

            if (!isAvailable) {
                throw new Error('Selected time slot is not available')
            }

            return AppointmentService.createAppointment(data)
        },
        onSuccess: (newAppointment) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.lists()
            })
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.stats(newAppointment.shop_id)
            })
            
            // Show success message
            toast.success('Appointment created successfully')
        },
        onError: (error: Error) => {
            console.error('Failed to create appointment:', error)
            toast.error(error.message || 'Failed to create appointment')
        }
    })
}

/**
 * Hook to create a walk-in appointment (no customer record)
 */
export const useCreateWalkInAppointment = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async (data: {
            appointment: Omit<AppointmentCreateData, 'customer_id' | 'vehicle_id' | 'customer_type' | 'walk_in_vehicle_info'>
            walkInVehicleInfo: { year: number; make: string; model: string; license_plate: string; color?: string; vin?: string; mileage?: number }
            vehicleId?: string | null
        }) => {
            // Validation
            if (!data.appointment.appointment_date) {
                throw new Error('Appointment date is required')
            }

            if (!data.appointment.start_time || !data.appointment.end_time) {
                throw new Error('Missing required time fields')
            }

            // Check availability
            const isAvailable = await AppointmentService.checkTimeSlotAvailability(
                data.appointment.shop_id,
                data.appointment.appointment_date,
                data.appointment.start_time,
                data.appointment.end_time
            )

            if (!isAvailable) {
                throw new Error('Selected time slot is not available')
            }

            return AppointmentService.createWalkInAppointment(data)
        },
        onSuccess: (newAppointment) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.lists()
            })
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.stats(newAppointment.shop_id)
            })
            
            // Show success message
            toast.success('Walk-in appointment created successfully')
        },
        onError: (error: Error) => {
            console.error('Failed to create walk-in appointment:', error)
            toast.error(error.message || 'Failed to create walk-in appointment')
        }
    })
}

/**
 * Hook to update an existing appointment
 */
export const useUpdateAppointment = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async ({ 
            id, 
            data 
        }: { 
            id: string
            data: AppointmentUpdateData 
        }) => {
            // If time is being updated, check availability
            if (data.start_time && data.end_time && data.appointment_date) {
                const isAvailable = await AppointmentService.checkTimeSlotAvailability(
                    '', // We'll need the shop_id - this should be passed in
                    data.appointment_date,
                    data.start_time,
                    data.end_time,
                    id // Exclude current appointment from availability check
                )

                if (!isAvailable) {
                    throw new Error('Selected time slot is not available')
                }
            }

            return AppointmentService.updateAppointment(id, data)
        },
        onSuccess: (updatedAppointment) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.lists()
            })
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.detail(updatedAppointment.id)
            })
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.stats(updatedAppointment.shop_id)
            })
            
            // Show success message
            toast.success('Appointment updated successfully')
        },
        onError: (error: Error) => {
            console.error('Failed to update appointment:', error)
            toast.error(error.message || 'Failed to update appointment')
        }
    })
}

/**
 * Hook to delete an appointment
 */
export const useDeleteAppointment = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: AppointmentService.deleteAppointment,
        onSuccess: (_, deletedId) => {
            // Invalidate and remove from cache
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.lists()
            })
            queryClient.removeQueries({
                queryKey: appointmentKeys.detail(deletedId)
            })
            
            // Show success message
            toast.success('Appointment deleted successfully')
        },
        onError: (error: Error) => {
            console.error('Failed to delete appointment:', error)
            toast.error(error.message || 'Failed to delete appointment')
        }
    })
}

/**
 * Hook to cancel an appointment
 */
export const useCancelAppointment = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: AppointmentService.cancelAppointment,
        onSuccess: (cancelledAppointment) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.lists()
            })
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.detail(cancelledAppointment.id)
            })
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.stats(cancelledAppointment.shop_id)
            })
            
            // Show success message
            toast.success('Appointment cancelled successfully')
        },
        onError: (error: Error) => {
            console.error('Failed to cancel appointment:', error)
            toast.error(error.message || 'Failed to cancel appointment')
        }
    })
}

/**
 * Hook to create a work order from an appointment
 */
export const useCreateWorkOrderFromAppointment = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: AppointmentService.createWorkOrderFromAppointment,
        onSuccess: (workOrderId, appointmentId) => {
            // Invalidate appointments to refresh status
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.lists()
            })
            queryClient.invalidateQueries({
                queryKey: appointmentKeys.detail(appointmentId)
            })
            
            // Show success message with navigation action
            toast.success('Work order created successfully!', {
                action: {
                    label: 'View Work Order',
                    onClick: () => window.location.href = `/operations/work-orders?id=${workOrderId}`
                }
            })
        },
        onError: (error: Error) => {
            console.error('Failed to create work order:', error)
            toast.error(error.message || 'Failed to create work order')
        }
    })
}

/**
 * Hook to get today's appointments
 */
export const useTodaysAppointments = (shopId: string) => {
    const today = new Date().toISOString().split('T')[0]
    
    return useAppointments(shopId, {
        start: today,
        end: today
    })
}

/**
 * Hook to get this week's appointments
 */
export const useThisWeekAppointments = (shopId: string) => {
    const getStartOfWeek = (date: Date): Date => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(d.setDate(diff))
    }

    const getEndOfWeek = (date: Date): Date => {
        const startOfWeek = getStartOfWeek(date)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        return endOfWeek
    }

    const startOfWeek = getStartOfWeek(new Date()).toISOString().split('T')[0]
    const endOfWeek = getEndOfWeek(new Date()).toISOString().split('T')[0]
    
    return useAppointments(shopId, {
        start: startOfWeek,
        end: endOfWeek
    })
}
