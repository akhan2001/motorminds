// Right panel component - conditionally renders AI Diagnostics or standard panel
'use client'

import { WorkOrderRightPanel } from '../shared/work-order-right-panel'
// import { WorkOrderDiagnosticsPanel } from './WorkOrderDiagnosticsPanel'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import type { WorkOrderItem, WorkOrderItemSummary } from '../../../types/work-order-items'

interface WorkOrderEditRightPanelProps {
    workOrderId: string
    workOrderDetails: WorkOrderWithDetails
    summary: WorkOrderItemSummary | undefined
    workOrderItems?: WorkOrderItem[]
}

export function WorkOrderEditRightPanel({
    workOrderId,
    workOrderDetails,
    summary,
    workOrderItems = [],
}: WorkOrderEditRightPanelProps) {
    // Check if work order is completed
    const isCompleted = workOrderDetails.status === 'completed' || 
                       workOrderDetails.status === 'invoiced' || 
                       workOrderDetails.status === 'cancelled'

    // For completed work orders, show existing right panel (insights, chat, history)
    if (isCompleted) {
        return (
            <WorkOrderRightPanel
                workOrderId={workOrderId}
                shopId={workOrderDetails.shop_id}
                workOrderStatus={workOrderDetails.status}
                technicianId={workOrderDetails.assigned_technician_id || undefined}
                customerId={workOrderDetails.customer_id}
                customerType={workOrderDetails.customer_type}
                workOrderItems={workOrderItems}
            />
        )
    }

    // For active work orders, show AI Diagnostics panel
    // return (
    //     <WorkOrderDiagnosticsPanel
    //         workOrder={workOrderDetails}
    //         shopId={workOrderDetails.shop_id}
    //         className="h-full"
    //     />
    // )

    
    // Always show the right panel with financials (Summary tab)
    return (
        <WorkOrderRightPanel
            workOrderId={workOrderId}
            shopId={workOrderDetails.shop_id}
            workOrderStatus={workOrderDetails.status}
            technicianId={workOrderDetails.assigned_technician_id || undefined}
            customerId={workOrderDetails.customer_id}
            customerType={workOrderDetails.customer_type}
            workOrderItems={workOrderItems}
            workOrder={workOrderDetails}
        />
    )
}

