// Custom hook for work order item state management
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WorkOrderItemsService } from '../../../../lib/work-order-items-service'
import { workOrderItemKeys } from '../../../../hooks/use-work-order-items'
import { useAuth } from '../../../../hooks/use-auth'
import type { WorkOrderItem } from '../../../../types/work-order-items'
import type {
    LaborFormItem,
    PartFormItem,
    GenericFormItem
} from '../../../../types/work-order-item-forms'

// Re-export for backwards compatibility
export type { LaborFormItem, PartFormItem, GenericFormItem }

interface UseWorkOrderItemManagementProps {
    workOrderId: string
    initialItems: WorkOrderItem[]
}

export function useWorkOrderItemManagement({
    workOrderId,
    initialItems,
}: UseWorkOrderItemManagementProps) {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    // Convert WorkOrderItem[] to form items grouped by type
    const convertToFormItems = useCallback((items: WorkOrderItem[]) => {
        const labor: LaborFormItem[] = []
        const parts: PartFormItem[] = []
        const services: GenericFormItem[] = []
        const fees: GenericFormItem[] = []
        const discounts: GenericFormItem[] = []
        const packages: GenericFormItem[] = []

        items.forEach(item => {
            if (item.item_type === 'labor') {
                labor.push({
                    id: item.id,
                    description: item.description,
                    labor_hours: item.labor_hours || 1,
                    unit_price: item.unit_price || 0,
                    total_price: (item.labor_hours || 1) * (item.unit_price || 0),
                    unit_cost: item.unit_cost ?? undefined,
                    category: item.category || '',
                    notes: item.notes || '',
                    technician_id: item.technician_id || '',
                    active: item.active ?? undefined,
                })
            } else if (item.item_type === 'part') {
                parts.push({
                    id: item.id,
                    description: item.description,
                    part_number: item.part_number || '',
                    quantity: item.quantity || 1,
                    unit_price: item.unit_price || 0,
                    total_price: (item.quantity || 1) * (item.unit_price || 0),
                    unit_cost: item.unit_cost,
                    total_cost: item.total_cost,
                    supplier: item.supplier || '',
                    category: item.category || '',
                    warranty_period: item.warranty_period || '',
                    notes: item.notes || '',
                    active: item.active ?? undefined,
                })
            } else if (item.item_type === 'service') {
                services.push({
                    id: item.id,
                    description: item.description,
                    quantity: item.quantity || 1,
                    unit_price: item.unit_price || 0,
                    total_price: (item.quantity || 1) * (item.unit_price || 0),
                    unit_cost: item.unit_cost ?? undefined,
                    category: item.category || '',
                    labor_hours: item.labor_hours ?? undefined,
                    notes: item.notes || '',
                    active: item.active ?? undefined,
                })
            } else if (item.item_type === 'fee') {
                fees.push({
                    id: item.id,
                    description: item.description,
                    quantity: item.quantity || 1,
                    unit_price: item.unit_price || 0,
                    total_price: (item.quantity || 1) * (item.unit_price || 0),
                    unit_cost: item.unit_cost ?? undefined,
                    category: item.category || '',
                    notes: item.notes || '',
                    active: item.active ?? undefined,
                })
            } else if (item.item_type === 'discount') {
                discounts.push({
                    id: item.id,
                    description: item.description,
                    quantity: item.quantity || 1,
                    unit_price: item.unit_price || 0,
                    total_price: (item.quantity || 1) * (item.unit_price || 0),
                    unit_cost: item.unit_cost ?? undefined,
                    category: item.category || '',
                    notes: item.notes || '',
                    active: item.active ?? undefined,
                })
            } else if (item.item_type === 'package') {
                packages.push({
                    id: item.id,
                    description: item.description,
                    quantity: item.quantity || 1,
                    unit_price: item.unit_price || 0,
                    total_price: (item.quantity || 1) * (item.unit_price || 0),
                    unit_cost: item.unit_cost ?? undefined,
                    category: item.category || '',
                    labor_hours: item.labor_hours ?? undefined,
                    notes: item.notes || '',
                    active: item.active ?? undefined,
                })
            }
        })

        return { labor, parts, services, fees, discounts, packages }
    }, [])

    // Initialize local state from initial items
    const initialFormItems = useMemo(() => convertToFormItems(initialItems), [initialItems, convertToFormItems])

    const [laborItems, setLaborItems] = useState<LaborFormItem[]>(initialFormItems.labor)
    const [partsItems, setPartsItems] = useState<PartFormItem[]>(initialFormItems.parts)
    const [serviceItems, setServiceItems] = useState<GenericFormItem[]>(initialFormItems.services)
    const [feeItems, setFeeItems] = useState<GenericFormItem[]>(initialFormItems.fees)
    const [discountItems, setDiscountItems] = useState<GenericFormItem[]>(initialFormItems.discounts)
    const [packageItems, setPackageItems] = useState<GenericFormItem[]>(initialFormItems.packages)

    // Update local state when initial items change
    useEffect(() => {
        const formItems = convertToFormItems(initialItems)
        setLaborItems(formItems.labor)
        setPartsItems(formItems.parts)
        setServiceItems(formItems.services)
        setFeeItems(formItems.fees)
        setDiscountItems(formItems.discounts)
        setPackageItems(formItems.packages)
    }, [initialItems, convertToFormItems])

    // Group items by type for easy access
    const itemsByType = useMemo(() => ({
        labor: laborItems,
        parts: partsItems,
        services: serviceItems,
        fees: feeItems,
        discounts: discountItems,
        packages: packageItems,
    }), [laborItems, partsItems, serviceItems, feeItems, discountItems, packageItems])

    // Handle items change by type
    const handleItemsChange = useCallback((type: 'labor' | 'part' | 'service' | 'fee' | 'discount' | 'package', items: any[]) => {
        switch (type) {
            case 'labor':
                setLaborItems(items as LaborFormItem[])
                break
            case 'part':
                setPartsItems(items as PartFormItem[])
                break
            case 'service':
                setServiceItems(items as GenericFormItem[])
                break
            case 'fee':
                setFeeItems(items as GenericFormItem[])
                break
            case 'discount':
                setDiscountItems(items as GenericFormItem[])
                break
            case 'package':
                setPackageItems(items as GenericFormItem[])
                break
        }
    }, [])

    // Convert form items to WorkOrderItemFormData for bulk upsert
    const convertToWorkOrderItemFormData = useCallback((item: LaborFormItem | PartFormItem | GenericFormItem, itemType: string): any => {
        const base = {
            item_type: itemType as any,
            description: item.description,
            quantity: 'quantity' in item ? item.quantity : 1,
            unit_price: item.unit_price,
            notes: item.notes || undefined,
        }

        if (itemType === 'labor' && 'labor_hours' in item) {
            return {
                ...base,
                labor_hours: item.labor_hours,
                technician_id: item.technician_id || undefined,
                unit_cost: 'unit_cost' in item ? item.unit_cost || undefined : undefined,
                category: 'category' in item ? item.category || undefined : undefined,
            }
        }

        if (itemType === 'part' && 'part_number' in item) {
            return {
                ...base,
                part_number: item.part_number || undefined,
                unit_cost: item.unit_cost || undefined,
                supplier: item.supplier || undefined,
                category: item.category || undefined,
                warranty_period: item.warranty_period || undefined,
            }
        }

        // Generic items (service, fee, discount, package)
        return {
            ...base,
            unit_cost: 'unit_cost' in item ? item.unit_cost || undefined : undefined,
            category: 'category' in item ? item.category || undefined : undefined,
            labor_hours: 'labor_hours' in item ? item.labor_hours || undefined : undefined,
        }
    }, [])

    // Save all items using bulk upsert
    const handleSaveAll = useCallback(async () => {
        if (!workOrderId) {
            toast.error('Work Order ID is required')
            return false
        }

        try {
            // Get existing items to determine which are new vs existing
            const existingItems = await WorkOrderItemsService.getWorkOrderItems(workOrderId)
            const existingItemIds = new Set(existingItems.map(item => item.id))

            // Track all current item IDs from local state
            const currentItemIds = new Set([
                ...laborItems.map(i => i.id),
                ...partsItems.map(i => i.id),
                ...serviceItems.map(i => i.id),
                ...feeItems.map(i => i.id),
                ...discountItems.map(i => i.id),
                ...packageItems.map(i => i.id),
            ])

            // Delete items that exist in database but not in local state
            const itemsToDelete = existingItems.filter(item => !currentItemIds.has(item.id))
            for (const item of itemsToDelete) {
                try {
                    await WorkOrderItemsService.deleteWorkOrderItem(item.id)
                } catch (error) {
                    console.error(`Error deleting item ${item.id}:`, error)
                }
            }

            // Prepare all items for bulk upsert
            const itemsToUpsert: Array<{ id?: string; data: any }> = []

            // Add all item types
            laborItems.forEach(item => {
                if (item.description.trim()) {
                    itemsToUpsert.push({
                        id: existingItemIds.has(item.id) ? item.id : undefined,
                        data: convertToWorkOrderItemFormData(item, 'labor'),
                    })
                }
            })

            partsItems.forEach(item => {
                if (item.description.trim()) {
                    itemsToUpsert.push({
                        id: existingItemIds.has(item.id) ? item.id : undefined,
                        data: convertToWorkOrderItemFormData(item, 'part'),
                    })
                }
            })

            serviceItems.forEach(item => {
                if (item.description.trim()) {
                    itemsToUpsert.push({
                        id: existingItemIds.has(item.id) ? item.id : undefined,
                        data: convertToWorkOrderItemFormData(item, 'service'),
                    })
                }
            })

            feeItems.forEach(item => {
                if (item.description.trim()) {
                    itemsToUpsert.push({
                        id: existingItemIds.has(item.id) ? item.id : undefined,
                        data: convertToWorkOrderItemFormData(item, 'fee'),
                    })
                }
            })

            discountItems.forEach(item => {
                if (item.description.trim()) {
                    itemsToUpsert.push({
                        id: existingItemIds.has(item.id) ? item.id : undefined,
                        data: convertToWorkOrderItemFormData(item, 'discount'),
                    })
                }
            })

            packageItems.forEach(item => {
                if (item.description.trim()) {
                    itemsToUpsert.push({
                        id: existingItemIds.has(item.id) ? item.id : undefined,
                        data: convertToWorkOrderItemFormData(item, 'package'),
                    })
                }
            })

            // Use bulk upsert
            if (itemsToUpsert.length > 0) {
                await WorkOrderItemsService.bulkUpsertItems(workOrderId, itemsToUpsert)
            }

            // Invalidate queries
            if (shopId) {
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: workOrderItemKeys.list(shopId, workOrderId),
                    }),
                    queryClient.invalidateQueries({
                        queryKey: workOrderItemKeys.summary(shopId, workOrderId),
                    }),
                ])
            }

            toast.success('All items saved successfully')
            return true
        } catch (error: any) {
            console.error('Error saving work order items:', error)
            toast.error(error.message || 'Failed to save items')
            return false
        }
    }, [
        workOrderId,
        laborItems,
        partsItems,
        serviceItems,
        feeItems,
        discountItems,
        packageItems,
        convertToWorkOrderItemFormData,
        queryClient,
        shopId,
    ])

    return {
        itemsByType,
        laborItems,
        partsItems,
        serviceItems,
        feeItems,
        discountItems,
        packageItems,
        handleItemsChange,
        handleSaveAll,
    }
}

