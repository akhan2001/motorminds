'use client'

import { useQuery } from '@tanstack/react-query'
import { WorkOrderItemsService } from '../lib/work-order-items-service'

export function usePartsAndExpenses(shopId: string | null, page: number = 1, pageSize: number = 50) {
    return useQuery({
        queryKey: ['parts-expenses', shopId, page, pageSize],
        queryFn: async () => {
            if (!shopId) {
                throw new Error('Shop ID is required')
            }
            return WorkOrderItemsService.getPartsAndExpensesByShopId(shopId, { page, pageSize })
        },
        enabled: !!shopId,
        staleTime: 30000, // 30 seconds
    })
}

