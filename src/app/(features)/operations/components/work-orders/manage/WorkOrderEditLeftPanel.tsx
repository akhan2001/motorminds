// Left panel component - main content area
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
    WorkOrderModalHeader,
    WorkOrderStatusBar,
    WorkOrderInformation,
    CustomerInformation,
    VehicleInformation,
    WorkOrderNotes,
    WorkOrderModalFooter,
} from '../shared'
import { WorkOrderItemsSection } from './WorkOrderItemsSection'
import { WorkOrderCostSummary } from '../complete/work-order-cost-summary'
import { WorkOrderDeleteConfirmation } from './work-order-delete-confirmation'
import { canEditWorkOrderItems, shouldShowFinancialSummary } from '../../../lib/constants/work-orders'
import type { WorkOrderWithDetails, WorkOrderKanbanItem } from '../../../types/work-order'
import type { WorkOrderItem } from '../../../types/work-order-items'

interface WorkOrderEditLeftPanelProps {
    workOrder: WorkOrderKanbanItem
    workOrderDetails: WorkOrderWithDetails
    form: ReturnType<typeof import('./hooks/use-work-order-edit-form').useWorkOrderEditForm>
    itemManagement: ReturnType<typeof import('./hooks/use-work-order-item-management').useWorkOrderItemManagement>
    onClose: () => void
    onSave?: (updated: WorkOrderKanbanItem, formData?: any) => void
    workOrderItems?: WorkOrderItem[]
    technicianOptions?: { id: string; name: string }[]
    workOrderInvoice?: any
    onDelete?: (workOrderId: string) => void
    onGenerateInvoice?: () => void
    onGoToInvoice?: () => void
    onRevert?: () => void
}

