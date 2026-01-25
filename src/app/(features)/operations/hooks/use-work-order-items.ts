// React Query hooks for Work Order Items
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WorkOrderItemsService } from '../lib/work-order-items-service'
import type { WorkOrderItem, WorkOrderItemCreateData, WorkOrderItemFormData } from '../types/work-order-items'
import { useAuth } from './use-auth'

// Query keys for work order items (includes shopId for better cache isolation)
export const workOrderItemKeys = {
    all: (shopId: string) => ['work-order-items', shopId] as const,
    lists: (shopId: string) => [...workOrderItemKeys.all(shopId), 'list'] as const,
    list: (shopId: string, workOrderId: string) => [...workOrderItemKeys.lists(shopId), workOrderId] as const,
    byShop: (shopId: string) => [...workOrderItemKeys.all(shopId), 'by-shop', shopId] as const,
    details: (shopId: string) => [...workOrderItemKeys.all(shopId), 'detail'] as const,
    detail: (shopId: string, id: string) => [...workOrderItemKeys.details(shopId), id] as const,
    summary: (shopId: string, workOrderId: string) => [...workOrderItemKeys.all(shopId), 'summary', workOrderId] as const,
}

/**
 * Helper to invalidate all work order item queries for a work order
 */
export function invalidateWorkOrderItems(
    queryClient: ReturnType<typeof useQueryClient>,
    shopId: string | null,
    workOrderId: string
) {
    if (!shopId) return

    return Promise.all([
        queryClient.invalidateQueries({
            queryKey: workOrderItemKeys.list(shopId, workOrderId),
        }),
        queryClient.invalidateQueries({
            queryKey: workOrderItemKeys.summary(shopId, workOrderId),
        }),
        // Also invalidate work order to refresh totals
        queryClient.invalidateQueries({
            queryKey: ['work-orders', 'detail', workOrderId],
        }),
    ])
}

/**
 * Hook to fetch all items for a work order
 */
export function useWorkOrderItems(workOrderId: string) {
    const { shopId } = useAuth()
    
    return useQuery({
        queryKey: workOrderItemKeys.list(shopId || '', workOrderId),
        queryFn: () => WorkOrderItemsService.getWorkOrderItems(workOrderId),
        enabled: !!workOrderId && !!shopId,
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
    const { shopId } = useAuth()
    
    return useQuery({
        queryKey: workOrderItemKeys.detail(shopId || '', itemId),
        queryFn: () => WorkOrderItemsService.getWorkOrderItem(itemId),
        enabled: !!itemId && !!shopId,
        staleTime: 30 * 1000,
    })
}

/**
 * Hook to fetch work order items summary
 */
export function useWorkOrderItemsSummary(workOrderId: string) {
    const { shopId } = useAuth()
    
    return useQuery({
        queryKey: workOrderItemKeys.summary(shopId || '', workOrderId),
        queryFn: () => WorkOrderItemsService.getWorkOrderItemsSummary(workOrderId),
        enabled: !!workOrderId && !!shopId,
        staleTime: 30 * 1000,
    })
}

/**
 * Combined hook to fetch items and summary together
 */
export function useWorkOrderItemsWithSummary(workOrderId: string) {
    const itemsQuery = useWorkOrderItems(workOrderId)
    const summaryQuery = useWorkOrderItemsSummary(workOrderId)

    return {
        items: itemsQuery.data || [],
        summary: summaryQuery.data,
        isLoading: itemsQuery.isLoading || summaryQuery.isLoading,
        error: itemsQuery.error || summaryQuery.error,
        refetch: async () => {
            await Promise.all([itemsQuery.refetch(), summaryQuery.refetch()])
        },
    }
}

/**
 * Hook to create a new work order item with optimistic updates
 */
export function useCreateWorkOrderItem() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: (data: WorkOrderItemCreateData) =>
            WorkOrderItemsService.createWorkOrderItem(data),
        onMutate: async (newItem) => {
            if (!shopId) return { previousItems: undefined }

            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: workOrderItemKeys.list(shopId, newItem.work_order_id)
            })

            // Snapshot previous value
            const previousItems = queryClient.getQueryData<WorkOrderItem[]>(
                workOrderItemKeys.list(shopId, newItem.work_order_id)
            )

            // Optimistically update
            queryClient.setQueryData<WorkOrderItem[]>(
                workOrderItemKeys.list(shopId, newItem.work_order_id),
                (old: WorkOrderItem[] | undefined = []) => [...old, { ...newItem as any, id: 'temp-' + Date.now() }]
            )

            return { previousItems }
        },
        onError: (err, newItem, context) => {
            // Rollback on error
            if (context?.previousItems && shopId) {
                queryClient.setQueryData(
                    workOrderItemKeys.list(shopId, newItem.work_order_id),
                    context.previousItems
                )
            }
            console.error('Failed to create work order item:', err)
            toast.error(err instanceof Error ? err.message : 'Failed to create work order item')
        },
        onSuccess: (newItem) => {
            if (!shopId) return
            
            // Invalidate to refetch with real data
            invalidateWorkOrderItems(queryClient, shopId, newItem.work_order_id)
        },
        onSettled: (data, error, variables) => {
            if (!shopId) return
            
            // Always refetch to ensure consistency
            queryClient.invalidateQueries({
                queryKey: workOrderItemKeys.list(shopId, variables.work_order_id)
            })
        },
    })
}

