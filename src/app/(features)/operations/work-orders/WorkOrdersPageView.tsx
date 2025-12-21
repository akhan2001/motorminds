import { WorkOrderKanban, WorkOrderHeader } from '../components/work-orders'
import { WorkOrderCreateModal } from '../components/work-orders/create'
import { WorkOrderEditModal } from '../components/work-orders/manage/work-order-edit-modal'
import { WorkOrderCompletionModal } from '../components/work-orders/complete'
import { WorkOrderItemTemplatesModal } from '../components/work-order-items/templates/work-order-item-templates-modal'
import { StatusTrackerManagementModal } from '../components/work-orders/status-tracker-management-modal'
import { DragDropProvider } from '../components/work-orders/DragDrop'
import type { WorkOrderKanbanColumn, WorkOrderKanbanItem, WorkOrderWithDetails } from '../types/work-order'

interface WorkOrdersPageViewProps {
    // Data
    kanbanData: WorkOrderKanbanColumn[]
    selectedWorkOrder: WorkOrderKanbanItem | null
    completionWorkOrder: WorkOrderWithDetails | null
    shopId: string

    // State
    isCompactView: boolean
    isModalOpen: boolean
    isCreateModalOpen: boolean
    isCompletionModalOpen: boolean
    isTemplatesModalOpen: boolean
    isStatusTrackersModalOpen: boolean

    // Handlers
    onToggleView: () => void
    onNewWorkOrder: () => void
    onTemplatesClick: () => void
    onTemplatesModalClose: () => void
    onStatusTrackersClick: () => void
    onStatusTrackersModalClose: () => void
    onCardClick: (item: WorkOrderKanbanItem) => void
    onModalClose: () => void
    onWorkOrderSave: (updatedWorkOrder: WorkOrderKanbanItem, formData?: any) => Promise<void>
    onWorkOrderDelete: (workOrderId: string) => Promise<void>
    onWorkOrderCreate: (workOrderData: any) => Promise<void>
    onCreateModalClose: () => void
    onCompletionModalClose: () => void
    onCompletionConfirm: (sendMessage: boolean, customMessage?: string, enableAutomatedMessages?: boolean) => Promise<void>
    onWorkOrderCompletionAttempt: (item: WorkOrderKanbanItem) => void
    refetch: () => void
}

/**
 * WorkOrdersPageView - Presentational Component
 * Pure UI component that receives all data and handlers via props
 * No business logic or data fetching
 */
export function WorkOrdersPageView({
    kanbanData,
    selectedWorkOrder,
    completionWorkOrder,
    shopId,
    isCompactView,
    isModalOpen,
    isCreateModalOpen,
    isCompletionModalOpen,
    isTemplatesModalOpen,
    isStatusTrackersModalOpen,
    onToggleView,
    onNewWorkOrder,
    onTemplatesClick,
    onTemplatesModalClose,
    onStatusTrackersClick,
    onStatusTrackersModalClose,
    onCardClick,
    onModalClose,
    onWorkOrderSave,
    onWorkOrderDelete,
    onWorkOrderCreate,
    onCreateModalClose,
    onCompletionModalClose,
    onCompletionConfirm,
    onWorkOrderCompletionAttempt,
    refetch,
}: WorkOrdersPageViewProps) {
    return (
        <DragDropProvider
            onWorkOrderUpdate={() => {
                // Refetch work orders when status is updated via drag and drop
                refetch()
            }}
            onWorkOrderCompletionAttempt={onWorkOrderCompletionAttempt}
        >
            <div className="h-screen flex flex-col bg-background">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <WorkOrderHeader
                        isCompactView={isCompactView}
                        onToggleView={onToggleView}
                        onNewWorkOrder={onNewWorkOrder}
                        onTemplatesClick={onTemplatesClick}
                        onStatusTrackersClick={onStatusTrackersClick}
                    />
                    <div className="flex-1 overflow-hidden">
                        <WorkOrderKanban
                            columns={kanbanData}
                            onCardClick={onCardClick}
                            isCompactView={isCompactView}
                        />
                    </div>
                </div>

                {/* Work Order Edit Modal (Manage Phase) */}
                {isModalOpen && selectedWorkOrder && (
                    <WorkOrderEditModal
                        workOrder={selectedWorkOrder}
                        onClose={onModalClose}
                        onSave={onWorkOrderSave}
                        onDelete={onWorkOrderDelete}
                    />
                )}

                {/* Work Order Create Modal */}
                {isCreateModalOpen && (
                    <WorkOrderCreateModal
                        onClose={onCreateModalClose}
                        onSave={onWorkOrderCreate}
                        shopId={shopId}
                    />
                )}

                {/* Work Order Completion Modal */}
                {isCompletionModalOpen && completionWorkOrder && (
                    <WorkOrderCompletionModal
                        workOrder={completionWorkOrder}
                        isOpen={isCompletionModalOpen}
                        onClose={onCompletionModalClose}
                        onConfirm={onCompletionConfirm}
                    />
                )}

                {/* Work Order Item Templates Modal */}
                {isTemplatesModalOpen && shopId && (
                    <WorkOrderItemTemplatesModal
                        isOpen={isTemplatesModalOpen}
                        onClose={onTemplatesModalClose}
                        shopId={shopId}
                    />
                )}

                {/* Status Tracker Management Modal */}
                <StatusTrackerManagementModal
                    isOpen={isStatusTrackersModalOpen}
                    onClose={onStatusTrackersModalClose}
                />
            </div>
        </DragDropProvider>
    )
}
