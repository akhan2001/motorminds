'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { WorkOrderKanban, WorkOrderHeader } from '../components/work-orders'
import { DragDropProvider } from '../components/work-orders/DragDrop'
import type { WorkOrderKanbanColumn, WorkOrderKanbanItem, WorkOrderWithDetails } from '../types/work-order'

// Lazy load modals to reduce initial bundle size (Supabase pattern)
const WorkOrderCreateModal = dynamic(
    () => import('../components/work-orders/create').then(m => ({ default: m.WorkOrderCreateModal })),
    { ssr: false }
)
const WorkOrderEditModal = dynamic(
    () => import('../components/work-orders/manage/work-order-edit-modal').then(m => ({ default: m.WorkOrderEditModal })),
    { ssr: false }
)
const WorkOrderCompletionModal = dynamic(
    () => import('../components/work-orders/complete').then(m => ({ default: m.WorkOrderCompletionModal })),
    { ssr: false }
)
const WorkOrderReadyModal = dynamic(
    () => import('../components/work-orders/ready').then(m => ({ default: m.WorkOrderReadyModal })),
    { ssr: false }
)
const WorkOrderItemTemplatesModal = dynamic(
    () => import('../components/work-order-items/templates/work-order-item-templates-modal').then(m => ({ default: m.WorkOrderItemTemplatesModal })),
    { ssr: false }
)
const StatusTrackerManagementModal = dynamic(
    () => import('../components/work-orders/status-tracker-management-modal').then(m => ({ default: m.StatusTrackerManagementModal })),
    { ssr: false }
)

// Loading skeleton for modals
const ModalSkeleton = () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div className="bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-foreground">Loading...</p>
            </div>
        </div>
    </div>
)

type CompletedFilter = 'all' | '90days'

interface WorkOrdersPageViewProps {
    // Data
    kanbanData: WorkOrderKanbanColumn[]
    selectedWorkOrder: WorkOrderKanbanItem | null
    completionWorkOrder: WorkOrderWithDetails | null
    readyWorkOrder: WorkOrderWithDetails | null
    shopId: string

    // Work order settings
    completedFilter: CompletedFilter
    onCompletedFilterChange: (value: CompletedFilter) => void
    onSettingsChange?: () => void
    searchTerm?: string
    onSearchChange?: (value: string) => void

    // State
    isCompactView: boolean
    isModalOpen: boolean
    isCreateModalOpen: boolean
    isCompletionModalOpen: boolean
    isReadyModalOpen: boolean
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
    onWorkOrderDelete?: (workOrderId: string, options?: { deleteInvoice?: boolean }) => Promise<void>
    onWorkOrderCreate: (workOrderData: any) => Promise<{ id: string } | void>
    onCreateModalClose: () => void
    onCompletionModalClose: () => void
    onCompletionConfirm: (sendMessage: boolean, customMessage?: string, enableAutomatedMessages?: boolean, generateInvoice?: boolean) => Promise<void>
    onWorkOrderCompletionAttempt: (item: WorkOrderKanbanItem) => void
    generatedInvoiceNumber?: string | null
    isCompletionPending?: boolean
    onReadyModalClose: () => void
    onReadyConfirm: (sendMessage: boolean, customMessage?: string) => Promise<void>
    onWorkOrderReadyAttempt: (item: WorkOrderKanbanItem) => void
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
    readyWorkOrder,
    shopId,
    completedFilter,
    onCompletedFilterChange,
    onSettingsChange,
    searchTerm = '',
    onSearchChange,
    isCompactView,
    isModalOpen,
    isCreateModalOpen,
    isCompletionModalOpen,
    isReadyModalOpen,
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
    generatedInvoiceNumber,
    isCompletionPending,
    onReadyModalClose,
    onReadyConfirm,
    onWorkOrderReadyAttempt,
    refetch,
}: WorkOrdersPageViewProps) {
    return (
        <DragDropProvider
            onWorkOrderUpdate={() => {
                // Refetch work orders when status is updated via drag and drop
                refetch()
            }}
            onWorkOrderCompletionAttempt={onWorkOrderCompletionAttempt}
            onWorkOrderReadyAttempt={onWorkOrderReadyAttempt}
        >
            <div className="h-screen flex flex-col bg-background">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <WorkOrderHeader
                        completedFilter={completedFilter}
                        onCompletedFilterChange={onCompletedFilterChange}
                        onSettingsChange={onSettingsChange}
                        searchTerm={searchTerm}
                        onSearchChange={onSearchChange}
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

                {/* Work Order Edit Modal (Manage Phase) - Lazy loaded */}
                {isModalOpen && selectedWorkOrder && (
                    <Suspense fallback={<ModalSkeleton />}>
                        <WorkOrderEditModal
                            workOrder={selectedWorkOrder}
                            onClose={onModalClose}
                            onSave={onWorkOrderSave}
                            onDelete={onWorkOrderDelete}
                        />
                    </Suspense>
                )}

                {/* Work Order Create Modal - Lazy loaded */}
                {isCreateModalOpen && (
                    <Suspense fallback={<ModalSkeleton />}>
                        <WorkOrderCreateModal
                            onClose={onCreateModalClose}
                            onSave={onWorkOrderCreate}
                            shopId={shopId}
                        />
                    </Suspense>
                )}

                {/* Work Order Completion Modal - Lazy loaded */}
                {isCompletionModalOpen && completionWorkOrder && (
                    <Suspense fallback={<ModalSkeleton />}>
                        <WorkOrderCompletionModal
                            workOrder={completionWorkOrder}
                            isOpen={isCompletionModalOpen}
                            onClose={onCompletionModalClose}
                            onConfirm={onCompletionConfirm}
                            generatedInvoiceNumber={generatedInvoiceNumber}
                            isGenerating={isCompletionPending}
                        />
                    </Suspense>
                )}

                {/* Work Order Ready Modal - Lazy loaded */}
                {isReadyModalOpen && readyWorkOrder && (
                    <Suspense fallback={<ModalSkeleton />}>
                        <WorkOrderReadyModal
                            workOrder={readyWorkOrder}
                            isOpen={isReadyModalOpen}
                            onClose={onReadyModalClose}
                            onConfirm={onReadyConfirm}
                        />
                    </Suspense>
                )}

                {/* Work Order Item Templates Modal - Lazy loaded */}
                {isTemplatesModalOpen && shopId && (
                    <Suspense fallback={<ModalSkeleton />}>
                        <WorkOrderItemTemplatesModal
                            isOpen={isTemplatesModalOpen}
                            onClose={onTemplatesModalClose}
                            shopId={shopId}
                        />
                    </Suspense>
                )}

                {/* Status Tracker Management Modal - Lazy loaded */}
                {isStatusTrackersModalOpen && (
                    <Suspense fallback={null}>
                        <StatusTrackerManagementModal
                            isOpen={isStatusTrackersModalOpen}
                            onClose={onStatusTrackersModalClose}
                        />
                    </Suspense>
                )}
            </div>
        </DragDropProvider>
    )
}