/**
 * Hook to update a work order item with optimistic updates
 */
export function useUpdateWorkOrderItem() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<WorkOrderItemFormData> }) =>
            WorkOrderItemsService.updateWorkOrderItem(id, data),
        onMutate: async ({ id, data }) => {
            if (!shopId) return { previousItem: undefined, previousItems: undefined }

            // Cancel outgoing refetches
            const queryKey = workOrderItemKeys.detail(shopId, id)
            await queryClient.cancelQueries({ queryKey })

            // Snapshot previous values
            const previousItem = queryClient.getQueryData<WorkOrderItem>(queryKey)
            
            // Get work_order_id from previous item or fetch it
            let workOrderId: string | undefined
            if (previousItem) {
                workOrderId = previousItem.work_order_id
            } else {
                // Try to get from list cache
                const allLists = queryClient.getQueriesData<WorkOrderItem[]>({
                    queryKey: workOrderItemKeys.lists(shopId)
                })
                for (const [, items] of allLists) {
                    const item = items?.find(i => i.id === id)
                    if (item) {
                        workOrderId = item.work_order_id
                        break
                    }
                }
            }

            const previousItems = workOrderId 
                ? queryClient.getQueryData<WorkOrderItem[]>(
                    workOrderItemKeys.list(shopId, workOrderId)
                )
                : undefined

            // Optimistically update
            if (previousItem) {
                queryClient.setQueryData(queryKey, {
                    ...previousItem,
                    ...data,
                } as WorkOrderItem)
            }

            if (previousItems && workOrderId) {
                queryClient.setQueryData<WorkOrderItem[]>(
                    workOrderItemKeys.list(shopId, workOrderId),
                    (old: WorkOrderItem[] | undefined = []) => old.map((item: WorkOrderItem) => 
                        item.id === id ? { ...item, ...data } as WorkOrderItem : item
                    )
                )
            }

            return { previousItem, previousItems, workOrderId }
        },
        onError: (err, { id }, context) => {
            // Rollback on error
            if (context?.previousItem && shopId) {
                queryClient.setQueryData(
                    workOrderItemKeys.detail(shopId, id),
                    context.previousItem
                )
            }
            if (context?.previousItems && context.workOrderId && shopId) {
                queryClient.setQueryData(
                    workOrderItemKeys.list(shopId, context.workOrderId),
                    context.previousItems
                )
            }
            console.error('Failed to update work order item:', err)
            toast.error(err instanceof Error ? err.message : 'Failed to update work order item')
        },
        onSuccess: (updatedItem) => {
            if (!shopId) return

            // Update the specific item in cache
            queryClient.setQueryData(
                workOrderItemKeys.detail(shopId, updatedItem.id),
                updatedItem
            )
            
            // Invalidate lists to refetch
            invalidateWorkOrderItems(queryClient, shopId, updatedItem.work_order_id)
        },
        onSettled: (data, error, variables) => {
            if (!shopId) return

            // Always refetch to ensure consistency
            if (data) {
                queryClient.invalidateQueries({
                    queryKey: workOrderItemKeys.list(shopId, data.work_order_id)
                })
            }
        },
    })
}

