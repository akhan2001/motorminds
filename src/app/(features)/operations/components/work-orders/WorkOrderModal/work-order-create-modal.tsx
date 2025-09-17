'use client'

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { WorkOrderPriority } from "../../../types/work-order"
import { WorkOrderModalHeader } from "./work-order-modal-header"
// import { WorkOrderStatusBar } from "./work-order-status-bar"
import { WorkOrderInformation } from "./work-order-information"
import { CustomerInformation } from "./customer-information"
import { VehicleInformation } from "./vehicle-information"
import { FinancialInformation } from "./financial-information"
import { WorkOrderNotes } from "./work-order-notes"
import { WorkOrderModalFooter } from "./work-order-modal-footer"
// import WorkOrderItemsPanel from "./work-order-items-panel"

export interface WorkOrderCreateModalProps {
    onClose: () => void
    onSave?: (workOrderData: any) => void
    className?: string
}

interface NewWorkOrderFormData {
    title: string
    description: string
    priority: WorkOrderPriority
    assignee: string
    assigneeId: string
    date: string
    customerId: string
    customer: string
    vehicleId: string // Added vehicle ID tracking
    vehicle: string
    tags: string[]
    
    // Additional fields for comprehensive work order
    customerEmail: string
    customerPhone: string
    customerAddress: string
    
    // Vehicle details
    vehicleYear: string
    vehicleMake: string
    vehicleModel: string
    vehicleColor: string
    vehicleMileage: string
    vehicleVin: string
    vehicleLicensePlate: string
    
    // Work order specifics
    estimatedHours: string
    laborCost: string
    partsCost: string
    totalCost: string
    notes: string
}

