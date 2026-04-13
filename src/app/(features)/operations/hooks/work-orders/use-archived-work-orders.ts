import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workOrderArchiveService } from '../../lib/work-order-archive-service'
import { workOrderKeys } from '../use-work-orders'
import { toast } from 'sonner'

export function useArchivedWorkOrders(shopId: string) {
    return useQuery({
        queryKey: [...workOrderKeys.list(shopId), 'archived'],
        queryFn: () => workOrderArchiveService.getArchivedWorkOrders(shopId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!shopId,
    })
}

export function useUnarchiveWorkOrder(shopId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (workOrderId: string) => workOrderArchiveService.unarchiveWorkOrder(workOrderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...workOrderKeys.list(shopId), 'archived'] })
            queryClient.invalidateQueries({ queryKey: workOrderKeys.list(shopId) })
            toast.success('Work order restored from archive')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to unarchive work order')
        },
    })
}

