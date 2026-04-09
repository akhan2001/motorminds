// Left panel component - main content area
'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import type { ExpenseItemsListRef } from '@/app/(features)/expenses/components/ExpenseItemsList'
// Direct imports for better tree-shaking (Supabase pattern - no barrel exports)
import { WorkOrderModalHeader } from '../shared/work-order-modal-header'
import { WorkOrderStatusBar } from '../shared/work-order-status-bar'
import { WorkOrderInformation } from '../shared/work-order-information'
import { CustomerInformation } from '../shared/customer-information'
import { VehicleInformation } from '../shared/vehicle-information'
import { WorkOrderNotes } from '../shared/work-order-notes'
import { WorkOrderModalFooter } from '../shared/work-order-modal-footer'
import { WorkOrderItemsSection } from './WorkOrderItemsSection'
import { WorkOrderDeleteConfirmation } from './work-order-delete-confirmation'
import { WorkOrderCostSummary } from '../complete/work-order-cost-summary'
import { WorkOrderAdvancePaymentsSection } from '../shared/WorkOrderAdvancePaymentsSection'
import { WorkOrderSendChoiceModal } from '../shared/WorkOrderSendChoiceModal'
import { WorkOrderSendEmailModal } from '../shared/WorkOrderSendEmailModal'
import { WorkOrderSendSmsModal } from '../shared/WorkOrderSendSmsModal'
import { canEditWorkOrderItems, shouldShowFinancialSummary } from '../../../lib/constants/work-orders'
import { workOrderService } from '../../../lib/work-order-service'
import { downloadWorkOrderPDF } from '../../../lib/work-order-pdf-generator'
import { useShopInfo } from '@/hooks/core/useShopInfo'
import { prepareShopBrandingWithLogo } from '../../../../financials/lib/pdf/logo-utils'
import type { WorkOrderWithDetails, WorkOrderKanbanItem } from '../../../types/work-order'
import type { WorkOrderItem } from '../../../types/work-order-items'

const SEND_PRINT_STATUSES = ['pending', 'approved', 'waiting_parts', 'waiting_customer']