/**
 * Hook to delete a work order item with optimistic updates
 */
export function useDeleteWorkOrderItem() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: (itemId: string) => WorkOrderItemsService.deleteWorkOrderItem(itemId),
        onMutate: async (itemId) => {
            if (!shopId) return { workOrderId: undefined, previousItems: undefined }

            // Get the item to know which work order to invalidate
            const item = queryClient.getQueryData<WorkOrderItem>(
                workOrderItemKeys.detail(shopId, itemId)
            )
            
            const workOrderId = item?.work_order_id
            if (!workOrderId) {
                return { workOrderId: undefined, previousItems: undefined }
            }

            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: workOrderItemKeys.list(shopId, workOrderId)
            })

            // Snapshot previous value
            const previousItems = queryClient.getQueryData<WorkOrderItem[]>(
                workOrderItemKeys.list(shopId, workOrderId)
            )

            // Optimistically remove from cache
            queryClient.setQueryData<WorkOrderItem[]>(
                workOrderItemKeys.list(shopId, workOrderId),
                (old = []) => old.filter(item => item.id !== itemId)
            )

            return { workOrderId, previousItems }
        },
        onError: (err, itemId, context) => {
            // Rollback on error
            if (context?.previousItems && context.workOrderId && shopId) {
                queryClient.setQueryData(
                    workOrderItemKeys.list(shopId, context.workOrderId),
                    context.previousItems
                )
            }
            console.error('Failed to delete work order item:', err)
            toast.error(err instanceof Error ? err.message : 'Failed to delete work order item')
        },
        onSuccess: (_, itemId, context) => {
            if (!shopId) return

            // Remove from cache
            queryClient.removeQueries({ queryKey: workOrderItemKeys.detail(shopId, itemId) })
            
            // Invalidate lists to refetch if we know the work order ID
            if (context?.workOrderId) {
                invalidateWorkOrderItems(queryClient, shopId, context.workOrderId)
            } else {
                // Fallback: invalidate all lists
                queryClient.invalidateQueries({ queryKey: workOrderItemKeys.lists(shopId) })
            }
        },
        onSettled: (_, __, ___, context) => {
            if (!shopId || !context?.workOrderId) return

            // Always refetch to ensure consistency
            queryClient.invalidateQueries({
                queryKey: workOrderItemKeys.list(shopId, context.workOrderId)
            })
        },
    })
}

/**
 * Hook to complete a work order item
 */
export function useCompleteWorkOrderItem() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: (itemId: string) => WorkOrderItemsService.completeWorkOrderItem(itemId),
        onSuccess: (updatedItem) => {
            if (!shopId) return

            // Update the specific item in cache
            queryClient.setQueryData(
                workOrderItemKeys.detail(shopId, updatedItem.id),
                updatedItem
            )
            
            // Invalidate lists to refetch
            invalidateWorkOrderItems(queryClient, shopId, updatedItem.work_order_id)
            
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
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: ({ sourceWorkOrderId, targetWorkOrderId }: { 
            sourceWorkOrderId: string; 
            targetWorkOrderId: string 
        }) => WorkOrderItemsService.duplicateWorkOrderItems(sourceWorkOrderId, targetWorkOrderId),
        onSuccess: (duplicatedItems, { targetWorkOrderId }) => {
            if (!shopId) return

            // Invalidate lists for the target work order
            invalidateWorkOrderItems(queryClient, shopId, targetWorkOrderId)
            
            toast.success(`${duplicatedItems.length} items duplicated successfully`)
        },
        onError: (error: any) => {
            console.error('Failed to duplicate work order items:', error)
            toast.error(error.message || 'Failed to duplicate work order items')
        },
    })
}
