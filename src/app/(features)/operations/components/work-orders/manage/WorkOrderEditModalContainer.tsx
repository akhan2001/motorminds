// Container component - handles data fetching
'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { useWorkOrderWithDetails } from '../../../hooks/use-work-orders'
import { useWorkOrderItemsWithSummary } from '../../../hooks/use-work-order-items'
import { useWorkOrderInvoice } from '../../../hooks/work-orders/use-work-order-invoice'
import { useAuth } from '../../../hooks/use-auth'
import { WorkOrderEditModalContent } from './WorkOrderEditModalContent'
import type { WorkOrderKanbanItem } from '../../../types/work-order'

export interface WorkOrderEditModalProps {
    workOrder: WorkOrderKanbanItem
    onClose: () => void
    onSave?: (updated: WorkOrderKanbanItem, formData?: any) => void
    onDelete?: (workOrderId: string) => void
    onGenerateInvoice?: () => void
    onGoToInvoice?: () => void
    className?: string
}

// Backwards compatibility type alias
export type WorkOrderDetailsModalProps = WorkOrderEditModalProps

export function WorkOrderEditModal({
    workOrder: initialWorkOrder,
    onClose,
    onSave,
    onDelete,
    onGenerateInvoice,
    onGoToInvoice,
    className = "",
}: WorkOrderEditModalProps) {
    const { shopId } = useAuth()

    // Data fetching
    const { data: workOrderDetails, isLoading, error } = useWorkOrderWithDetails(initialWorkOrder.id)

    const { items, summary, isLoading: itemsLoading } = useWorkOrderItemsWithSummary(initialWorkOrder.id)

    // Check if work order has an invoice
    const { data: workOrderInvoice } = useWorkOrderInvoice(initialWorkOrder.id)

    if (isLoading || itemsLoading) {
        return (
            <div className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center ${className}`}>
                <div className="bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border rounded-lg shadow-lg p-8">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-foreground">Loading work order details...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !workOrderDetails) {
        return (
            <div className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center ${className}`}>
                <div className="bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border rounded-lg shadow-lg p-8 max-w-md">
                    <div className="text-center space-y-4">
                        <p className="text-destructive text-lg font-semibold">
                            {error?.message || 'Failed to load work order details'}
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <WorkOrderEditModalContent
            workOrder={initialWorkOrder}
            workOrderDetails={workOrderDetails}
            items={items}
            summary={summary}
            onClose={onClose}
            onSave={onSave}
            onDelete={onDelete}
            onGenerateInvoice={onGenerateInvoice}
            onGoToInvoice={onGoToInvoice}
            workOrderInvoice={workOrderInvoice}
            className={className}
        />
    )
}

