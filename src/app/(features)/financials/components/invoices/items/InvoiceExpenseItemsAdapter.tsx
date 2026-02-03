'use client'

import { forwardRef } from 'react'
import { ExpenseItemsList, type ExpenseItemsListRef } from '@/app/(features)/expenses/components/ExpenseItemsList'

interface InvoiceExpenseItemsAdapterProps {
    /** @deprecated No longer used - ExpenseItemsList manages its own state */
    items?: any[]
    /** @deprecated No longer used - ExpenseItemsList manages its own state */
    onItemsChange?: (items: any[]) => void
    isEditing?: boolean
    /** When editing an existing invoice, pass invoice id to use unified ExpenseItemsList (expenses table) */
    invoiceId?: string | null
    /** When invoice is linked to a work order */
    workOrderId?: string | null
}

/**
 * Adapter for expense items on invoices.
 * Always uses ExpenseItemsList backed by the unified expenses table.
 * For create flow (no invoiceId), expenses are persisted after invoice creation via ref.
 */
export const InvoiceExpenseItemsAdapter = forwardRef<ExpenseItemsListRef, InvoiceExpenseItemsAdapterProps>(function InvoiceExpenseItemsAdapter({
    isEditing = true,
    invoiceId,
    workOrderId,
}, ref) {
    // Always use unified ExpenseItemsList
    return (
        <ExpenseItemsList
            ref={ref}
            invoiceId={invoiceId ?? null}
            workOrderId={workOrderId ?? null}
            sourceType={workOrderId ? 'work_order' : invoiceId ? 'invoice' : 'general'}
            isEditing={isEditing}
        />
    )
})
