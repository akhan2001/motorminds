'use client'

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { WorkOrderKanbanItem, WorkOrderPriority, WorkOrderWithDetails } from "../../../types/work-order"
import { useWorkOrderWithDetails, useUpdateWorkOrder } from "../../../hooks/use-work-orders"
import { Loader2 } from "lucide-react"
import { WorkOrderModalHeader } from "./work-order-modal-header"
import { WorkOrderStatusBar } from "./work-order-status-bar"
import { WorkOrderInformation } from "./work-order-information"
import { CustomerInformation } from "./customer-information"
import { VehicleInformation } from "./vehicle-information"
import { WorkOrderNotes } from "./work-order-notes"
import { WorkOrderModalFooter } from "./work-order-modal-footer"
import { WorkOrderRightPanel } from "./work-order-right-panel"
import { WorkOrderDeleteConfirmation } from "./work-order-delete-confirmation"
import { getWorkOrderItems } from "../../../lib/work-order-items-service"
import { createInvoiceFromWorkOrder } from "../../../../financials/lib/invoice-service"
import { calculateInvoiceTotals } from "../../../../financials/lib/invoice-calculations"

export interface WorkOrderDetailsModalProps {
    workOrder: WorkOrderKanbanItem
    onClose: () => void
    onSave?: (updated: WorkOrderKanbanItem, formData?: any) => void
    onDelete?: (workOrderId: string) => void
    className?: string
}

