// Presentational component - handles UI rendering
'use client'

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useWorkOrderEditForm } from './hooks/use-work-order-edit-form'
import { useWorkOrderItemManagement } from './hooks/use-work-order-item-management'
import { WorkOrderEditLeftPanel } from './WorkOrderEditLeftPanel'
import { WorkOrderEditRightPanel } from './WorkOrderEditRightPanel'
import { WorkOrderEditModals } from './WorkOrderEditModals'
import type { WorkOrderWithDetails, WorkOrderKanbanItem } from '../../../types/work-order'
import type { WorkOrderItem, WorkOrderItemSummary } from '../../../types/work-order-items'

interface WorkOrderEditModalContentProps {
    workOrder: WorkOrderKanbanItem
    workOrderDetails: WorkOrderWithDetails
    items: WorkOrderItem[]
    summary: WorkOrderItemSummary | undefined
    onClose: () => void
    onSave?: (updated: WorkOrderKanbanItem, formData?: any) => void
    onDelete?: (workOrderId: string) => void
    onGenerateInvoice?: () => void
    onGoToInvoice?: () => void
    workOrderInvoice?: any
    className?: string
}

export function WorkOrderEditModalContent({
    workOrder,
    workOrderDetails,
    items,
    summary,
    onClose,
    onSave,
    onDelete,
    onGenerateInvoice,
    onGoToInvoice,
    workOrderInvoice,
    className = "",
}: WorkOrderEditModalContentProps) {
    // Custom hooks for business logic
    const form = useWorkOrderEditForm(workOrderDetails, workOrder)
    const itemManagement = useWorkOrderItemManagement({
        workOrderId: workOrder.id,
        initialItems: items,
    })

    // Check if work order is completed (hide right panel for completed)
    const isCompleted = workOrderDetails.status === 'completed' || 
                       workOrderDetails.status === 'invoiced' || 
                       workOrderDetails.status === 'cancelled'

    return (
        <div className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden ${className}`}>
            <div className={`bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border rounded-lg shadow-lg flex h-[90vh] max-h-[90vh] ${
                isCompleted 
                    ? 'w-[85vw] max-w-[85vw] sm:max-w-[75vw] md:max-w-[70vw]' // Narrower for completed
                    : 'w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw]' // Full width for active
            }`}>
                {isCompleted ? (
                    // For completed work orders, show only left panel (full width)
                    <div className="w-full h-full">
                        <WorkOrderEditLeftPanel
                            workOrder={workOrder}
                            workOrderDetails={workOrderDetails}
                            form={form}
                            itemManagement={itemManagement}
                            workOrderItems={items}
                            onClose={onClose}
                            onSave={onSave}
                            onDelete={onDelete}
                            onGenerateInvoice={onGenerateInvoice}
                            onGoToInvoice={onGoToInvoice}
                            workOrderInvoice={workOrderInvoice}
                        />
                    </div>
                ) : (
                    // For non-completed work orders, show resizable panels with AI Diagnostics
                    <ResizablePanelGroup direction="horizontal" className="w-full h-full">
                        <ResizablePanel defaultSize={55} minSize={45} maxSize={65}>
                            <WorkOrderEditLeftPanel
                                workOrder={workOrder}
                                workOrderDetails={workOrderDetails}
                                form={form}
                                itemManagement={itemManagement}
                                workOrderItems={items}
                                onClose={onClose}
                                onSave={onSave}
                                onDelete={onDelete}
                                onGenerateInvoice={onGenerateInvoice}
                                onGoToInvoice={onGoToInvoice}
                                workOrderInvoice={workOrderInvoice}
                            />
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        <ResizablePanel defaultSize={45} minSize={35}>
                            <WorkOrderEditRightPanel
                                workOrderId={workOrder.id}
                                workOrderDetails={workOrderDetails}
                                summary={summary}
                                workOrderItems={items}
                            />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                )}

                <WorkOrderEditModals
                    workOrder={workOrder}
                    workOrderDetails={workOrderDetails}
                    onDelete={onDelete}
                    onClose={onClose}
                />
            </div>
        </div>
    )
}

