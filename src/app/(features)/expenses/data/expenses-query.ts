/**
 * Query Hook for Expenses (No Pagination)
 * 
 * Fetches all expenses matching filters without pagination.
 * Works directly with the expenses table.
 */

'use client'

import { useQuery } from '@tanstack/react-query'
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

export interface ExpensesQueryResponse {
    expenses: ExpenseItem[]
    total: number
    stats?: {
        totalExpenses: number
        workOrderExpenses: number
        invoiceExpenses: number
        generalExpenses: number
    }
}

/**
 * Calculates stats from expenses array
 */
function calculateStats(expenses: ExpenseItem[]): ExpensesQueryResponse['stats'] {
    return {
        totalExpenses: expenses.length,
        workOrderExpenses: expenses.filter(e => e.source_type === 'work_order').length,
        invoiceExpenses: expenses.filter(e => e.source_type === 'invoice').length,
        generalExpenses: expenses.filter(e => e.source_type === 'general').length,
    }
}

/**
 * Fetches expenses directly from the expenses table (no pagination)
 * 
 * Date filtering: Dates are filtered by date-only (no time component).
 * The expense_date field is a DATE type in PostgreSQL, so comparisons are date-only.
 * Filter values should be in YYYY-MM-DD format.
 */
async function getExpenses(
    shopId: string,
    filters: ExpenseFilters,
    signal?: AbortSignal
): Promise<ExpensesQueryResponse> {
    // Convert filters to ExpensesService format
    // Ensure dates are in YYYY-MM-DD format (date only, no time)
    const serviceFilters: ExpenseFiltersType = {
        search: filters.search,
        date_from: filters.startDate ? filters.startDate.split('T')[0] : undefined, // Ensure date-only
        date_to: filters.endDate ? filters.endDate.split('T')[0] : undefined, // Ensure date-only
        vendor: filters.vendor,
        source_type: filters.source_type,
        category: filters.category,
        work_order_id: filters.work_order_id,
        invoice_id: filters.invoice_id,
        archived: filters.archived,
    }

    const response = await ExpensesService.getExpenses(shopId, serviceFilters)
    
    // Calculate stats from the expenses
    const stats = calculateStats(response.expenses)
    
    return {
        expenses: response.expenses,
        total: response.total,
        stats,
    }
}

/**
 * Query hook for expenses with filters (no pagination)
 * 
 * Fetches all expenses matching the filters.
 * Works directly with expenses table.
 */
export function useExpensesQuery(
    shopId: string | null,
    options?: {
        filters?: ExpenseFilters
        enabled?: boolean
    }
) {
    const {
        filters = {},
        enabled = true,
    } = options || {}

    return useQuery<ExpensesQueryResponse>({
        queryKey: expenseKeys.list(shopId, {
            ...filters,
        }),
        queryFn: ({ signal }) =>
            getExpenses(
                shopId!,
                filters,
                signal
            ),
        enabled: enabled && !!shopId,
        staleTime: 30000, // 30 seconds
    })
}
