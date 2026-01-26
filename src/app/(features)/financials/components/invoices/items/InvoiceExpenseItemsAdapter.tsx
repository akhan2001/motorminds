'use client'

import { useMemo, useCallback } from 'react'
import { WorkOrderExpenseItems } from '@/app/(features)/operations/components/work-orders/shared/items/expense-items/WorkOrderExpenseItems'
import type { InvoiceItem } from '../../../types/invoice'
import type { WorkOrderExpenseItemFormData } from '@/app/(features)/operations/lib/validations/work-order-expense-items'

interface InvoiceExpenseItemsAdapterProps {
    items: InvoiceItem[]
    onItemsChange: (items: InvoiceItem[]) => void
    isEditing?: boolean
}

/**
 * Adapter component that wraps WorkOrderExpenseItems for use in invoice forms.
 * Converts between InvoiceItem[] format and WorkOrderExpenseItemFormData[] format.
 */
export function InvoiceExpenseItemsAdapter({
    items,
    onItemsChange,
    isEditing = true
}: InvoiceExpenseItemsAdapterProps) {
    // Filter and convert invoice items to expense form items
    const expenseFormItems = useMemo((): WorkOrderExpenseItemFormData[] => {
        return items
            .filter(item => item.item_type === 'expense')
            .map(item => ({
                id: item.id,
                item_type: 'expense' as const,
                description: item.description,
                quantity: item.quantity || 1,
                unit_price: item.unit_price,
                total_price: item.total_price,
                unit_cost: null,
                total_cost: null,
                part_number: item.part_number || null,
                supplier: item.supplier || null,
                category: item.category || 'Parts/Inventory',
                warranty_period: item.warranty_period || null,
                notes: null,
                expense_subtotal: null,
                expense_tax_amount: null,
                expense_tax_included: true,
                expense_payment_method: null,
                expense_vendor: item.supplier || null,
                expense_invoice_number: null,
                expense_parts_description: null,
                expense_cost_date: new Date().toISOString().split('T')[0],
                is_billable: false,
            }))
    }, [items])

    // Handle changes from WorkOrderExpenseItems component
    const handleExpenseItemsChange = useCallback((expenseItems: WorkOrderExpenseItemFormData[]) => {
        // Get all non-expense items from the original array
        const nonExpenseItems = items.filter(item => item.item_type !== 'expense')

        // Convert expense form items back to invoice items
        const updatedExpenseItems: InvoiceItem[] = expenseItems.map(item => ({
            id: item.id,
            item_type: 'expense' as const,
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.unit_price,
            total_price: item.total_price,
            part_number: item.part_number || undefined,
            supplier: item.supplier || item.expense_vendor || undefined,
            category: item.category || undefined,
            warranty_period: item.warranty_period || undefined
        }))

        // Merge back: non-expense items + updated expense items
        onItemsChange([...nonExpenseItems, ...updatedExpenseItems])
    }, [items, onItemsChange])

    return (
        <WorkOrderExpenseItems
            items={expenseFormItems}
            onItemsChange={handleExpenseItemsChange}
            workOrderId={undefined} // No work order - invoice-only mode
            isEditing={isEditing}
        />
    )
}
