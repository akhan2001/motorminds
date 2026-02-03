'use client'

import { useQuery } from '@tanstack/react-query'
import type { UnifiedExpenseItem } from '@/app/api/operations/expenses/route'

export interface ExpenseFilters {
    search?: string
    startDate?: string  // YYYY-MM-DD format
    endDate?: string    // YYYY-MM-DD format
    supplier?: string
    itemType?: 'part' | 'expense' | 'general_expense' | ''
}

export interface UnifiedExpensesResponse {
    data: UnifiedExpenseItem[]
    count: number
    stats: {
        totalItems: number
        partsCount: number
        expensesCount: number
        generalExpensesCount: number
    }
    page: number
    pageSize: number
}

export function usePartsAndExpenses(
    shopId: string | null, 
    page: number = 1, 
    pageSize: number = 50,
    includeGeneralExpenses: boolean = false,
    filters: ExpenseFilters = {}
) {
    return useQuery<UnifiedExpensesResponse>({
        queryKey: ['parts-expenses', shopId, page, pageSize, includeGeneralExpenses, filters],
        queryFn: async () => {
            if (!shopId) {
                throw new Error('Shop ID is required')
            }
            
            const params = new URLSearchParams({
                shop_id: shopId,
                page: page.toString(),
                pageSize: pageSize.toString(),
                includeGeneral: includeGeneralExpenses.toString()
            })
            
            // Add filter params if they have values
            if (filters.search) params.set('search', filters.search)
            if (filters.startDate) params.set('startDate', filters.startDate)
            if (filters.endDate) params.set('endDate', filters.endDate)
            if (filters.supplier) params.set('supplier', filters.supplier)
            if (filters.itemType) params.set('itemType', filters.itemType)
            
            const response = await fetch(`/api/operations/expenses?${params}`)
            
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch expenses')
            }
            
            return response.json()
        },
        enabled: !!shopId,
        staleTime: 30000, // 30 seconds
    })
}

// Re-export the type for convenience
export type { UnifiedExpenseItem }