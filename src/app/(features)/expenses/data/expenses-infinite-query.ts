/**
 * Infinite Query Hook for Expenses
 * 
 * NOTE: This file is kept for reference but pagination has been removed.
 * The expenses feature now fetches all expenses without pagination.
 * 
 * If infinite scroll is needed in the future, this can be updated to use ExpensesService.
 */

'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { ExpensesService } from '../lib/expenses-service'
import type { ExpenseItem, ExpenseFilters as ExpenseFiltersType } from '../types/expenses'
import { expenseKeys } from './keys'

export interface ExpenseFilters {
    search?: string
    startDate?: string  // YYYY-MM-DD format (maps to date_from)
    endDate?: string    // YYYY-MM-DD format (maps to date_to)
    vendor?: string     // Maps to vendor filter
    source_type?: 'work_order' | 'invoice' | 'general'
    category?: string
    work_order_id?: string
    invoice_id?: string
    archived?: boolean
}

export interface ExpensesInfiniteResponse {
    expenses: ExpenseItem[]
    total: number
    page: number
    limit: number
}

const DEFAULT_LIMIT = 50

/**
 * Fetches expenses directly from the expenses table (with pagination for infinite scroll)
 */
async function getExpenses(
    shopId: string,
    page: number,
    limit: number,
    filters: ExpenseFilters,
    signal?: AbortSignal
): Promise<ExpensesInfiniteResponse> {
    // Convert filters to ExpensesService format
    const serviceFilters: ExpenseFiltersType = {
        search: filters.search,
        date_from: filters.startDate,
        date_to: filters.endDate,
        vendor: filters.vendor,
        source_type: filters.source_type,
        category: filters.category,
        work_order_id: filters.work_order_id,
        invoice_id: filters.invoice_id,
        archived: filters.archived,
    }

    // For infinite scroll, we need pagination - but ExpensesService.getExpenses doesn't support it anymore
    // This would need to be updated if infinite scroll is re-enabled
    const response = await ExpensesService.getExpenses(shopId, serviceFilters)
    
    // For infinite scroll, we'd need to implement pagination in the service
    // For now, return all expenses (this hook is not actively used)
    return {
        expenses: response.expenses,
        total: response.total,
        page: 1,
        limit: response.total,
    }
}

/**
 * Infinite query hook for expenses with filters
 * 
 * NOTE: Currently not used since pagination was removed.
 * If infinite scroll is needed, update ExpensesService.getExpenses to support pagination.
 */
export function useExpensesInfiniteQuery(
    shopId: string | null,
    options?: {
        limit?: number
        filters?: ExpenseFilters
        enabled?: boolean
        keepPreviousData?: boolean
    }
) {
    const {
        limit = DEFAULT_LIMIT,
        filters = {},
        enabled = true,
        keepPreviousData = true,
    } = options || {}

    return useInfiniteQuery<ExpensesInfiniteResponse>({
        queryKey: expenseKeys.list(shopId, filters), // Using list key since infiniteList was removed
        queryFn: ({ signal, pageParam = 1 }) =>
            getExpenses(
                shopId!,
                pageParam as number,
                limit,
                filters,
                signal
            ),
        getNextPageParam(lastPage, pages) {
            const page = pages.length
            const currentTotalCount = page * limit
            const totalCount = lastPage.total
            
            // Return undefined when we've fetched all pages
            if (currentTotalCount >= totalCount) return undefined
            return page + 1  // Return next page number
        },
        enabled: enabled && !!shopId,
        staleTime: 30000, // 30 seconds
        ...(keepPreviousData && { placeholderData: (previousData) => previousData }),
    })
}
