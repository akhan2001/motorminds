// Custom hooks for work order data management
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workOrderService } from '../lib/work-order-service'
import type { WorkOrder, WorkOrderStatus } from '../types/work-order'
import { toast } from 'sonner'

// Query keys
export const workOrderKeys = {
    all: ['work-orders'] as const,
    lists: () => [...workOrderKeys.all, 'list'] as const,
    list: (shopId: string) => [...workOrderKeys.lists(), shopId] as const,
    details: () => [...workOrderKeys.all, 'detail'] as const,
    detail: (id: string) => [...workOrderKeys.details(), id] as const,
    byStatus: (shopId: string, status: WorkOrderStatus) => [...workOrderKeys.list(shopId), 'status', status] as const,
}

// Hooks for fetching work orders
export function useWorkOrders(shopId: string) {
    return useQuery({
        queryKey: workOrderKeys.list(shopId),
        queryFn: () => workOrderService.getWorkOrders(shopId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!shopId && shopId !== '', // Only enable if shopId is valid
    })
}

export function useWorkOrder(id: string) {
    return useQuery({
        queryKey: workOrderKeys.detail(id),
        queryFn: () => workOrderService.getWorkOrderById(id),
        staleTime: 5 * 60 * 1000,
        enabled: !!id,
    })
}

export function useWorkOrdersByStatus(shopId: string, status: WorkOrderStatus) {
    return useQuery({
        queryKey: workOrderKeys.byStatus(shopId, status),
        queryFn: () => workOrderService.getWorkOrdersByStatus(shopId, status),
        staleTime: 5 * 60 * 1000,
        enabled: !!shopId && !!status,
    })
}

export function useWorkOrdersWithDetails(shopId: string) {
    return useQuery({
        queryKey: [...workOrderKeys.list(shopId), 'with-details'],
        queryFn: () => workOrderService.getWorkOrdersWithDetails(shopId),
        staleTime: 5 * 60 * 1000,
        enabled: !!shopId && shopId !== '', // Only enable if shopId is valid (not empty)
    })
}

export function useWorkOrderWithDetails(workOrderId: string) {
    return useQuery({
        queryKey: [...workOrderKeys.detail(workOrderId), 'with-details'],
        queryFn: () => workOrderService.getWorkOrderWithDetailsById(workOrderId),
        staleTime: 5 * 60 * 1000,
        enabled: !!workOrderId,
        retry: false,
        refetchOnWindowFocus: false,
    })
}

// Mutation hooks for creating, updating, and deleting work orders
export function useCreateWorkOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>) => {
            // Generate work order number if not provided
            if (!data.work_order_number) {
                const workOrderNumber = await workOrderService.generateWorkOrderNumber(data.shop_id)
                data.work_order_number = workOrderNumber
            }

            return workOrderService.createWorkOrder(data)
        },
        onSuccess: (newWorkOrder) => {
            // Invalidate and refetch work orders
            queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
            queryClient.invalidateQueries({ queryKey: workOrderKeys.list(newWorkOrder.shop_id) })
            queryClient.invalidateQueries({ queryKey: [...workOrderKeys.list(newWorkOrder.shop_id), 'with-details'] })

            toast.success('Work order created successfully')
        },
        onError: (error: any) => {
            console.error('Failed to create work order:', error)
            toast.error(error.message || 'Failed to create work order')
        },
    })
}

// New mutation hook for creating work orders with customer/vehicle dependencies
export function useCreateWalkInWorkOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at' | 'customer_id' | 'vehicle_id' | 'customer_type' | 'walk_in_vehicle_info'>
            walkInVehicleInfo: any // WalkInVehicleInfo type
        }) => {
            // Generate work order number if not provided
            if (!data.workOrder.work_order_number) {
                const workOrderNumber = await workOrderService.generateWorkOrderNumber(data.workOrder.shop_id)
                data.workOrder.work_order_number = workOrderNumber
            }

            return workOrderService.createWalkInWorkOrder(data)
        },
        onSuccess: () => {
            // Invalidate and refetch work orders
            queryClient.invalidateQueries({ queryKey: ['work-orders'] })
            queryClient.invalidateQueries({ queryKey: ['work-orders-with-details'] })
        },
    })
}

