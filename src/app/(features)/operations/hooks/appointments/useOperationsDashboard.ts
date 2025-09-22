import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OperationsService } from '../../lib/operations-service'
import { AppointmentService } from '../../lib/appointment-service'
import { toast } from 'sonner'
import type { OperationsDashboardData, OperationsStats } from '../../lib/operations-service'
import type { AppointmentWithDetails, WorkOrderWithDetails } from '../../types/appointment'

// Query keys
export const operationsDashboardKeys = {
    all: ['operationsDashboard'] as const,
    dashboard: (shopId: string) => [...operationsDashboardKeys.all, 'dashboard', shopId] as const,
    stats: (shopId: string) => [...operationsDashboardKeys.all, 'stats', shopId] as const,
    upcoming: (shopId: string) => [...operationsDashboardKeys.all, 'upcoming', shopId] as const,
    overdue: (shopId: string) => [...operationsDashboardKeys.all, 'overdue', shopId] as const,
}

/**
 * Main hook for operations dashboard data
 * This is the primary hook that should be used on the dashboard page
 */
export const useOperationsDashboard = (shopId: string) => {
    return useQuery({
        queryKey: operationsDashboardKeys.dashboard(shopId),
        queryFn: () => OperationsService.getDashboardData(shopId),
        enabled: !!shopId,
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
        retry: 2,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    })
}

/**
 * Hook for operations statistics only
 * Useful for widgets that only need stats
 */
export const useOperationsStats = (shopId: string) => {
    return useQuery({
        queryKey: operationsDashboardKeys.stats(shopId),
        queryFn: () => OperationsService.getOperationsStats(shopId),
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    })
}

/**
 * Hook for upcoming appointments (next few hours)
 */
export const useUpcomingAppointments = (shopId: string, hours: number = 4) => {
    return useQuery({
        queryKey: operationsDashboardKeys.upcoming(shopId),
        queryFn: () => OperationsService.getUpcomingAppointments(shopId, hours),
        enabled: !!shopId,
        staleTime: 60 * 1000, // 1 minute
        refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    })
}

/**
 * Hook for overdue work orders
 */
export const useOverdueWorkOrders = (shopId: string) => {
    return useQuery({
        queryKey: operationsDashboardKeys.overdue(shopId),
        queryFn: () => OperationsService.getOverdueWorkOrders(shopId),
        enabled: !!shopId,
        staleTime: 10 * 60 * 1000, // 10 minutes
        refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
    })
}

/**
 * Hook to create work order from appointment
 */
export const useCreateWorkOrderFromAppointment = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async ({
            appointmentId,
            workOrderData
        }: {
            appointmentId: string
            workOrderData?: {
                title?: string
                description?: string
                priority?: 'low' | 'medium' | 'high' | 'urgent'
            }
        }) => {
            return OperationsService.createWorkOrderFromAppointment(appointmentId, workOrderData)
        },
        onSuccess: (newWorkOrder, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: operationsDashboardKeys.all
            })
            queryClient.invalidateQueries({
                queryKey: ['workOrders'] // Invalidate work orders queries
            })
            queryClient.invalidateQueries({
                queryKey: ['appointments'] // Invalidate appointments queries
            })
            
            // Show success message
            toast.success('Work order created from appointment successfully')
        },
        onError: (error: Error) => {
            console.error('Failed to create work order from appointment:', error)
            toast.error(error.message || 'Failed to create work order from appointment')
        }
    })
}

/**
 * Hook for real-time dashboard updates
 * This hook can be used to periodically refresh critical data
 */
export const useRealTimeDashboard = (shopId: string, intervalMs: number = 30000) => {
    const queryClient = useQueryClient()
    
    const refreshDashboard = () => {
        queryClient.invalidateQueries({
            queryKey: operationsDashboardKeys.dashboard(shopId)
        })
        queryClient.invalidateQueries({
            queryKey: operationsDashboardKeys.upcoming(shopId)
        })
    }

    // Use useQuery with a very short stale time to achieve real-time behavior
    return useQuery({
        queryKey: ['realTimeDashboard', shopId],
        queryFn: async () => {
            refreshDashboard()
            return new Date().toISOString()
        },
        enabled: !!shopId,
        refetchInterval: intervalMs,
        staleTime: 0, // Always consider stale
    })
}