export function WorkOrderEditLeftPanel({
    workOrder,
    workOrderDetails,
    form,
    itemManagement,
    onClose,
    onSave,
    workOrderItems = [],
    technicianOptions = [],
    workOrderInvoice,
    onDelete,
    onGenerateInvoice,
    onGoToInvoice,
    onRevert,
}: WorkOrderEditLeftPanelProps) {
    const canEditItems = canEditWorkOrderItems(workOrderDetails.status)
    const showFinancialSummary = shouldShowFinancialSummary(workOrderDetails.status)

    // Delete confirmation state
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

    const handleSave = async () => {
        // Save items first, then work order
        const itemsSaved = await itemManagement.handleSaveAll()
        if (!itemsSaved) {
            return
        }

        const workOrderSaved = await form.handleSave(workOrder.id)
        if (workOrderSaved && onSave) {
            onSave(workOrder, form.formData)
        }
    }

    const handleEdit = () => {
        if (!form.canEdit) {
            toast.error(`This work order cannot be edited because it has been ${workOrderDetails.status}`)
            return
        }
        form.setIsEditing(true)
    }

    const handleCancel = () => {
        form.setIsEditing(false)
    }

    const handleTechnicianSelect = (technicianId: string, technicianName: string) => {
        form.handleFieldChange('assignee', technicianName)
        // You might want to update the work order's assigned_technician_id here
    }

    const handleAddTag = (tag: string) => {
        const currentTags = form.formData.tags || []
        if (!currentTags.includes(tag)) {
            form.handleFieldChange('tags', [...currentTags, tag])
        }
    }

    const handleRemoveTag = (tag: string) => {
        const currentTags = form.formData.tags || []
        form.handleFieldChange('tags', currentTags.filter(t => t !== tag))
    }

    const handleItemSaved = async (item: any) => {
        // Optimistic update handled by hooks
    }

    const handleItemDeleted = async (itemId: string) => {
        // Optimistic update handled by hooks
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Header */}
            <WorkOrderModalHeader
                workOrder={workOrder}
                workOrderDetails={workOrderDetails}
                onClose={onClose}
                onRevert={onRevert}
            />

            {/* Status Bar */}
            <WorkOrderStatusBar
                priority={form.formData.priority}
                date={form.formData.date}
                startedAt={workOrderDetails.started_at}
                assignee={form.formData.assignee}
                status={workOrderDetails.status}
            />

            {/* Edit Restriction Notice */}
            {!form.canEdit && (
                <div className="mx-6 my-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.464 0L4.35 16.5c-.77.833-.192 2.5 1.348 2.5z" />
                        </svg>
                        This work order cannot be edited because it has been {workOrderDetails.status}.
                    </p>
                </div>
            )}

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div
                    className={`p-6 space-y-6 ${!form.canEdit ? 'pointer-events-none opacity-90' : ''}`}
                    onClick={() => {
                        if (!form.canEdit && !form.isEditing) {
                            toast.error(`This work order cannot be edited because it has been ${workOrderDetails.status}`)
                        }
                    }}
                >
                    {/* Customer Information */}
                    <CustomerInformation
                        customerId=""
                        customerName={form.formData.customer}
                        customerEmail={form.formData.customerEmail}
                        customerPhone={form.formData.customerPhone}
                        customerAddress={form.formData.customerAddress}
                        isEditing={form.isEditing}
                        onFieldChange={form.handleFieldChange}
                    />

                    {/* Vehicle Information */}
                    <VehicleInformation
                        vehicleId={workOrderDetails.vehicle_id || ""}
                        vehicleYear={form.formData.vehicleYear}
                        vehicleMake={form.formData.vehicleMake}
                        vehicleModel={form.formData.vehicleModel}
                        vehicleColor={form.formData.vehicleColor}
                        vehicleVin={form.formData.vehicleVin}
                        vehicleLicensePlate={form.formData.vehicleLicensePlate}
                        vehicleMileage={form.formData.vehicleMileage}
                        isEditing={form.isEditing}
                        onFieldChange={form.handleFieldChange}
                    />

                    {/* Work Order Information */}
                    <WorkOrderInformation
                        title={form.formData.title}
                        description={form.formData.description}
                        priority={form.formData.priority}
                        assignee={form.formData.assignee}
                        assigneeId={workOrderDetails?.assigned_technician_id || ""}
                        date={form.formData.date}
                        tags={form.formData.tags}
                        isEditing={form.isEditing}
                        isCreating={false}
                        onFieldChange={form.handleFieldChange}
                        onTechnicianSelect={handleTechnicianSelect}
                        onAddTag={handleAddTag}
                        onRemoveTag={handleRemoveTag}
                    />

                    {/* Cost Summary - Only show for completed work orders */}
                    {workOrderDetails.status === 'completed' && workOrderItems.length > 0 && (
                        <div className="mt-6">
                            <WorkOrderCostSummary
                                workOrderItems={workOrderItems}
                            />
                        </div>
                    )}

                    {/* Work Order Items - Show for editable statuses */}
                    {canEditItems && (
                        <WorkOrderItemsSection
                            itemsByType={itemManagement.itemsByType}
                            onItemsChange={itemManagement.handleItemsChange}
                            workOrderId={workOrder.id}
                            isEditing={form.isEditing}
                            onItemSaved={handleItemSaved}
                            onItemDeleted={handleItemDeleted}
                        />
                    )}

                    {/* Notes */}
                    <WorkOrderNotes
                        notes={form.formData.notes}
                        isEditing={form.isEditing}
                        onFieldChange={form.handleFieldChange}
                    />
                </div>
            </div>

            {/* Footer */}
            <WorkOrderModalFooter
                isEditing={form.isEditing}
                canEdit={form.canEdit}
                canDelete={!!onDelete}
                canGenerateInvoice={workOrderDetails.status === 'completed'}
                workOrderStatus={workOrderDetails.status}
                hasInvoice={!!workOrderInvoice}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onClose={onClose}
                onDelete={() => setShowDeleteConfirmation(true)}
                onGenerateInvoice={onGenerateInvoice}
                onGoToInvoice={onGoToInvoice}
            />

            {/* Delete Confirmation Dialog */}
            {onDelete && (
                <WorkOrderDeleteConfirmation
                    workOrder={workOrder}
                    isOpen={showDeleteConfirmation}
                    onClose={() => setShowDeleteConfirmation(false)}
                    onConfirm={() => {
                        onDelete(workOrder.id)
                        setShowDeleteConfirmation(false)
                    }}
                />
            )}
        </div>
    )
}

