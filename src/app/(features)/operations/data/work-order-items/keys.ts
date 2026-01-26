/**
 * React Query keys for work order items
 */
export const workOrderItemKeys = {
    all: ['work-order-items'] as const,
    lists: () => [...workOrderItemKeys.all, 'list'] as const,
    list: (workOrderId: string) => [...workOrderItemKeys.lists(), workOrderId] as const,
    details: () => [...workOrderItemKeys.all, 'detail'] as const,
    detail: (itemId: string) => [...workOrderItemKeys.details(), itemId] as const,
    workOrder: (workOrderId: string) => ['work-orders', workOrderId] as const,
    expenses: (workOrderId: string) => [...workOrderItemKeys.list(workOrderId), 'expenses'] as const,
}