export const WorkOrderDetailsModal: React.FC<WorkOrderDetailsModalProps> = ({ 
    workOrder: initialWorkOrder,
    onClose,
    onSave,
    onDelete,
    className = ""
}) => {
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
    
    // Fetch full work order details
    const { data: workOrderDetails, isLoading, error } = useWorkOrderWithDetails(initialWorkOrder.id)
    
    // Update work order mutation
    const updateWorkOrderMutation = useUpdateWorkOrder()
    
    // Form state for editing
    const [formData, setFormData] = useState({
        title: initialWorkOrder.title || "",
        description: initialWorkOrder.description || "",
        priority: (initialWorkOrder.priority || "medium") as WorkOrderPriority,
        assignee: initialWorkOrder.assignee || "",
        date: initialWorkOrder.date || "",
        customer: initialWorkOrder.customer || "",
        vehicle: initialWorkOrder.vehicle || "",
        tags: initialWorkOrder.tags || [],
        
        // Additional fields for comprehensive display
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        
        // Vehicle details (expanded from vehicle string)
        vehicleYear: "",
        vehicleMake: "",
        vehicleModel: "",
        vehicleColor: "",
        vehicleMileage: "",
        vehicleVin: "",
        vehicleLicensePlate: "",
        
        // Work order specifics
        notes: "",
    })

    // Update form when work order details are fetched
    useEffect(() => {
        if (workOrderDetails) {
            setFormData(prev => ({
                ...prev,
                title: workOrderDetails.title || "",
                description: workOrderDetails.description || "",
                priority: (workOrderDetails.priority || "medium") as WorkOrderPriority,
                assignee: workOrderDetails.technician 
                    ? `${workOrderDetails.technician.first_name} ${workOrderDetails.technician.last_name}`
                    : workOrderDetails.assigned_technician_id || "",
                date: workOrderDetails.created_at.split('T')[0] || "",
                customer: workOrderDetails.customer?.customer_name || "",
                vehicle: workOrderDetails.vehicle 
                    ? `${workOrderDetails.vehicle.year} ${workOrderDetails.vehicle.make} ${workOrderDetails.vehicle.model}${workOrderDetails.vehicle.license_plate ? ` (${workOrderDetails.vehicle.license_plate})` : ''}`
                    : "",
                tags: workOrderDetails.tags || [],
                
                // Customer details
                customerEmail: workOrderDetails.customer?.customer_email || "",
                customerPhone: workOrderDetails.customer?.customer_phone || "",
                customerAddress: workOrderDetails.customer?.customer_address || "",
                
                // Vehicle details
                vehicleYear: workOrderDetails.vehicle?.year?.toString() || "",
                vehicleMake: workOrderDetails.vehicle?.make || "",
                vehicleModel: workOrderDetails.vehicle?.model || "",
                vehicleColor: workOrderDetails.vehicle?.color || "",
                vehicleMileage: workOrderDetails.vehicle?.mileage?.toString() || "",
                vehicleVin: workOrderDetails.vehicle?.vin || "",
                vehicleLicensePlate: workOrderDetails.vehicle?.license_plate || "",
                
                // Work order notes
                notes: workOrderDetails.notes || "",
            }))
        }
    }, [workOrderDetails])

    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleAddTag = (newTag: string) => {
        if (newTag && !formData.tags.includes(newTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag]
            }))
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const handleSave = async () => {
        const workOrderId = workOrderDetails?.id || initialWorkOrder.id
        
        // Prepare the update data for the mutation
        const updateData = {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            notes: formData.notes,
            tags: formData.tags,
        }

        try {
            // Use the mutation hook to update the work order
            await updateWorkOrderMutation.mutateAsync({
                id: workOrderId,
                data: updateData
            })
            
            // Also call the parent onSave callback if provided (for any additional logic)
            const updatedWorkOrder: WorkOrderKanbanItem = {
                ...initialWorkOrder,
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                assignee: formData.assignee,
                date: formData.date,
                customer: formData.customer,
                vehicle: formData.vehicle,
                tags: formData.tags,
            }
            updatedWorkOrder.id = workOrderId
            
            await onSave?.(updatedWorkOrder, formData)
            
            setIsEditing(false)
            toast.success("Work order updated successfully")
        } catch (error) {
            console.error('Error saving work order:', error)
            toast.error("Failed to update work order")
        }
    }

    const handleDelete = () => {
        if (canDelete()) {
            setIsDeleteConfirmationOpen(true)
        } else {
            const status = workOrderDetails?.status || initialWorkOrder.status
            toast.error(`Invoiced work orders cannot be deleted due to financial record requirements`)
        }
    }

    const handleDeleteConfirm = () => {
        onDelete?.(initialWorkOrder.id)
        setIsDeleteConfirmationOpen(false)
        onClose()
    }

    const handleDeleteCancel = () => {
        setIsDeleteConfirmationOpen(false)
    }

    const handleGenerateInvoice = async () => {
        try {
            console.log('Generating invoice for work order:', {
                workOrderId: initialWorkOrder.id,
                customerId: workOrderDetails?.customer_id,
                vehicleId: workOrderDetails?.vehicle_id,
                shopId: workOrderDetails?.shop_id,
                title: workOrderDetails?.title,
                description: workOrderDetails?.description,
                status: workOrderDetails?.status,
                customer: workOrderDetails?.customer,
                vehicle: workOrderDetails?.vehicle
            })

            // Get work order items for calculations
            const workOrderItems = await getWorkOrderItems(workOrderDetails?.id || initialWorkOrder.id)
            
            // Calculate totals excluding rejected items
            const calculations = calculateInvoiceTotals(workOrderItems)
            
            console.log('Invoice calculations:', {
                totalItems: workOrderItems.length,
                approvedItems: calculations.approvedItems.length,
                rejectedItems: calculations.rejectedItems.length,
                subtotal: calculations.subtotal,
                labourTotal: calculations.labourTotal,
                partsTotal: calculations.partsTotal
            })

            // Prepare invoice data - only essential columns needed
            const invoiceData = {
                work_order_id: workOrderDetails?.id || initialWorkOrder.id,
                customer_id: workOrderDetails?.customer_id || '',
                vehicle_id: workOrderDetails?.vehicle_id || '',
                shop_id: workOrderDetails?.shop_id || '',
                amount: calculations.subtotal,
                labour_total_price: calculations.labourTotal,
                parts_total_price: calculations.partsTotal,
                status: 'UNPAID' as const,
                source: 'shop_generated' as const,
                workOrderItems: workOrderItems
            }

            // Create invoice using existing invoice system
            const newInvoice = await createInvoiceFromWorkOrder(invoiceData)
            
            if (newInvoice) {
                // Navigate to existing invoice page
                window.open(`/invoices?invoiceId=${newInvoice.invoice_number}`, '_blank')
                
                // Show success message
                toast.success('Invoice generated successfully!')
                
                // Close work order modal
                onClose()
            }
            
        } catch (error) {
            console.error('Error generating invoice:', error)
            toast.error('Failed to generate invoice. Please try again.')
        }
    }

    // Check if work order can be edited based on status
    const canEdit = () => {
        const status = workOrderDetails?.status || initialWorkOrder.status
        // Allow editing for: pending, approved, in_progress, waiting_parts, waiting_customer, on_hold
        // Disable editing for: completed, invoiced, cancelled
        return status !== 'completed' && status !== 'invoiced' && status !== 'cancelled'
    }

    // Check if work order can be deleted based on status
    const canDelete = () => {
        const status = workOrderDetails?.status || initialWorkOrder.status
        // Allow deletion for all statuses except invoiced (due to financial/legal reasons)
        // This gives maximum flexibility for work order management
        if (!status) return true // Default to allowing deletion if status is unclear
        
        const canDeleteResult = status !== 'invoiced'
        // console.log('Delete check - Status:', status, 'Can delete:', canDeleteResult)
        
        return canDeleteResult
    }

    const handleEdit = () => {
        if (canEdit()) {
            setIsEditing(true)
        } else {
            const status = workOrderDetails?.status || initialWorkOrder.status
            const statusName = status === 'completed' ? 'completed' : 
                              status === 'invoiced' ? 'invoiced' : 'cancelled'
            toast.error(`${statusName.charAt(0).toUpperCase() + statusName.slice(1)} work orders cannot be edited`)
        }
    }
    
    const handleCancel = () => setIsEditing(false)

    // Loading state
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                <div className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-8 flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading work order details...</span>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                <div className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-8 text-center">
                    <p className="text-red-400 mb-4">Failed to load work order details</p>
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    }

    // Don't render if no data yet
    if (!workOrderDetails) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden">
            <div className="bg-[#131313] text-white border-none rounded-lg shadow-lg flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw]">
                <ResizablePanelGroup direction="horizontal" className="w-full h-full">
                    {/* Main Content Panel */}
                    <ResizablePanel defaultSize={60} minSize={50} maxSize={70}>
                        <div className="flex flex-col h-full min-h-0">
                            {/* Header */}
                            <WorkOrderModalHeader 
                                workOrder={initialWorkOrder}
                                workOrderDetails={workOrderDetails}
                                onClose={onClose}
                            />

                            {/* Status Bar */}
                            <WorkOrderStatusBar 
                                priority={formData.priority}
                                date={formData.date}
                                assignee={formData.assignee}
                                status={workOrderDetails.status}
                            />

                            {/* Edit Restriction Notice */}
                            {!canEdit() && (
                                <div className="mx-6 my-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.464 0L4.35 16.5c-.77.833-.192 2.5 1.348 2.5z" />
                                        </svg>
                                        This work order cannot be edited because it has been {workOrderDetails?.status || initialWorkOrder.status}.
                                    </p>
                                </div>
                            )}

                            {/* Main Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                                <div 
                                    className={`p-6 space-y-6 ${!canEdit() ? 'pointer-events-none opacity-90' : ''}`}
                                    onClick={() => {
                                        if (!canEdit() && !isEditing) {
                                            const status = workOrderDetails?.status || initialWorkOrder.status
                                            toast.error(`This work order cannot be edited because it has been ${status}`)
                                        }
                                    }}
                                >
                                {/* Work Order Information */}
                                <WorkOrderInformation 
                                    title={formData.title}
                                    description={formData.description}
                                    priority={formData.priority}
                                    assignee={formData.assignee}
                                    assigneeId={""} // Not used in details view
                                    date={formData.date}
                                    tags={formData.tags}
                                    isEditing={isEditing}
                                    isCreating={false} // Disable technician dropdown for editing
                                    onFieldChange={handleFieldChange}
                                    onAddTag={handleAddTag}
                                    onRemoveTag={handleRemoveTag}
                                />

                                {/* Customer Information */}
                                <CustomerInformation 
                                    customerId={""} // Not used in details view
                                    customerName={formData.customer}
                                    customerEmail={formData.customerEmail}
                                    customerPhone={formData.customerPhone}
                                    customerAddress={formData.customerAddress}
                                    isEditing={isEditing}
                                    onFieldChange={handleFieldChange}
                                />

                                {/* Vehicle Information */}
                                <VehicleInformation 
                                    vehicleId={workOrderDetails.vehicle_id}
                                    vehicleYear={formData.vehicleYear}
                                    vehicleMake={formData.vehicleMake}
                                    vehicleModel={formData.vehicleModel}
                                    vehicleColor={formData.vehicleColor}
                                    vehicleVin={formData.vehicleVin}
                                    vehicleLicensePlate={formData.vehicleLicensePlate}
                                    vehicleMileage={formData.vehicleMileage}
                                    isEditing={isEditing}
                                    onFieldChange={handleFieldChange}
                                />

                                {/* Notes */}
                                <WorkOrderNotes 
                                    notes={formData.notes}
                                    isEditing={isEditing}
                                    onFieldChange={handleFieldChange}
                                />
                                </div>
                            </div>

                            {/* Footer */}
                            <WorkOrderModalFooter 
                                isEditing={isEditing}
                                canEdit={canEdit()}
                                canDelete={canDelete()}
                                canGenerateInvoice={true}
                                workOrderStatus={workOrderDetails?.status || initialWorkOrder.status}
                                onEdit={handleEdit}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onClose={onClose}
                                onDelete={onDelete ? handleDelete : undefined}
                                onGenerateInvoice={handleGenerateInvoice}
                            />
                        </div>
                    </ResizablePanel>

                    {/* Resizable Handle */}
                    <ResizableHandle withHandle />

                    {/* Right Panel */}
                    <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
                        <WorkOrderRightPanel 
                            workOrderId={initialWorkOrder.id} 
                            shopId={initialWorkOrder.shop_id}
                            workOrderStatus={initialWorkOrder.status}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
            
            {/* Delete Confirmation Dialog */}
            <WorkOrderDeleteConfirmation
                workOrder={initialWorkOrder}
                isOpen={isDeleteConfirmationOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    )
}