export const WorkOrderCreateModal: React.FC<WorkOrderCreateModalProps> = ({ 
    onClose,
    onSave,
    className = ""
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(1) // Track current step (1, 2, 3)
    
    // Form state for new work order
    const [formData, setFormData] = useState<NewWorkOrderFormData>({
        title: "",
        description: "",
        priority: "medium" as WorkOrderPriority,
        assignee: "",
        assigneeId: "",
        date: new Date().toISOString().split('T')[0], // Today's date as default
        customerId: "",
        customer: "",
        vehicleId: "",
        vehicle: "",
        tags: [],
        
        // Customer details (will be populated when customer is selected)
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        
        // Vehicle details (will be populated when vehicle is selected)
        vehicleYear: "",
        vehicleMake: "",
        vehicleModel: "",
        vehicleColor: "",
        vehicleMileage: "",
        vehicleVin: "",
        vehicleLicensePlate: "",
        
        // Work order specifics
        estimatedHours: "",
        laborCost: "0.00",
        partsCost: "0.00",
        totalCost: "0.00",
        notes: "",
    })

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

    // Step validation functions
    const isStep1Complete = () => {
        return formData.customerId && formData.customerId !== "" && 
               (formData.customerId !== "new" || formData.customer.trim())
    }

    const isStep2Complete = () => {
        return isStep1Complete() && 
               ((formData.vehicleId && formData.vehicleId !== "" && formData.vehicleId !== "new") || // Existing vehicle selected OR
               ((!formData.vehicleId || formData.vehicleId === "new") && // New vehicle with required fields
                formData.vehicleMake.trim() && 
                formData.vehicleModel.trim() && 
                formData.vehicleYear.trim()))
    }

    const isStep3Complete = () => {
        return isStep2Complete() && 
               formData.title.trim() && 
               formData.description.trim()
    }

    // Auto-advance to next step when current step is completed
    useEffect(() => {
        if (currentStep === 1 && isStep1Complete()) {
            setCurrentStep(2)
        } else if (currentStep === 2 && isStep2Complete()) {
            setCurrentStep(3)
        }
    }, [currentStep, formData.customerId, formData.customer, formData.vehicleId, formData.vehicleMake, formData.vehicleModel, formData.vehicleYear, formData.title, formData.description])

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
        setIsSubmitting(true)
        
        try {
            // Validate all required steps are complete
            if (!isStep1Complete()) {
                toast.error("Please complete customer information first")
                setCurrentStep(1)
                return
            }
            
            if (!isStep2Complete()) {
                toast.error("Please complete vehicle information")
                setCurrentStep(2)
                return
            }
            
            if (!isStep3Complete()) {
                toast.error("Please complete work order details")
                setCurrentStep(3)
                return
            }

            // Create work order data object
            const workOrderData = {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                assignee: formData.assignee,
                assigneeId: formData.assigneeId,
                customerId: formData.customerId,
                vehicleId: formData.vehicleId,
                customer: formData.customer,
                vehicle: formData.vehicle,
                vehicleMileage: formData.vehicleMileage,
                tags: formData.tags,
                date: formData.date,
                estimatedHours: parseFloat(formData.estimatedHours) || 0,
                laborCost: parseFloat(formData.laborCost) || 0,
                partsCost: parseFloat(formData.partsCost) || 0,
                totalCost: parseFloat(formData.totalCost) || 0,
                notes: formData.notes,
            }

            await onSave?.(workOrderData)
            toast.success("Work order created successfully")
            onClose()
        } catch (error) {
            console.error('Error creating work order:', error)
            toast.error("Failed to create work order. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = () => {
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden">
            <div className="bg-[#131313] text-white border-none rounded-lg shadow-lg flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw]">
                <ResizablePanelGroup direction="horizontal" className="w-full h-full">
                    {/* Main Content Panel */}
                    <ResizablePanel defaultSize={70} minSize={60} maxSize={75}>
                        <div className="flex flex-col h-full min-h-0">
                            {/* Header */}
                            <WorkOrderModalHeader 
                                workOrder={{ id: 'new', title: 'New Work Order' } as any}
                                onClose={onClose}
                                isCreating={true}
                            />

                            {/* Status Bar */}
                            {/* <WorkOrderStatusBar 
                                priority={formData.priority}
                                date={formData.date}
                                assignee={formData.assignee}
                                status="pending"
                            /> */}

                            {/* Main Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                                <div className="p-6 space-y-6">
                                    {/* Step 1: Customer Information */}
                                    <div className={`transition-opacity duration-200 ${currentStep >= 1 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                        <CustomerInformation 
                                            customerId={formData.customerId}
                                            customerName={formData.customer}
                                            customerEmail={formData.customerEmail}
                                            customerPhone={formData.customerPhone}
                                            customerAddress={formData.customerAddress}
                                            isEditing={currentStep >= 1}
                                            onFieldChange={handleFieldChange}
                                            onCustomerChange={(customerId) => handleFieldChange('customerId', customerId)}
                                            isCreating={true}
                                        />
                                    </div>

                                    {/* Step 2: Vehicle Information */}
                                    <div className={`transition-opacity duration-200 ${currentStep >= 2 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                        <VehicleInformation 
                                            customerId={formData.customerId}
                                            selectedVehicleId={formData.vehicleId}
                                            vehicleYear={formData.vehicleYear}
                                            vehicleMake={formData.vehicleMake}
                                            vehicleModel={formData.vehicleModel}
                                            vehicleColor={formData.vehicleColor}
                                            vehicleVin={formData.vehicleVin}
                                            vehicleLicensePlate={formData.vehicleLicensePlate}
                                            vehicleMileage={formData.vehicleMileage}
                                            isEditing={currentStep >= 2}
                                            onFieldChange={handleFieldChange}
                                            onVehicleSelect={(vehicleId, vehicleData) => {
                                                handleFieldChange('vehicleId', vehicleId)
                                                if (vehicleData) {
                                                    // Format vehicle display name
                                                    const vehicleDisplay = `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`
                                                    handleFieldChange('vehicle', vehicleDisplay)
                                                } else if (vehicleId === "new") {
                                                    handleFieldChange('vehicle', '')
                                                }
                                            }}
                                            isCreating={true}
                                        />
                                    </div>
                                    
                                    {/* Step 3: Work Order Information */}
                                    <div className={`transition-opacity duration-200 ${currentStep >= 3 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                        
                                        <WorkOrderInformation 
                                            title={formData.title}
                                            description={formData.description}
                                            priority={formData.priority}
                                            assignee={formData.assignee}
                                            assigneeId={formData.assigneeId}
                                            date={formData.date}
                                            tags={formData.tags}
                                            isEditing={currentStep >= 3}
                                            isCreating={true}
                                            onFieldChange={handleFieldChange}
                                            onTechnicianSelect={(technicianId, technicianData) => {
                                                handleFieldChange('assigneeId', technicianId)
                                                if (technicianData) {
                                                    handleFieldChange('assignee', technicianData.fullName)
                                                } else {
                                                    handleFieldChange('assignee', '')
                                                }
                                            }}
                                            onAddTag={handleAddTag}
                                            onRemoveTag={handleRemoveTag}
                                        />
                                    </div>

                                    {/* Optional Sections - Available after Step 3 is complete */}
                                    {isStep3Complete() && (
                                        <>
                                            {/* Financial Information */}
                                            <div className="transition-opacity duration-200">
                                                <h3 className="text-lg font-semibold text-white mb-4">
                                                    Financial Information <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                                                </h3>
                                                <FinancialInformation 
                                                    estimatedHours={formData.estimatedHours}
                                                    laborCost={formData.laborCost}
                                                    partsCost={formData.partsCost}
                                                    totalCost={formData.totalCost}
                                                    isEditing={true}
                                                    onFieldChange={handleFieldChange}
                                                />
                                            </div>

                                            {/* Notes */}
                                            <div className="transition-opacity duration-200">
                                                <h3 className="text-lg font-semibold text-white mb-4">
                                                    Notes <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                                                </h3>
                                                <WorkOrderNotes 
                                                    notes={formData.notes}
                                                    isEditing={true}
                                                    onFieldChange={handleFieldChange}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <WorkOrderModalFooter 
                                isEditing={true} // Always in edit mode for creation
                                isCreating={true}
                                isSubmitting={isSubmitting}
                                onEdit={() => {}} // Not needed for creation
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onClose={onClose}
                                onDelete={undefined} // No delete for new work orders
                            />
                        </div>
                    </ResizablePanel>

                    {/* Resizable Handle */}
                    <ResizableHandle withHandle />

                    {/* Right Panel - Work Order Items Only */}
                    <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
                        <div className="w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 p-4">
                            <h3 className="text-white font-medium text-sm mb-4">Work Order Items</h3>
                            <p className="text-gray-400 text-xs">Items panel will be available soon.</p>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
