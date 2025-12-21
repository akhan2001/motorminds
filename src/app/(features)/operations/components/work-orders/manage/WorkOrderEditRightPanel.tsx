// Right panel component - reuses existing WorkOrderRightPanel
'use client'

import { WorkOrderRightPanel } from '../shared/work-order-right-panel'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import type { WorkOrderItemSummary } from '../../../types/work-order-items'

interface WorkOrderEditRightPanelProps {
    workOrderId: string
    workOrderDetails: WorkOrderWithDetails
    summary: WorkOrderItemSummary | undefined
}

export function WorkOrderEditRightPanel({
    workOrderId,
    workOrderDetails,
    summary,
}: WorkOrderEditRightPanelProps) {
    return (
        <WorkOrderRightPanel
            workOrderId={workOrderId}
            shopId={workOrderDetails.shop_id}
            workOrderStatus={workOrderDetails.status}
            technicianId={workOrderDetails.assigned_technician_id || undefined}
            customerId={workOrderDetails.customer_id}
            customerType={workOrderDetails.customer_type}
        />
    )
}

