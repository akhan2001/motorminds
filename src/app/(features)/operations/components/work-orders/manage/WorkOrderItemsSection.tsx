// Unified items section component
'use client'

import { useCallback } from 'react'

// Direct imports for better tree-shaking (Supabase pattern - no barrel exports)
import { WorkOrderLaborItems } from '../shared/items/WorkOrderLaborItems'
import { WorkOrderPartsItems } from '../shared/items/WorkOrderPartsItems'
import { WorkOrderExpenseItems, type ExpenseFormItem } from '../shared/items/expense-items'
import { WorkOrderGenericItems } from '../shared/items/WorkOrderGenericItems'
import type { LaborFormItem, PartFormItem, GenericFormItem } from './hooks/use-work-order-item-management'

interface WorkOrderItemsSectionProps {
    itemsByType: {
        labor: LaborFormItem[]
        parts: PartFormItem[]
        expenses: ExpenseFormItem[]
        services: GenericFormItem[]
        fees: GenericFormItem[]
        discounts: GenericFormItem[]
        packages: GenericFormItem[]
    }
    onItemsChange: (type: 'labor' | 'part' | 'expense' | 'service' | 'fee' | 'discount' | 'package', items: any[]) => void
    workOrderId: string
    isEditing: boolean
    onItemSaved?: (item: any) => void
    onItemDeleted?: (itemId: string) => void
}

export function WorkOrderItemsSection({
    itemsByType,
    onItemsChange,
    workOrderId,
    isEditing,
    onItemSaved,
    onItemDeleted,
}: WorkOrderItemsSectionProps) {
    // Check if there are any legacy items that need to be shown for deletion
    const hasLegacyServices = itemsByType.services.length > 0
    const hasLegacyFees = itemsByType.fees.length > 0
    const hasLegacyPackages = itemsByType.packages.length > 0

    // Memoized callbacks to prevent unnecessary re-renders of child components
    const handleLaborChange = useCallback((items: LaborFormItem[]) => {
        onItemsChange('labor', items)
    }, [onItemsChange])

    const handlePartsChange = useCallback((items: PartFormItem[]) => {
        onItemsChange('part', items)
    }, [onItemsChange])

    const handleExpensesChange = useCallback((items: ExpenseFormItem[]) => {
        onItemsChange('expense', items)
    }, [onItemsChange])

    const handleServicesChange = useCallback((items: GenericFormItem[]) => {
        onItemsChange('service', items)
    }, [onItemsChange])

    const handleFeesChange = useCallback((items: GenericFormItem[]) => {
        onItemsChange('fee', items)
    }, [onItemsChange])

    const handleDiscountsChange = useCallback((items: GenericFormItem[]) => {
        onItemsChange('discount', items)
    }, [onItemsChange])

    const handlePackagesChange = useCallback((items: GenericFormItem[]) => {
        onItemsChange('package', items)
    }, [onItemsChange])

    return (
        <div className="bg-slate-50 dark:bg-[#131313] border border-border rounded-lg p-4 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Work Order Items</h3>

            <WorkOrderLaborItems
                items={itemsByType.labor}
                onItemsChange={handleLaborChange}
                workOrderId={workOrderId}
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

            <WorkOrderPartsItems
                items={itemsByType.parts}
                onItemsChange={handlePartsChange}
                workOrderId={workOrderId}
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

            <WorkOrderExpenseItems
                items={itemsByType.expenses}
                onItemsChange={handleExpensesChange}
                workOrderId={workOrderId}
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

            {/* Show legacy Services only if they exist - read-only with delete capability */}
            {hasLegacyServices && (
                <WorkOrderGenericItems
                    items={itemsByType.services}
                    onItemsChange={handleServicesChange}
                    workOrderId={workOrderId}
                    itemType="service"
                    title="Services (Legacy)"
                    isEditing={isEditing}
                    onItemSaved={onItemSaved}
                    onItemDeleted={onItemDeleted}
                    readOnly={true}
                />
            )}

            {/* Show legacy Fees only if they exist - read-only with delete capability */}
            {hasLegacyFees && (
                <WorkOrderGenericItems
                    items={itemsByType.fees}
                    onItemsChange={handleFeesChange}
                    workOrderId={workOrderId}
                    itemType="fee"
                    title="Fees (Legacy)"
                    isEditing={isEditing}
                    onItemSaved={onItemSaved}
                    onItemDeleted={onItemDeleted}
                    readOnly={true}
                />
            )}

            <WorkOrderGenericItems
                items={itemsByType.discounts}
                onItemsChange={handleDiscountsChange}
                workOrderId={workOrderId}
                itemType="discount"
                title="Discounts"
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

            {/* Show legacy Packages only if they exist - read-only with delete capability */}
            {hasLegacyPackages && (
                <WorkOrderGenericItems
                    items={itemsByType.packages}
                    onItemsChange={handlePackagesChange}
                    workOrderId={workOrderId}
                    itemType="package"
                    title="Packages (Legacy)"
                    isEditing={isEditing}
                    onItemSaved={onItemSaved}
                    onItemDeleted={onItemDeleted}
                    readOnly={true}
                />
            )}
        </div>
    )
}

