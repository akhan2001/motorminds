/**
 * React Query Keys for Expenses Data
 * 
 * Centralized key management following Supabase Studio patterns.
 * Keys include scope information for proper cache isolation.
 */

export const expenseKeys = {
    // Base key for all expense queries
    all: (shopId: string | null) => ['expenses', shopId].filter(Boolean) as const,

    // List queries
    lists: (shopId: string | null) => [...expenseKeys.all(shopId), 'list'] as const,
    
    list: (
        shopId: string | null,
        params?: {
            search?: string
            startDate?: string
            endDate?: string
            vendor?: string
            source_type?: 'work_order' | 'invoice' | 'general'
            category?: string
            work_order_id?: string
            invoice_id?: string
            archived?: boolean
        }
    ) => [...expenseKeys.lists(shopId), params] as const,


    // Single expense queries
    details: (shopId: string | null) => [...expenseKeys.all(shopId), 'detail'] as const,
    detail: (shopId: string | null, id: string) => [...expenseKeys.details(shopId), id] as const,

    // By work order
    byWorkOrder: (shopId: string | null, workOrderId: string | null) =>
        [...expenseKeys.all(shopId), 'work-order', workOrderId].filter(Boolean) as const,

    // By invoice
    byInvoice: (shopId: string | null, invoiceId: string | null) =>
        [...expenseKeys.all(shopId), 'invoice', invoiceId].filter(Boolean) as const,

    // Summary/Stats
    summary: (shopId: string | null, dateFrom?: string, dateTo?: string) =>
        [...expenseKeys.all(shopId), 'summary', dateFrom, dateTo].filter(Boolean) as const,
}

/**
 * Invalidation helpers
 */
export const expenseInvalidations = {
    // Invalidate all expense lists (after create/update/delete)
    allLists: (shopId: string | null) => expenseKeys.lists(shopId),
    
    // Invalidate specific list with filters
    list: (
        shopId: string | null,
        params?: {
            search?: string
            startDate?: string
            endDate?: string
            vendor?: string
            source_type?: 'work_order' | 'invoice' | 'general'
            category?: string
            work_order_id?: string
            invoice_id?: string
            archived?: boolean
        }
    ) => expenseKeys.list(shopId, params),
    
    // Invalidate by work order
    byWorkOrder: (shopId: string | null, workOrderId: string | null) =>
        expenseKeys.byWorkOrder(shopId, workOrderId),
    
    // Invalidate by invoice
    byInvoice: (shopId: string | null, invoiceId: string | null) =>
        expenseKeys.byInvoice(shopId, invoiceId),
    
    // Invalidate all (nuclear option)
    all: (shopId: string | null) => expenseKeys.all(shopId),
}
