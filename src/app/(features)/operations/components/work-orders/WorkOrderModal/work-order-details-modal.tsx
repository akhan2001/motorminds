'use client'

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { WorkOrderKanbanItem, WorkOrderPriority } from "../../../types/work-order"
import { WorkOrderModalHeader } from "./work-order-modal-header"
import { WorkOrderStatusBar } from "./work-order-status-bar"
import { WorkOrderInformation } from "./work-order-information"
import { CustomerInformation } from "./customer-information"
import { VehicleInformation } from "./vehicle-information"
import { FinancialInformation } from "./financial-information"
import { WorkOrderNotes } from "./work-order-notes"
import { WorkOrderModalFooter } from "./work-order-modal-footer"
import { WorkOrderRightPanel } from "./work-order-right-panel"

export interface WorkOrderDetailsModalProps {
    workOrder: WorkOrderKanbanItem
    onClose: () => void
    onSave?: (updated: WorkOrderKanbanItem) => void
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
        customerEmail: "customer@example.com", // Mock data
        customerPhone: "+1 (555) 123-4567", // Mock data
        customerAddress: "123 Main St, City, State 12345", // Mock data
        
        // Vehicle details (expanded from vehicle string)
        vehicleYear: "2015",
        vehicleMake: "Honda",
        vehicleModel: "Civic",
        vehicleColor: "Blue",
        vehicleMileage: "85,432",
        vehicleVin: "1HGBH41JXMN109186",
        vehicleLicensePlate: "ABC123",
        
        // Work order specifics
        estimatedHours: "3.5",
        laborCost: "245.00",
        partsCost: "125.50",
        totalCost: "370.50",
        notes: "Customer reported strange noise when braking. Initial inspection suggests brake pad replacement needed.",
    })

    // Update form when work order changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            title: initialWorkOrder.title || "",
            description: initialWorkOrder.description || "",
            priority: (initialWorkOrder.priority || "medium") as WorkOrderPriority,
            assignee: initialWorkOrder.assignee || "",
            date: initialWorkOrder.date || "",
            customer: initialWorkOrder.customer || "",
            vehicle: initialWorkOrder.vehicle || "",
            tags: initialWorkOrder.tags || [],
        }))
    }, [initialWorkOrder])

    // Calculate total cost when labor or parts change
    useEffect(() => {
        const labor = parseFloat(formData.laborCost) || 0
        const parts = parseFloat(formData.partsCost) || 0
        const total = labor + parts
        setFormData(prev => ({
            ...prev,
            totalCost: total.toFixed(2)
        }))
    }, [formData.laborCost, formData.partsCost])

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

    const handleSave = () => {
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

        onSave?.(updatedWorkOrder)
        setIsEditing(false)
        toast.success("Work order updated successfully")
    }

    const handleDelete = () => {
        onDelete?.(initialWorkOrder.id)
        toast.success("Work order deleted successfully")
        onClose()
    }

    const handleEdit = () => setIsEditing(true)
    const handleCancel = () => setIsEditing(false)

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden">
            <div className="bg-[#131313] text-white border-none rounded-lg shadow-lg flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw]">
                <ResizablePanelGroup direction="horizontal" className="w-full h-full">
                    {/* Main Content Panel */}
                    <ResizablePanel defaultSize={70} minSize={60} maxSize={75}>
                        <div className="flex flex-col h-full min-h-0">
                            {/* Header */}
                            <WorkOrderModalHeader 
                                workOrder={initialWorkOrder}
                                onClose={onClose}
                            />

                            {/* Status Bar */}
                            <WorkOrderStatusBar 
                                priority={formData.priority}
                                date={formData.date}
                                assignee={formData.assignee}
                                status="pending"
                            />

                            {/* Main Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                                <div className="p-6 space-y-6">
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

                                {/* Financial Information */}
                                <FinancialInformation 
                                    estimatedHours={formData.estimatedHours}
                                    laborCost={formData.laborCost}
                                    partsCost={formData.partsCost}
                                    totalCost={formData.totalCost}
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
                                onEdit={handleEdit}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onClose={onClose}
                                onDelete={onDelete ? handleDelete : undefined}
                            />
                        </div>
                    </ResizablePanel>

                    {/* Resizable Handle */}
                    <ResizableHandle withHandle />

                    {/* Right Panel */}
                    <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
                        <WorkOrderRightPanel workOrderId={initialWorkOrder.id} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
