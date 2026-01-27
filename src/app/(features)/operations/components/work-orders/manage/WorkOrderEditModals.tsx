// Modals component - handles delete and revert dialogs
'use client'

import { WorkOrderDeleteConfirmation } from './work-order-delete-confirmation'
import { RevertWorkOrderDialog } from '../revert-work-order-dialog'
import type { WorkOrderWithDetails, WorkOrderKanbanItem } from '../../../types/work-order'

interface WorkOrderEditModalsProps {
    workOrder: WorkOrderKanbanItem
    workOrderDetails: WorkOrderWithDetails
    onDelete?: (workOrderId: string, options?: { deleteInvoice?: boolean }) => void
    onClose: () => void
    isDeleteConfirmationOpen?: boolean
    isRevertDialogOpen?: boolean
    onDeleteCancel?: () => void
    onDeleteConfirm?: (options: { deleteInvoice: boolean }) => void
    onRevertCancel?: () => void
    onRevertConfirm?: () => void
    revertWarning?: string
    isReverting?: boolean
}

export function WorkOrderEditModals({
    workOrder,
    workOrderDetails,
    onDelete,
    onClose,
    isDeleteConfirmationOpen = false,
    isRevertDialogOpen = false,
    onDeleteCancel,
    onDeleteConfirm,
    onRevertCancel,
    onRevertConfirm,
    revertWarning,
    isReverting = false,
}: WorkOrderEditModalsProps) {
    return (
        <>
            {/* Delete Confirmation Dialog */}
            {onDelete && (
                <WorkOrderDeleteConfirmation
                    workOrder={workOrder}
                    isOpen={isDeleteConfirmationOpen}
                    onClose={onDeleteCancel || onClose}
                    onConfirm={onDeleteConfirm || ((options) => onDelete(workOrder.id, options))}
                />
            )}

            {/* Revert Dialog */}
            <RevertWorkOrderDialog
                isOpen={isRevertDialogOpen}
                onClose={onRevertCancel || onClose}
                onConfirm={onRevertConfirm}
                workOrderTitle={workOrderDetails?.title || workOrder.title}
                hasInvoice={!!workOrderDetails?.invoice_id}
                warningMessage={revertWarning}
                isReverting={isReverting}
            />
        </>
    )
}

