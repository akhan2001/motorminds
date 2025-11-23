import { useQuery } from '@tanstack/react-query'
import { workOrderArchiveService } from '../lib/work-order-archive-service'
import { workOrderKeys } from './use-work-orders'

export function useArchivedWorkOrders(shopId: string) {
    return useQuery({
        queryKey: [...workOrderKeys.list(shopId), 'archived'],
        queryFn: () => workOrderArchiveService.getArchivedWorkOrders(shopId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!shopId,
    })
}