/**
 * Hook for dashboard performance metrics
 * Provides insights into dashboard load times and data freshness
 */
export const useDashboardMetrics = (shopId: string) => {
    return useQuery({
        queryKey: ['dashboardMetrics', shopId],
        queryFn: async () => {
            const startTime = Date.now()
            
            try {
                await OperationsService.getDashboardData(shopId)
                const loadTime = Date.now() - startTime
                
                return {
                    loadTime,
                    timestamp: new Date().toISOString(),
                    status: 'success' as const
                }
            } catch (error) {
                const loadTime = Date.now() - startTime
                
                return {
                    loadTime,
                    timestamp: new Date().toISOString(),
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            }
        },
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false, // Don't retry for metrics
    })
}

/**
 * Hook to get dashboard alerts/notifications
 * Analyzes dashboard data to surface important alerts
 */
export const useDashboardAlerts = (shopId: string) => {
    const { data: dashboardData } = useOperationsDashboard(shopId)
    const { data: overdueWorkOrders } = useOverdueWorkOrders(shopId)
    const { data: upcomingAppointments } = useUpcomingAppointments(shopId, 2) // Next 2 hours
    
    return useQuery({
        queryKey: ['dashboardAlerts', shopId, dashboardData, overdueWorkOrders, upcomingAppointments],
        queryFn: async () => {
            const alerts: Array<{
                id: string
                type: 'warning' | 'error' | 'info'
                title: string
                message: string
                action?: {
                    label: string
                    handler: () => void
                }
            }> = []

            // Check for overdue work orders
            if (overdueWorkOrders && overdueWorkOrders.length > 0) {
                alerts.push({
                    id: 'overdue-work-orders',
                    type: 'warning',
                    title: 'Overdue Work Orders',
                    message: `${overdueWorkOrders.length} work order${overdueWorkOrders.length === 1 ? ' is' : 's are'} overdue`
                })
            }

            // Check for upcoming appointments
            if (upcomingAppointments && upcomingAppointments.length > 0) {
                alerts.push({
                    id: 'upcoming-appointments',
                    type: 'info',
                    title: 'Upcoming Appointments',
                    message: `${upcomingAppointments.length} appointment${upcomingAppointments.length === 1 ? '' : 's'} in the next 2 hours`
                })
            }

            // Check for high workload
            if (dashboardData) {
                const totalActiveWorkOrders = 
                    dashboardData.stats.workOrders.pending + 
                    dashboardData.stats.workOrders.inProgress

                if (totalActiveWorkOrders > 20) {
                    alerts.push({
                        id: 'high-workload',
                        type: 'warning',
                        title: 'High Workload',
                        message: `${totalActiveWorkOrders} active work orders may affect response times`
                    })
                }
            }

            return alerts
        },
        enabled: !!shopId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

/**
 * Hook for dashboard summary data
 * Provides a simplified view of key metrics for dashboard widgets
 */
export const useDashboardSummary = (shopId: string) => {
    const { data: dashboardData, isLoading, error } = useOperationsDashboard(shopId)
    
    if (isLoading || error || !dashboardData) {
        return {
            data: null,
            isLoading,
            error
        }
    }

    const summary = {
        todayAppointments: dashboardData.todaysAppointments.length,
        weekAppointments: dashboardData.thisWeekAppointments.length,
        activeWorkOrders: dashboardData.activeWorkOrders.length,
        pendingWorkOrders: dashboardData.stats.workOrders.pending,
        inProgressWorkOrders: dashboardData.stats.workOrders.inProgress,
        completedWorkOrders: dashboardData.stats.workOrders.completed,
        todayRevenue: dashboardData.stats.revenue.today,
        weekRevenue: dashboardData.stats.revenue.thisWeek,
        monthRevenue: dashboardData.stats.revenue.thisMonth,
        avgCompletionTime: dashboardData.stats.efficiency.averageCompletionTime,
        onTimeRate: dashboardData.stats.efficiency.onTimeCompletionRate
    }

    return {
        data: summary,
        isLoading: false,
        error: null
    }
}
