/**
 * Hook to fetch unique expense categories
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { ExpensesService } from '../lib/expenses-service'
import { expenseKeys } from '../data/keys'

export function useExpenseCategories(shopId: string | null) {
    return useQuery<string[]>({
        queryKey: [...expenseKeys.all(shopId), 'categories'],
        queryFn: () => ExpensesService.getUniqueCategories(shopId!),
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}
