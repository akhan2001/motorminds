// Unified items section component
'use client'

import { WorkOrderLaborItems } from '../shared/WorkOrderLaborItems'
import { WorkOrderPartsItems } from '../shared/WorkOrderPartsItems'
import { WorkOrderGenericItems } from '../shared/WorkOrderGenericItems'
import type { LaborFormItem, PartFormItem, GenericFormItem } from './hooks/use-work-order-item-management'

interface WorkOrderItemsSectionProps {
    itemsByType: {
        labor: LaborFormItem[]
        parts: PartFormItem[]
        services: GenericFormItem[]
        fees: GenericFormItem[]
        discounts: GenericFormItem[]
        packages: GenericFormItem[]
    }
    onItemsChange: (type: 'labor' | 'part' | 'service' | 'fee' | 'discount' | 'package', items: any[]) => void
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

            <WorkOrderGenericItems
                items={itemsByType.services}
                onItemsChange={(items) => onItemsChange('service', items)}
                workOrderId={workOrderId}
                itemType="service"
                title="Services"
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

            <WorkOrderGenericItems
                items={itemsByType.fees}
                onItemsChange={(items) => onItemsChange('fee', items)}
                workOrderId={workOrderId}
                itemType="fee"
                title="Fees"
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

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

            <WorkOrderGenericItems
                items={itemsByType.packages}
                onItemsChange={(items) => onItemsChange('package', items)}
                workOrderId={workOrderId}
                itemType="package"
                title="Packages"
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />
        </div>
    )
}

