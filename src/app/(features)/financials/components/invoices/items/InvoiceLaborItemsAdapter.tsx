'use client'

import { useMemo, useCallback, useRef, useEffect } from 'react'
import { WorkOrderLaborItems } from '@/app/(features)/operations/components/work-orders/shared/items/WorkOrderLaborItems'
import type { InvoiceItem } from '../../../types/invoice'

// Labor form item format used by WorkOrderLaborItems
interface LaborFormItem {
    id: string
    description: string
    labor_hours: number
    unit_price: number
    total_price: number
    unit_cost?: number
    line_discount?: number
    category?: string
    notes?: string
    technician_id?: string
}

interface InvoiceLaborItemsAdapterProps {
    items: InvoiceItem[]
    onItemsChange: (items: InvoiceItem[]) => void
    isEditing?: boolean
}

/**
 * Adapter component that wraps WorkOrderLaborItems for use in invoice forms.
 * Converts between InvoiceItem[] format and LaborFormItem[] format.
 */
export function InvoiceLaborItemsAdapter({
    items,
    onItemsChange,
    isEditing = true
}: InvoiceLaborItemsAdapterProps) {
    // Use a ref to track the latest items without causing callback recreation
    const itemsRef = useRef(items)
    
    // Update ref whenever items change
    useEffect(() => {
        itemsRef.current = items
    }, [items])

    // Filter and convert invoice items to labor form items
    const laborFormItems = useMemo(() => {
        return items
            .filter(item => item.item_type === 'labor')
            .map(item => ({
                id: item.id,
                description: item.description,
                labor_hours: item.labor_hours || 1,
                unit_price: item.unit_price,
                total_price: item.total_price,
                unit_cost: undefined, // Invoice items don't have unit_cost
                line_discount: (item as any).line_discount || 0,
                category: item.category || '',
                notes: '',
                technician_id: item.technician_id || ''
            }))
    }, [items])

    // Handle changes from WorkOrderLaborItems component
    // Use ref to avoid dependency on items, preventing infinite loops
    const handleLaborItemsChange = useCallback((laborItems: LaborFormItem[]) => {
        // Get all non-labor items from the current items (via ref)
        const nonLaborItems = itemsRef.current.filter(item => item.item_type !== 'labor')

        // Convert labor form items back to invoice items
        const updatedLaborItems: InvoiceItem[] = laborItems.map(item => ({
            id: item.id,
            item_type: 'labor' as const,
            description: item.description,
            quantity: 1, // Labor items use labor_hours for quantity
            unit_price: item.unit_price,
            total_price: item.total_price,
            labor_hours: item.labor_hours,
            technician_id: item.technician_id || undefined,
            category: item.category || undefined,
            line_discount: item.line_discount || 0,
        } as InvoiceItem))

        // Merge back: non-labor items + updated labor items
        onItemsChange([...nonLaborItems, ...updatedLaborItems])
    }, [onItemsChange])

    return (
        <WorkOrderLaborItems
            items={laborFormItems}
            onItemsChange={handleLaborItemsChange}
            workOrderId={undefined} // No work order - invoice-only mode
            isEditing={isEditing}
        />
    )
}