interface WorkOrderEditLeftPanelProps {
    workOrder: WorkOrderKanbanItem
    workOrderDetails: WorkOrderWithDetails
    form: ReturnType<typeof import('./hooks/use-work-order-edit-form').useWorkOrderEditForm>
    itemManagement: ReturnType<typeof import('./hooks/use-work-order-item-management').useWorkOrderItemManagement>
    onClose: () => void
    onSave?: (updated: WorkOrderKanbanItem, formData?: any) => void
    workOrderItems?: WorkOrderItem[]
    technicianOptions?: { id: string; name: string }[]
    onDelete?: (workOrderId: string, options?: { deleteInvoice?: boolean }) => void
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
    onDelete,
    onRevert,
}: WorkOrderEditLeftPanelProps) {
    const canEditItems = canEditWorkOrderItems(workOrderDetails.status)
    const showFinancialSummary = shouldShowFinancialSummary(workOrderDetails.status)

    // Delete confirmation state
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
    
    // Track selected vehicle ID for updates
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(
        workOrderDetails.vehicle_id || undefined
    )
    
    // Track selected customer ID for updates
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(
        workOrderDetails.customer_id || undefined
    )

    const expensesListRef = useRef<ExpenseItemsListRef | null>(null)

    const handleSave = async () => {
        // Persist expense items (unified expenses table) first, then other items, then work order
        const expensesPersisted = await expensesListRef.current?.persistAll()
        if (expensesPersisted === false) {
            toast.error('Failed to save expense items')
            return
        }

        const itemsSaved = await itemManagement.handleSaveAll()
        if (!itemsSaved) {
            return
        }

        // Update work order with vehicle_id and/or customer_id if changed
        const updatePayload: Record<string, any> = {}
        
        if (selectedVehicleId !== workOrderDetails.vehicle_id) {
            updatePayload.vehicle_id = selectedVehicleId || null
        }
        
        if (selectedCustomerId !== workOrderDetails.customer_id) {
            updatePayload.customer_id = selectedCustomerId || null
        }
        
        if (Object.keys(updatePayload).length > 0) {
            try {
                await workOrderService.updateWorkOrder(workOrder.id, updatePayload)
            } catch (error) {
                console.error('Error updating work order:', error)
                toast.error('Failed to update work order')
                return
            }
        }

        const workOrderSaved = await form.handleSave(workOrder.id)
        if (workOrderSaved) {
            if (onSave) {
                onSave(workOrder, form.formData)
            }
            // Close the modal after successful save
            onClose()
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

    // Send / Print state
    const [isSendChoiceOpen, setIsSendChoiceOpen] = useState(false)
    const [isSendEmailOpen, setIsSendEmailOpen] = useState(false)
    const [isSendSmsOpen, setIsSendSmsOpen] = useState(false)
    const [isPrinting, setIsPrinting] = useState(false)
    const { data: shopInfo } = useShopInfo()

    const showSendPrint = SEND_PRINT_STATUSES.includes(workOrderDetails.status)

    const handleSend = () => setIsSendChoiceOpen(true)

    const handlePrint = async () => {
        if (!shopInfo) { toast.error('Shop information not available'); return }
        setIsPrinting(true)
        try {
            const shop = await prepareShopBrandingWithLogo(shopInfo)
            await downloadWorkOrderPDF(workOrderDetails, workOrderItems, shop)
        } catch {
            toast.error('Failed to generate PDF')
        } finally {
            setIsPrinting(false)
        }
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
            {/* {!form.canEdit && (
                <div className="mx-6 my-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.464 0L4.35 16.5c-.77.833-.192 2.5 1.348 2.5z" />
                        </svg>
                        This work order cannot be edited because it has been {workOrderDetails.status}.
                    </p>
                </div>
            )} */}

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
                        customerId={selectedCustomerId || ""}
                        customerName={form.formData.customer}
                        customerEmail={form.formData.customerEmail}
                        customerPhone={form.formData.customerPhone}
                        customerAddress={form.formData.customerAddress}
                        isEditing={form.isEditing}
                        onFieldChange={(field: string, value: string) => form.handleFieldChange(field as keyof typeof form.formData, value)}
                        onCustomerChange={(customerId) => {
                            // Update selected customer ID and reset vehicle selection
                            setSelectedCustomerId(customerId === "new" ? undefined : customerId)
                            if (customerId !== selectedCustomerId) {
                                // Reset vehicle selection when customer changes
                                setSelectedVehicleId(undefined)
                                form.handleFieldChange('vehicle', '')
                                form.handleFieldChange('vehicleYear', '')
                                form.handleFieldChange('vehicleMake', '')
                                form.handleFieldChange('vehicleModel', '')
                                form.handleFieldChange('vehicleColor', '')
                                form.handleFieldChange('vehicleVin', '')
                                form.handleFieldChange('vehicleLicensePlate', '')
                                form.handleFieldChange('vehicleMileage', '')
                            }
                        }}
                    />

                    {/* Vehicle Information */}
                    <VehicleInformation
                        customerId={selectedCustomerId || undefined}
                        selectedVehicleId={selectedVehicleId}
                        vehicleId={workOrderDetails.vehicle_id || ""}
                        vehicleYear={form.formData.vehicleYear}
                        vehicleMake={form.formData.vehicleMake}
                        vehicleModel={form.formData.vehicleModel}
                        vehicleColor={form.formData.vehicleColor}
                        vehicleVin={form.formData.vehicleVin}
                        vehicleLicensePlate={form.formData.vehicleLicensePlate}
                        vehicleMileage={form.formData.vehicleMileage}
                        isEditing={form.isEditing}
                        isWorkOrderMode={true}
                        onFieldChange={(field: string, value: string) => form.handleFieldChange(field as keyof typeof form.formData, value)}
                        onVehicleSelect={(vehicleId, vehicleData) => {
                            // Track selected vehicle ID
                            setSelectedVehicleId(vehicleId === "new" ? undefined : vehicleId)
                            
                            // Update form when vehicle is selected
                            if (vehicleData && vehicleId !== "new") {
                                // Update vehicle display name
                                const vehicleDisplay = `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}${vehicleData.licensePlate ? ` (${vehicleData.licensePlate})` : ''}`
                                form.handleFieldChange('vehicle', vehicleDisplay)
                            } else if (vehicleId === "new") {
                                // Clear vehicle display when adding new
                                setSelectedVehicleId(undefined)
                                form.handleFieldChange('vehicle', '')
                            }
                        }}
                        onVehicleSaved={(vehicleId, vehicleData) => {
                            // Update selected vehicle ID when a new vehicle is saved
                            setSelectedVehicleId(vehicleId)
                            
                            // Update form with the newly created vehicle
                            if (vehicleData) {
                                const vehicleDisplay = `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}${vehicleData.licensePlate ? ` (${vehicleData.licensePlate})` : ''}`
                                form.handleFieldChange('vehicle', vehicleDisplay)
                            }
                        }}
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
                        statusTracker={form.formData.statusTracker}
                        isEditing={form.isEditing}
                        isCreating={false}
                        onFieldChange={(field: string, value: any) => form.handleFieldChange(field as keyof typeof form.formData, value)}
                        onTechnicianSelect={handleTechnicianSelect}
                        onAddTag={handleAddTag}
                        onRemoveTag={handleRemoveTag}
                    />

                    {/* Work Order Items - Show for editable statuses */}
                    {canEditItems && (
                        <WorkOrderItemsSection
                            ref={expensesListRef}
                            itemsByType={itemManagement.itemsByType}
                            onItemsChange={itemManagement.handleItemsChange}
                            workOrderId={workOrder.id}
                            isEditing={form.isEditing}
                            onItemSaved={handleItemSaved}
                            onItemDeleted={handleItemDeleted}
                        />
                    )}

                    {/* Cost Summary - Show for completed work orders, before Notes */}
                    {showFinancialSummary && (workOrderItems.length > 0 || workOrder.id) && (
                        <WorkOrderCostSummary
                            workOrderItems={workOrderItems}
                            workOrderId={workOrder.id}
                        />
                    )}

                    {/* Advance Payments - Show if work order hasn't been invoiced */}
                    {!workOrderDetails.invoice_id && (
                        <WorkOrderAdvancePaymentsSection
                            workOrder={workOrderDetails}
                            workOrderItems={workOrderItems}
                            isEditing={form.isEditing}
                        />
                    )}

                    {/* Recommendation */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground dark:text-white">
                            Recommendation <span className="text-xs text-muted-foreground dark:text-gray-400 font-normal">(Optional)</span>
                        </h3>
                        <WorkOrderNotes
                            notes={form.formData.notes}
                            isEditing={form.isEditing}
                            onFieldChange={(field: string, value: string) => form.handleFieldChange(field as keyof typeof form.formData, value)}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <WorkOrderModalFooter
                isEditing={form.isEditing}
                canEdit={form.canEdit}
                canDelete={!!onDelete}
                workOrderStatus={workOrderDetails.status}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onClose={onClose}
                onDelete={() => setShowDeleteConfirmation(true)}
                onSend={showSendPrint ? handleSend : undefined}
                onPrint={showSendPrint ? handlePrint : undefined}
                isPrinting={isPrinting}
            />

            {/* Send / Print Modals */}
            <WorkOrderSendChoiceModal
                workOrder={workOrderDetails}
                isOpen={isSendChoiceOpen}
                onClose={() => setIsSendChoiceOpen(false)}
                onEmailChoice={() => { setIsSendChoiceOpen(false); setIsSendEmailOpen(true) }}
                onSmsChoice={() => { setIsSendChoiceOpen(false); setIsSendSmsOpen(true) }}
            />
            <WorkOrderSendEmailModal
                workOrder={workOrderDetails}
                workOrderItems={workOrderItems}
                isOpen={isSendEmailOpen}
                onClose={() => setIsSendEmailOpen(false)}
                onConfirm={() => setIsSendEmailOpen(false)}
            />
            <WorkOrderSendSmsModal
                workOrder={workOrderDetails}
                workOrderItems={workOrderItems}
                isOpen={isSendSmsOpen}
                onClose={() => setIsSendSmsOpen(false)}
                onConfirm={() => setIsSendSmsOpen(false)}
            />

            {/* Delete Confirmation Dialog */}
            {onDelete && (
                <WorkOrderDeleteConfirmation
                    workOrder={workOrder}
                    isOpen={showDeleteConfirmation}
                    onClose={() => setShowDeleteConfirmation(false)}
                    onConfirm={(options) => {
                        onDelete(workOrder.id, options)
                        setShowDeleteConfirmation(false)
                    }}
                />
            )}
        </div>
    )
}

