// Unified items section component
'use client'

// Direct imports for better tree-shaking (Supabase pattern - no barrel exports)
import { WorkOrderLaborItems } from '../shared/items/WorkOrderLaborItems'
import { WorkOrderPartsItems } from '../shared/items/WorkOrderPartsItems'
import { WorkOrderExpenseItems } from '../shared/items/WorkOrderExpenseItems'
import { WorkOrderGenericItems } from '../shared/items/WorkOrderGenericItems'
import type { LaborFormItem, PartFormItem, ExpenseFormItem, GenericFormItem } from './hooks/use-work-order-item-management'

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

    return (
        <div className="bg-slate-50 dark:bg-[#131313] border border-border rounded-lg p-4 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Work Order Items</h3>

            <WorkOrderLaborItems
                items={itemsByType.labor}
                onItemsChange={(items) => onItemsChange('labor', items)}
                workOrderId={workOrderId}
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

            <WorkOrderPartsItems
                items={itemsByType.parts}
                onItemsChange={(items) => onItemsChange('part', items)}
                workOrderId={workOrderId}
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

            <WorkOrderExpenseItems
                items={itemsByType.expenses}
                onItemsChange={(items) => onItemsChange('expense', items)}
                workOrderId={workOrderId}
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

            {/* Show legacy Services only if they exist - read-only with delete capability */}
            {hasLegacyServices && (
                <WorkOrderGenericItems
                    items={itemsByType.services}
                    onItemsChange={(items) => onItemsChange('service', items)}
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
                    onItemsChange={(items) => onItemsChange('fee', items)}
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
                onItemsChange={(items) => onItemsChange('discount', items)}
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
                    onItemsChange={(items) => onItemsChange('package', items)}
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

