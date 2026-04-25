'use client'

import { useMemo, useCallback, useRef, useEffect } from 'react'
import { WorkOrderGenericItems } from '@/app/(features)/operations/components/work-orders/shared/items/WorkOrderGenericItems'
import type { InvoiceItem, ItemType } from '../../../types/invoice'

// Generic form item format used by WorkOrderGenericItems
interface GenericFormItem {
    id: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
    unit_cost?: number
    line_discount?: number
    category?: string
    labor_hours?: number
    notes?: string
}

interface InvoiceGenericItemsAdapterProps {
    items: InvoiceItem[]
    onItemsChange: (items: InvoiceItem[]) => void
    isEditing?: boolean
    itemType: 'service' | 'fee' | 'discount' | 'package'
    title: string
    icon?: React.ComponentType<{ className?: string }>
}

/**
 * Adapter component that wraps WorkOrderGenericItems for use in invoice forms.
 * Converts between InvoiceItem[] format and GenericFormItem[] format.
 */
export function InvoiceGenericItemsAdapter({
    items,
    onItemsChange,
    isEditing = true,
    itemType,
    title,
    icon
}: InvoiceGenericItemsAdapterProps) {
    // Use a ref to track the latest items without causing callback recreation
    const itemsRef = useRef(items)
    
    // Update ref whenever items change
    useEffect(() => {
        itemsRef.current = items
    }, [items])

    // Filter and convert invoice items to generic form items
    const genericFormItems = useMemo(() => {
        return items
            .filter(item => item.item_type === itemType)
            .map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                unit_cost: undefined,
                line_discount: (item as any).line_discount || 0,
                category: item.category || '',
                labor_hours: item.labor_hours,
                notes: ''
            }))
    }, [items, itemType])

    // Handle changes from WorkOrderGenericItems component
    // Use ref to avoid dependency on items, preventing infinite loops
    const handleGenericItemsChange = useCallback((genericItems: GenericFormItem[]) => {
        // Get all items that are NOT of this type from the current items (via ref)
        const otherItems = itemsRef.current.filter(item => item.item_type !== itemType)

        // Convert generic form items back to invoice items
        const updatedItems: InvoiceItem[] = genericItems.map(item => ({
            id: item.id,
            item_type: itemType as ItemType,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            category: item.category || undefined,
            labor_hours: item.labor_hours,
            line_discount: itemType === 'service' ? (item.line_discount || 0) : undefined,
        } as InvoiceItem))

        // Merge back: other items + updated items of this type
        onItemsChange([...otherItems, ...updatedItems])
    }, [itemType, onItemsChange])

    return (
        <WorkOrderGenericItems
            items={genericFormItems}
            onItemsChange={handleGenericItemsChange}
            workOrderId={undefined} // No work order - invoice-only mode
            isEditing={isEditing}
            itemType={itemType}
            title={title}
            icon={icon}
        />
    )
}
