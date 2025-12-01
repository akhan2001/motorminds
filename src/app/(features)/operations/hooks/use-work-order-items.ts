// React Query hooks for Work Order Items
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WorkOrderItemsService } from '../lib/work-order-items-service'
import type { WorkOrderItem, WorkOrderItemCreateData, WorkOrderItemFormData } from '../types/work-order-items'

// Query keys for work order items
export const workOrderItemKeys = {
    all: ['work-order-items'] as const,
    lists: () => [...workOrderItemKeys.all, 'list'] as const,
    list: (workOrderId: string) => [...workOrderItemKeys.lists(), workOrderId] as const,
    byShop: (shopId: string) => [...workOrderItemKeys.all, 'by-shop', shopId] as const,
    details: () => [...workOrderItemKeys.all, 'detail'] as const,
    detail: (id: string) => [...workOrderItemKeys.details(), id] as const,
    summary: (workOrderId: string) => [...workOrderItemKeys.all, 'summary', workOrderId] as const,
}

/**
 * Hook to fetch all items for a work order
 */
export function useWorkOrderItems(workOrderId: string) {
    return useQuery({
        queryKey: workOrderItemKeys.list(workOrderId),
        queryFn: () => WorkOrderItemsService.getWorkOrderItems(workOrderId),
        enabled: !!workOrderId,
        staleTime: 30 * 1000, // 30 seconds
    })
}

/**
 * Hook to fetch all work order items by shop ID
 */
export function useWorkOrderItemsByShop(shopId: string) {
    return useQuery({
        queryKey: workOrderItemKeys.byShop(shopId),
        queryFn: () => WorkOrderItemsService.getWorkOrderItemsByShopId(shopId),
        enabled: !!shopId,
        staleTime: 30 * 1000, // 30 seconds
    })
}

/**
 * Hook to fetch a single work order item
 */
export function useWorkOrderItem(itemId: string) {
    return useQuery({
        queryKey: workOrderItemKeys.detail(itemId),
        queryFn: () => WorkOrderItemsService.getWorkOrderItem(itemId),
        enabled: !!itemId,
        staleTime: 30 * 1000,
    })
}

/**
 * Hook to fetch work order items summary
 */
export function useWorkOrderItemsSummary(workOrderId: string) {
    return useQuery({
        queryKey: workOrderItemKeys.summary(workOrderId),
        queryFn: () => WorkOrderItemsService.getWorkOrderItemsSummary(workOrderId),
        enabled: !!workOrderId,
        staleTime: 30 * 1000,
    })
}

/**
 * Hook to create a new work order item
 */
export function useCreateWorkOrderItem() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: WorkOrderItemCreateData) =>
            WorkOrderItemsService.createWorkOrderItem(data),
        onSuccess: (newItem) => {
            // Invalidate and refetch work order items for this work order
            queryClient.invalidateQueries({ 
                queryKey: workOrderItemKeys.list(newItem.work_order_id) 
            })
            queryClient.invalidateQueries({ 
                queryKey: workOrderItemKeys.summary(newItem.work_order_id) 
            })
            
            // Note: Toast messages are handled by individual components
        },
        onError: (error: any) => {
            console.error('Failed to create work order item:', error)
            toast.error(error.message || 'Failed to create work order item')
        },
    })
}

/**
 * Hook to update a work order item
 */
export function useUpdateWorkOrderItem() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<WorkOrderItemFormData> }) =>
            WorkOrderItemsService.updateWorkOrderItem(id, data),
        onSuccess: (updatedItem) => {
            // Update the specific item in cache
            queryClient.setQueryData(
                workOrderItemKeys.detail(updatedItem.id),
                updatedItem
            )
            
            // Invalidate lists to refetch
            queryClient.invalidateQueries({ 
                queryKey: workOrderItemKeys.list(updatedItem.work_order_id) 
            })
            queryClient.invalidateQueries({ 
                queryKey: workOrderItemKeys.summary(updatedItem.work_order_id) 
            })
            
            // Note: Toast messages are handled by individual components
        },
        onError: (error: any) => {
            console.error('Failed to update work order item:', error)
            toast.error(error.message || 'Failed to update work order item')
        },
    })
}

/**
 * Hook to delete a work order item
 */
export function useDeleteWorkOrderItem() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (itemId: string) => WorkOrderItemsService.deleteWorkOrderItem(itemId),
        onMutate: async (itemId) => {
            // Get the item to know which work order to invalidate
            const item = queryClient.getQueryData<WorkOrderItem>(
                workOrderItemKeys.detail(itemId)
            )
            return { workOrderId: item?.work_order_id }
        },
        onSuccess: (_, itemId, context) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: workOrderItemKeys.detail(itemId) })
            
            // Invalidate lists to refetch if we know the work order ID
            if (context?.workOrderId) {
                queryClient.invalidateQueries({ 
                    queryKey: workOrderItemKeys.list(context.workOrderId) 
                })
                queryClient.invalidateQueries({ 
                    queryKey: workOrderItemKeys.summary(context.workOrderId) 
                })
            } else {
                // Fallback: invalidate all lists
                queryClient.invalidateQueries({ queryKey: workOrderItemKeys.lists() })
            }
            
            // Note: Toast messages are handled by individual components
        },
        onError: (error: any) => {
            console.error('Failed to delete work order item:', error)
            toast.error(error.message || 'Failed to delete work order item')
        },
    })
}

/**
 * Hook to complete a work order item
 */
export function useCompleteWorkOrderItem() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (itemId: string) => WorkOrderItemsService.completeWorkOrderItem(itemId),
        onSuccess: (updatedItem) => {
            // Update the specific item in cache
            queryClient.setQueryData(
                workOrderItemKeys.detail(updatedItem.id),
                updatedItem
            )
            
            // Invalidate lists to refetch
            queryClient.invalidateQueries({ 
                queryKey: workOrderItemKeys.list(updatedItem.work_order_id) 
            })
            
            toast.success('Work order item marked as completed')
        },
        onError: (error: any) => {
            console.error('Failed to complete work order item:', error)
            toast.error(error.message || 'Failed to complete work order item')
        },
    })
}

/**
 * Hook to duplicate items from one work order to another
 */
export function useDuplicateWorkOrderItems() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sourceWorkOrderId, targetWorkOrderId }: { 
            sourceWorkOrderId: string; 
            targetWorkOrderId: string 
        }) => WorkOrderItemsService.duplicateWorkOrderItems(sourceWorkOrderId, targetWorkOrderId),
        onSuccess: (duplicatedItems, { targetWorkOrderId }) => {
            // Invalidate lists for the target work order
            queryClient.invalidateQueries({ 
                queryKey: workOrderItemKeys.list(targetWorkOrderId) 
            })
            queryClient.invalidateQueries({ 
                queryKey: workOrderItemKeys.summary(targetWorkOrderId) 
            })
            
            toast.success(`${duplicatedItems.length} items duplicated successfully`)
        },
        onError: (error: any) => {
            console.error('Failed to duplicate work order items:', error)
            toast.error(error.message || 'Failed to duplicate work order items')
        },
    })
}
