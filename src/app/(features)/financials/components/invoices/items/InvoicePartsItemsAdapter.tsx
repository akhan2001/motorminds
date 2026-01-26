'use client'

import { useMemo, useCallback } from 'react'
import { WorkOrderPartsItems } from '@/app/(features)/operations/components/work-orders/shared/items/WorkOrderPartsItems'
import type { InvoiceItem } from '../../../types/invoice'

// Part form item format used by WorkOrderPartsItems
interface PartFormItem {
    id: string
    description: string
    part_number?: string
    quantity: number
    unit_price: number
    total_price: number
    unit_cost?: number
    total_cost?: number
    supplier?: string
    category?: string
    warranty_period?: string
    notes?: string
}

interface InvoicePartsItemsAdapterProps {
    items: InvoiceItem[]
    onItemsChange: (items: InvoiceItem[]) => void
    isEditing?: boolean
}

/**
 * Adapter component that wraps WorkOrderPartsItems for use in invoice forms.
 * Converts between InvoiceItem[] format and PartFormItem[] format.
 */
export function InvoicePartsItemsAdapter({
    items,
    onItemsChange,
    isEditing = true
}: InvoicePartsItemsAdapterProps) {
    // Filter and convert invoice items to part form items
    const partFormItems = useMemo(() => {
        return items
            .filter(item => item.item_type === 'part')
            .map(item => ({
                id: item.id,
                description: item.description,
                part_number: item.part_number || '',
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                unit_cost: undefined,
                total_cost: undefined,
                supplier: item.supplier || '',
                category: item.category || '',
                warranty_period: item.warranty_period || '',
                notes: ''
            }))
    }, [items])

    // Handle changes from WorkOrderPartsItems component
    const handlePartsItemsChange = useCallback((partItems: PartFormItem[]) => {
        // Get all non-part items from the original array
        const nonPartItems = items.filter(item => item.item_type !== 'part')

        // Convert part form items back to invoice items
        const updatedPartItems: InvoiceItem[] = partItems.map(item => ({
            id: item.id,
            item_type: 'part' as const,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            part_number: item.part_number || undefined,
            supplier: item.supplier || undefined,
            category: item.category || undefined,
            warranty_period: item.warranty_period || undefined
        }))

        // Merge back: non-part items + updated part items
        onItemsChange([...nonPartItems, ...updatedPartItems])
    }, [items, onItemsChange])

    return (
        <WorkOrderPartsItems
            items={partFormItems}
            onItemsChange={handlePartsItemsChange}
            workOrderId={undefined} // No work order - invoice-only mode
            isEditing={isEditing}
        />
    )
}
