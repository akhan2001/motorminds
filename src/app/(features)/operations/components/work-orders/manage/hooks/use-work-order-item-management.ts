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
    ExpenseFormItem,
    GenericFormItem
} from '../../../../types/work-order-item-forms'

// Re-export for backwards compatibility
export type { LaborFormItem, PartFormItem, ExpenseFormItem, GenericFormItem }

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
        const expenses: ExpenseFormItem[] = []
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
                    unit_cost: item.unit_cost ?? undefined,
                    total_cost: item.total_cost ?? undefined,
                    supplier: item.supplier || '',
                    category: item.category || '',
                    warranty_period: item.warranty_period || '',
                    notes: item.notes || '',
                    active: item.active ?? undefined,
                })
            } else if (item.item_type === 'expense') {
                expenses.push({
                    id: item.id,
                    description: item.description,
                    // Legacy fields
                    part_number: item.expense_invoice_number || item.part_number || null,
                    quantity: item.quantity || 1,
                    unit_price: item.unit_price || 0,
                    total_price: item.total_price || (item.quantity || 1) * (item.unit_price || 0),
                    unit_cost: item.unit_cost ?? null,
                    total_cost: item.total_cost ?? null,
                    supplier: item.expense_vendor || item.supplier || null,
                    category: item.category || 'Parts/Inventory',
                    warranty_period: item.warranty_period || null,
                    notes: item.notes || null,
                    active: item.active ?? undefined,
                    is_billable: false,
                    // Expense-specific fields
                    expense_subtotal: item.expense_subtotal ?? null,
                    expense_tax_amount: item.expense_tax_amount ?? null,
                    expense_tax_included: item.expense_tax_included ?? true,
                    expense_payment_method: item.expense_payment_method || 'credit_card',
                    expense_vendor: item.expense_vendor || item.supplier || null,
                    expense_invoice_number: item.expense_invoice_number || item.part_number || null,
                    expense_cost_date: item.expense_cost_date || null,
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

        return { labor, parts, expenses, services, fees, discounts, packages }
    }, [])

    // Initialize local state from initial items
    const initialFormItems = useMemo(() => convertToFormItems(initialItems), [initialItems, convertToFormItems])

    const [laborItems, setLaborItems] = useState<LaborFormItem[]>(initialFormItems.labor)
    const [partsItems, setPartsItems] = useState<PartFormItem[]>(initialFormItems.parts)
    const [expenseItems, setExpenseItems] = useState<ExpenseFormItem[]>(initialFormItems.expenses)
    const [serviceItems, setServiceItems] = useState<GenericFormItem[]>(initialFormItems.services)
    const [feeItems, setFeeItems] = useState<GenericFormItem[]>(initialFormItems.fees)
    const [discountItems, setDiscountItems] = useState<GenericFormItem[]>(initialFormItems.discounts)
    const [packageItems, setPackageItems] = useState<GenericFormItem[]>(initialFormItems.packages)

    // Update local state when initial items change
    useEffect(() => {
        const formItems = convertToFormItems(initialItems)
        setLaborItems(formItems.labor)
        setPartsItems(formItems.parts)
        setExpenseItems(formItems.expenses)
        setServiceItems(formItems.services)
        setFeeItems(formItems.fees)
        setDiscountItems(formItems.discounts)
        setPackageItems(formItems.packages)
    }, [initialItems, convertToFormItems])

    // Group items by type for easy access
    const itemsByType = useMemo(() => ({
        labor: laborItems,
        parts: partsItems,
        expenses: expenseItems,
        services: serviceItems,
        fees: feeItems,
        discounts: discountItems,
        packages: packageItems,
    }), [laborItems, partsItems, expenseItems, serviceItems, feeItems, discountItems, packageItems])

    // Handle items change by type
    const handleItemsChange = useCallback((type: 'labor' | 'part' | 'expense' | 'service' | 'fee' | 'discount' | 'package', items: any[]) => {
        switch (type) {
            case 'labor':
                setLaborItems(items as LaborFormItem[])
                break
            case 'part':
                setPartsItems(items as PartFormItem[])
                break
            case 'expense':
                setExpenseItems(items as ExpenseFormItem[])
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
    const convertToWorkOrderItemFormData = useCallback((item: LaborFormItem | PartFormItem | ExpenseFormItem | GenericFormItem, itemType: string): any => {
        const base = {
            item_type: itemType as any,
            description: item.description,
            quantity: 'quantity' in item ? item.quantity : 1,
            unit_price: item.unit_price,
            notes: item.notes?.trim() || null, // Convert empty strings to null for database
        }

        if (itemType === 'labor' && 'labor_hours' in item) {
            return {
                ...base,
                labor_hours: item.labor_hours,
                technician_id: 'technician_id' in item ? item.technician_id || undefined : undefined,
                unit_cost: 'unit_cost' in item ? item.unit_cost || undefined : undefined,
                category: 'category' in item ? item.category || undefined : undefined,
            }
        }

        if (itemType === 'part' && 'part_number' in item) {
            const partItem = item as PartFormItem
            return {
                ...base,
                // Explicitly include all fields, converting empty strings to null for database
                part_number: partItem.part_number?.trim() || null,
                unit_cost: partItem.unit_cost !== undefined && partItem.unit_cost !== null ? partItem.unit_cost : null,
                supplier: partItem.supplier?.trim() || null,
                category: partItem.category?.trim() || null,
                warranty_period: partItem.warranty_period?.trim() || null,
            }
        }

        if (itemType === 'expense') {
            const expenseItem = item as ExpenseFormItem
            return {
                ...base,
                // Legacy fields (for backward compatibility)
                part_number: expenseItem.expense_invoice_number?.trim() || expenseItem.part_number?.trim() || null,
                unit_cost: expenseItem.unit_cost ?? null,
                total_cost: expenseItem.total_cost ?? null,
                supplier: expenseItem.expense_vendor?.trim() || expenseItem.supplier?.trim() || null,
                category: expenseItem.category?.trim() || null,
                warranty_period: expenseItem.warranty_period?.trim() || null,
                total_price: expenseItem.total_price ?? 0,
                is_billable: false, // Expenses are never billable
                
                // Expense-specific fields
                expense_subtotal: expenseItem.expense_subtotal ?? null,
                expense_tax_amount: expenseItem.expense_tax_amount ?? null,
                expense_tax_included: expenseItem.expense_tax_included ?? true,
                expense_payment_method: expenseItem.expense_payment_method || null,
                expense_vendor: expenseItem.expense_vendor?.trim() || null,
                expense_invoice_number: expenseItem.expense_invoice_number?.trim() || null,
                expense_cost_date: expenseItem.expense_cost_date || null,
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
                ...expenseItems.map(i => i.id),
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

            // Add all item types.
            // For labor/service rows that have an inline `line_discount`, emit
            // a paired item_type='discount' row alongside it. The labor/service
            // row itself is saved without any discount field; the discount lives
            // in its own standard discount item.
            const buildLineDiscountItem = (sourceDesc: string, amount: number) => ({
                item_type: 'discount' as const,
                description: `Line discount: ${sourceDesc}`.slice(0, 500),
                quantity: 1,
                unit_price: amount,
                notes: null,
            })

            laborItems.forEach(item => {
                if (item.description.trim()) {
                    itemsToUpsert.push({
                        id: existingItemIds.has(item.id) ? item.id : undefined,
                        data: convertToWorkOrderItemFormData(item, 'labor'),
                    })
                    const lineDiscount = Number((item as any).line_discount) || 0
                    if (lineDiscount > 0) {
                        itemsToUpsert.push({
                            id: undefined, // always create a fresh discount row
                            data: buildLineDiscountItem(item.description, lineDiscount),
                        })
                    }
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

            expenseItems.forEach(item => {
                if (item.description.trim()) {
                    itemsToUpsert.push({
                        id: existingItemIds.has(item.id) ? item.id : undefined,
                        data: convertToWorkOrderItemFormData(item, 'expense'),
                    })
                }
            })

            serviceItems.forEach(item => {
                if (item.description.trim()) {
                    itemsToUpsert.push({
                        id: existingItemIds.has(item.id) ? item.id : undefined,
                        data: convertToWorkOrderItemFormData(item, 'service'),
                    })
                    const lineDiscount = Number((item as any).line_discount) || 0
                    if (lineDiscount > 0) {
                        itemsToUpsert.push({
                            id: undefined,
                            data: buildLineDiscountItem(item.description, lineDiscount),
                        })
                    }
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
                const savedItems = await WorkOrderItemsService.bulkUpsertItems(workOrderId, itemsToUpsert)
                
                // Refetch items to get the latest state from database
                // This ensures UI is in sync with database, especially for new items that got database IDs
                const refetchedItems = await WorkOrderItemsService.getWorkOrderItems(workOrderId)
                const refetchedFormItems = convertToFormItems(refetchedItems)
                
                // Update local state with refetched items
                setLaborItems(refetchedFormItems.labor)
                setPartsItems(refetchedFormItems.parts)
                setExpenseItems(refetchedFormItems.expenses)
                setServiceItems(refetchedFormItems.services)
                setFeeItems(refetchedFormItems.fees)
                setDiscountItems(refetchedFormItems.discounts)
                setPackageItems(refetchedFormItems.packages)
            }

            // Invalidate queries to ensure data is fresh
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
        expenseItems,
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