export function useCreateWorkOrderWithDependencies() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at' | 'customer_id' | 'vehicle_id'>
            customer: {
                id?: string
                name: string
                email?: string
                phone?: string
                address?: string
            }
            vehicle: {
                id?: string
                year: string
                make: string
                model: string
                color?: string
                vin?: string
                license_plate?: string
                mileage?: string
            }
        }) => {
            // Generate work order number if not provided
            if (!data.workOrder.work_order_number) {
                const workOrderNumber = await workOrderService.generateWorkOrderNumber(data.workOrder.shop_id)
                data.workOrder.work_order_number = workOrderNumber
            }

            return workOrderService.createWorkOrderWithDependencies(data)
        },
        onSuccess: (newWorkOrder) => {
            // Invalidate and refetch work orders
            queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
            queryClient.invalidateQueries({ queryKey: workOrderKeys.list(newWorkOrder.shop_id) })
            queryClient.invalidateQueries({ queryKey: [...workOrderKeys.list(newWorkOrder.shop_id), 'with-details'] })

            toast.success('Work order created successfully')
        },
        onError: (error: any) => {
            console.error('Failed to create work order:', error)
            toast.error(error.message || 'Failed to create work order')
        },
    })
}

export function useUpdateWorkOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<WorkOrder> }) =>
            workOrderService.updateWorkOrder(id, data),
        onSuccess: (updatedWorkOrder) => {
            // Update specific work order in cache
            queryClient.setQueryData(
                workOrderKeys.detail(updatedWorkOrder.id),
                updatedWorkOrder
            )

            // Invalidate lists to refetch
            queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
            queryClient.invalidateQueries({ queryKey: workOrderKeys.list(updatedWorkOrder.shop_id) })

            // Invalidate the with-details query for this specific work order
            queryClient.invalidateQueries({
                queryKey: [...workOrderKeys.detail(updatedWorkOrder.id), 'with-details']
            })

            // toast.success('Work order updated successfully')
        },
        onError: (error: any) => {
            console.error('Failed to update work order:', error)
            toast.error(error.message || 'Failed to update work order')
        },
    })
}

export function useUpdateWorkOrderStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, status, enableAutomatedMessages }: { id: string; status: WorkOrderStatus; enableAutomatedMessages?: boolean }) =>
            workOrderService.updateWorkOrderStatus(id, status, enableAutomatedMessages),
        onSuccess: (_, { id }) => {
            // Invalidate all work order queries to refetch
            queryClient.invalidateQueries({ queryKey: workOrderKeys.all })

            toast.success('Work order status updated')
        },
        onError: (error: any) => {
            console.error('Failed to update work order status:', error)
            toast.error(error.message || 'Failed to update work order status')
        },
    })
}

export function useDeleteWorkOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => workOrderService.deleteWorkOrder(id),
        onSuccess: (_, deletedId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: workOrderKeys.detail(deletedId) })

            // Invalidate lists to refetch
            queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })

            // Invalidate appointments since archiving a work order may reset appointment status
            queryClient.invalidateQueries({ queryKey: ['appointments'] })

            toast.success('Work order archived successfully')
        },
        onError: (error: any) => {
            console.error('Failed to archive work order:', error)
            // Display the actual error message which includes permission denial
            toast.error(error.message || 'Failed to archive work order')
        },
    })
}

// Search hook with debouncing
export function useSearchWorkOrders(shopId: string, query: string) {
    return useQuery({
        queryKey: [...workOrderKeys.list(shopId), 'search', query],
        queryFn: () => workOrderService.searchWorkOrders(shopId, query),
        staleTime: 2 * 60 * 1000, // 2 minutes
        enabled: !!shopId && query.length > 2, // Only search if query is 3+ characters
    })
}
