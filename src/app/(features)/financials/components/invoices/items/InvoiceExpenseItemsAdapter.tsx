'use client'

import { useMemo, useCallback, useRef, useEffect } from 'react'
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
 * 
 * Uses a cache to preserve expense-specific fields that InvoiceItem doesn't support,
 * preventing infinite update loops caused by data loss during conversion.
 */
export function InvoiceExpenseItemsAdapter({
    items,
    onItemsChange,
    isEditing = true
}: InvoiceExpenseItemsAdapterProps) {
    // Use a ref to track the latest items without causing callback recreation
    const itemsRef = useRef(items)
    
    // Cache to preserve expense-specific fields that InvoiceItem doesn't have
    // This prevents infinite loops by ensuring data round-trips correctly
    const expenseDataCacheRef = useRef<Map<string, Partial<WorkOrderExpenseItemFormData>>>(new Map())
    
    // Update items ref whenever items change
    useEffect(() => {
        itemsRef.current = items
    }, [items])

    // Filter and convert invoice items to expense form items
    // Uses cache to preserve expense-specific fields
    const expenseFormItems = useMemo((): WorkOrderExpenseItemFormData[] => {
        const today = new Date().toISOString().split('T')[0]
        
        const result = items
            .filter(item => item.item_type === 'expense')
            .map(item => {
                // Get cached expense-specific data if available
                const cached = expenseDataCacheRef.current.get(item.id)
                // Cast to access expense-specific fields stored on invoice item
                const itemAny = item as any;
                
                return {
                    id: item.id,
                    item_type: 'expense' as const,
                    description: item.description,
                    quantity: item.quantity || 1,
                    unit_price: item.unit_price,
                    total_price: item.total_price,
                    unit_cost: cached?.unit_cost ?? itemAny.unit_cost ?? null,
                    total_cost: cached?.total_cost ?? itemAny.total_cost ?? null,
                    part_number: item.part_number || null,
                    supplier: item.supplier || null,
                    category: item.category || 'Parts/Inventory',
                    warranty_period: item.warranty_period || null,
                    // Read from cache first, then from item (expense fields now stored on invoice item)
                    notes: cached?.notes ?? itemAny.notes ?? null,
                    expense_subtotal: cached?.expense_subtotal ?? itemAny.expense_subtotal ?? null,
                    expense_tax_amount: cached?.expense_tax_amount ?? itemAny.expense_tax_amount ?? null,
                    expense_tax_included: cached?.expense_tax_included ?? itemAny.expense_tax_included ?? true,
                    // Use cached value, item value, or default to 'credit_card' to match createDefaultExpenseItem
                    expense_payment_method: cached?.expense_payment_method ?? itemAny.expense_payment_method ?? 'credit_card',
                    expense_vendor: cached?.expense_vendor ?? itemAny.expense_vendor ?? item.supplier ?? null,
                    expense_invoice_number: cached?.expense_invoice_number ?? itemAny.expense_invoice_number ?? null,
                    expense_parts_description: cached?.expense_parts_description ?? itemAny.expense_parts_description ?? null,
                    expense_cost_date: cached?.expense_cost_date ?? itemAny.expense_cost_date ?? today,
                    is_billable: false as const,
                }
            })
        
        return result
    }, [items])

    // Handle changes from WorkOrderExpenseItems component
    // Caches expense-specific data and converts to InvoiceItem format
    const handleExpenseItemsChange = useCallback((expenseItems: WorkOrderExpenseItemFormData[]) => {
        // Update cache with expense-specific fields before conversion
        // This preserves data that InvoiceItem doesn't support
        expenseItems.forEach(item => {
            expenseDataCacheRef.current.set(item.id, {
                unit_cost: item.unit_cost,
                total_cost: item.total_cost,
                notes: item.notes,
                expense_subtotal: item.expense_subtotal,
                expense_tax_amount: item.expense_tax_amount,
                expense_tax_included: item.expense_tax_included,
                expense_payment_method: item.expense_payment_method,
                expense_vendor: item.expense_vendor,
                expense_invoice_number: item.expense_invoice_number,
                expense_parts_description: item.expense_parts_description,
                expense_cost_date: item.expense_cost_date,
            })
        })
        
        // Clean up cache for removed items
        const currentIds = new Set(expenseItems.map(item => item.id))
        expenseDataCacheRef.current.forEach((_, id) => {
            if (!currentIds.has(id)) {
                expenseDataCacheRef.current.delete(id)
            }
        })

        // Get all non-expense items from the current items (via ref)
        const nonExpenseItems = itemsRef.current.filter(item => item.item_type !== 'expense')

        // Convert expense form items back to invoice items (include expense-specific fields for persistence)
        const updatedExpenseItems = expenseItems.map(item => ({
            id: item.id,
            item_type: 'expense' as const,
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.unit_price,
            total_price: item.total_price,
            unit_cost: item.unit_cost ?? undefined,
            total_cost: item.total_cost ?? undefined,
            part_number: item.part_number || undefined,
            supplier: item.supplier || item.expense_vendor || undefined,
            category: item.category || undefined,
            warranty_period: item.warranty_period || undefined,
            // Expense-specific fields - MUST be included for persistence
            notes: item.notes || undefined,
            expense_subtotal: item.expense_subtotal ?? undefined,
            expense_tax_amount: item.expense_tax_amount ?? undefined,
            expense_tax_included: item.expense_tax_included,
            expense_payment_method: item.expense_payment_method || undefined,
            expense_vendor: item.expense_vendor || undefined,
            expense_invoice_number: item.expense_invoice_number || undefined,
            expense_parts_description: item.expense_parts_description || undefined,
            expense_cost_date: item.expense_cost_date || undefined,
        }))

        // Merge back: non-expense items + updated expense items
        onItemsChange([...nonExpenseItems, ...updatedExpenseItems])
    }, [onItemsChange])

    return (
        <WorkOrderExpenseItems
            items={expenseFormItems}
            onItemsChange={handleExpenseItemsChange}
            workOrderId={undefined} // No work order - invoice-only mode
            isEditing={isEditing}
        />
    )
}
