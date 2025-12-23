'use client'

import { useState, Suspense } from "react"
import { toast } from "sonner"
import { Package, FileText } from "lucide-react"

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

// Direct imports for better tree-shaking
import { WorkOrderModalHeader } from "../shared/work-order-modal-header"
import { WorkOrderInformation } from "../shared/work-order-information"
import { CustomerInformation } from "../shared/customer-information"
import { VehicleInformation } from "../shared/vehicle-information"
import { WorkOrderNotes } from "../shared/work-order-notes"
import { WorkOrderModalFooter } from "../shared/work-order-modal-footer"
import { WorkOrderLaborItems } from "../shared/items/WorkOrderLaborItems"
import { WorkOrderPartsItems } from "../shared/items/WorkOrderPartsItems"
import { WorkOrderGenericItems } from "../shared/items/WorkOrderGenericItems"
import { WorkOrderCostSummary } from "../complete/work-order-cost-summary"
import { InvoiceHistoryPanel } from "../shared/invoice-history-panel"
// Lazy load heavy components
import dynamic from 'next/dynamic'

const WorkOrderItemTemplatesPanel = dynamic(
    () => import("../../work-order-items/templates/work-order-item-templates-panel").then(m => ({ default: m.WorkOrderItemTemplatesPanel })),
    { ssr: false }
)
const PanelProvider = dynamic(
    () => import("../../../contexts").then(m => ({ default: m.PanelProvider })),
    { ssr: false }
)
import { WalkInVehicleForm } from "./WalkInVehicleForm"
import { useWorkOrderCreateForm } from "./hooks/use-work-order-create-form"
import { useCreateTemplateManagement } from "./hooks/use-create-template-management"

export interface WorkOrderCreateModalProps {
    onClose: () => void
    onSave?: (workOrderData: any) => void
    className?: string
    shopId?: string
}

export const WorkOrderCreateModal: React.FC<WorkOrderCreateModalProps> = ({
    onClose,
    onSave,
    shopId
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Mock technician options (replace with actual data fetching if needed)
    const technicianOptions = [
        { id: 'tech-1', name: 'John Smith' },
        { id: 'tech-2', name: 'Jane Doe' },
        { id: 'tech-3', name: 'Mike Johnson' },
    ]

    // Use form management hook
    const form = useWorkOrderCreateForm()
    const {
        formData,
        currentStep,
        isStep1Complete,
        isStep2Complete,
        isStep3Complete,
        handleFieldChange,
        handleWalkInVehicleChange,
        handleCustomerTypeChange,
        handleAddTag,
        handleRemoveTag,
        handleLaborItemsChange,
        handlePartsItemsChange,
        handleServiceItemsChange,
        handleFeeItemsChange,
        handleDiscountItemsChange,
        handlePackageItemsChange,
    } = form

    // Use template management hook
    const templateManagement = useCreateTemplateManagement(
        handleLaborItemsChange,
        handlePartsItemsChange,
        handleServiceItemsChange,
        handleFeeItemsChange,
        handleDiscountItemsChange,
        handlePackageItemsChange,
        {
            laborItems: formData.laborItems,
            partsItems: formData.partsItems,
            serviceItems: formData.serviceItems,
            feeItems: formData.feeItems,
            discountItems: formData.discountItems,
            packageItems: formData.packageItems,
        }
    )

    // Item saved handlers
    const handleLaborItemSaved = (item: any) => {
        toast.success(`Labor item "${item.description}" saved successfully`)
    }

    const handlePartItemSaved = (item: any) => {
        toast.success(`Part item "${item.description}" saved successfully`)
    }

    const handleGenericItemSaved = (item: any) => {
        toast.success(`${item.item_type} item "${item.description}" saved successfully`)
    }

    const handleSave = async () => {
        setIsSubmitting(true)

        try {
            // Validate all required steps are complete
            if (!isStep1Complete) {
                toast.error("Please complete customer information first")
                return
            }

            if (!isStep2Complete) {
                toast.error("Please complete vehicle information")
                return
            }

            if (!isStep3Complete) {
                toast.error("Please enter a work order title")
                return
            }

            // Create work order data object
            const workOrderData = {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                assignee: formData.assignee,
                assigneeId: formData.assigneeId,
                customerType: formData.customerType,
                customerId: formData.customerType === 'registered' ? formData.customerId : undefined,
                vehicleId: formData.vehicleId || undefined,
                customer: formData.customerType === 'registered' ? formData.customer : undefined,
                vehicle: formData.customerType === 'registered' ? formData.vehicle : undefined,
                vehicleMileage: formData.customerType === 'registered' ? formData.vehicleMileage : undefined,
                walkInVehicleInfo: formData.customerType === 'walk_in' ? formData.walkInVehicleInfo : undefined,
                tags: formData.tags,
                date: formData.date,
                estimatedHours: parseFloat(formData.estimatedHours) || 0,
                laborCost: parseFloat(formData.laborCost) || 0,
                partsCost: parseFloat(formData.partsCost) || 0,
                totalCost: parseFloat(formData.totalCost) || 0,
                notes: formData.notes,
                // Don't pass selectedTemplates - items are already in laborItems/partsItems
                laborItems: formData.laborItems, // Include labor items
                partsItems: formData.partsItems, // Include parts items
                serviceItems: formData.serviceItems, // Include service items
                feeItems: formData.feeItems, // Include fee items
                discountItems: formData.discountItems, // Include discount items
                packageItems: formData.packageItems, // Include package items
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
            <div className="bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border rounded-lg shadow-lg flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw]">
                <ResizablePanelGroup direction="horizontal" className="w-full h-full">
                    {/* Main Content Panel */}
                    <ResizablePanel defaultSize={65} minSize={50} maxSize={75}>
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
                                    {/* Customer Type Selection */}
                                    <div className={`transition-opacity duration-200 ${currentStep >= 1 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-foreground dark:text-white">Customer Type</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    className={`p-4 border rounded-lg text-center transition-colors ${formData.customerType === 'registered'
                                                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 dark:text-blue-400'
                                                        : 'border-border dark:border-gray-600 hover:border-muted dark:hover:border-gray-500'
                                                        }`}
                                                    onClick={() => handleCustomerTypeChange('registered')}
                                                >
                                                    <div className="font-medium text-foreground dark:text-white">Registered Customer</div>
                                                    <div className="text-xs text-muted-foreground dark:text-gray-400">Existing customer</div>
                                                </button>

                                                <button
                                                    className={`p-4 border rounded-lg text-center transition-colors ${formData.customerType === 'walk_in'
                                                        ? 'border-green-500 bg-green-500/10 text-green-500 dark:text-green-400'
                                                        : 'border-border dark:border-gray-600 hover:border-muted dark:hover:border-gray-500'
                                                        }`}
                                                    onClick={() => handleCustomerTypeChange('walk_in')}
                                                >
                                                    <div className="font-medium text-foreground dark:text-white">Walk-In Customer</div>
                                                    <div className="text-xs text-muted-foreground dark:text-gray-400">Vehicle search only</div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 1: Customer/Vehicle Information */}
                                    <div className={`transition-opacity duration-200 ${currentStep >= 1 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                        {formData.customerType === 'registered' ? (
                                            <CustomerInformation
                                                customerId={formData.customerId}
                                                customerName={formData.customer}
                                                customerEmail={formData.customerEmail}
                                                customerPhone={formData.customerPhone}
                                                customerAddress={formData.customerAddress}
                                                isEditing={currentStep >= 1}
                                                onFieldChange={handleFieldChange}
                                                onCustomerChange={(customerId) => handleFieldChange('customerId', customerId)}
                                                onCustomerSaved={(customerId, customerData) => {
                                                    // Update customer ID and data when customer is saved
                                                    handleFieldChange('customerId', customerId)
                                                    handleFieldChange('customer', customerData.name)
                                                    handleFieldChange('customerEmail', customerData.email || '')
                                                    handleFieldChange('customerPhone', customerData.phone || '')
                                                    handleFieldChange('customerAddress', customerData.address || '')
                                                }}
                                                isCreating={true}
                                            />
                                        ) : (
                                            <WalkInVehicleForm
                                                data={formData.walkInVehicleInfo}
                                                onDataChange={handleWalkInVehicleChange}
                                                shopId={shopId || ""}
                                                onVehicleSelected={(vehicleId) => {
                                                    handleFieldChange('vehicleId', vehicleId)
                                                }}
                                                onVehicleCreated={(vehicleId) => {
                                                    handleFieldChange('vehicleId', vehicleId)
                                                }}
                                                isEditing={currentStep >= 1}
                                            />
                                        )}
                                    </div>

                                    {/* Step 2: Vehicle Information (Registered Customers Only) */}
                                    {formData.customerType === 'registered' && (
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
                                    )}

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

                                    {/* Work Order Items Card - Only show after Step 3 is complete */}
                                    {isStep3Complete && (
                                        <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Work Order Items</h3>
                                                </div>

                                                {/* Labor Items */}
                                                <div className="mb-6">
                                                    <WorkOrderLaborItems
                                                        items={formData.laborItems}
                                                        onItemsChange={handleLaborItemsChange}
                                                        workOrderId={undefined} // No workOrderId for creation
                                                        technicianOptions={technicianOptions}
                                                        onItemSaved={handleLaborItemSaved}
                                                    />
                                                </div>

                                                {/* Parts Items */}
                                                <div className="mb-6">
                                                    <WorkOrderPartsItems
                                                        items={formData.partsItems}
                                                        onItemsChange={handlePartsItemsChange}
                                                        workOrderId={undefined} // No workOrderId for creation
                                                        onItemSaved={handlePartItemSaved}
                                                    />
                                                </div>

                                                {/* Service Items */}
                                                <div className="mb-6">
                                                    <WorkOrderGenericItems
                                                        items={formData.serviceItems}
                                                        onItemsChange={handleServiceItemsChange}
                                                        workOrderId={undefined} // No workOrderId for creation
                                                        onItemSaved={handleGenericItemSaved}
                                                        isEditing={true}
                                                        itemType="service"
                                                        title="Services"
                                                    />
                                                </div>

                                                {/* Fee Items */}
                                                <div className="mb-6">
                                                    <WorkOrderGenericItems
                                                        items={formData.feeItems}
                                                        onItemsChange={handleFeeItemsChange}
                                                        workOrderId={undefined} // No workOrderId for creation
                                                        onItemSaved={handleGenericItemSaved}
                                                        isEditing={true}
                                                        itemType="fee"
                                                        title="Fees"
                                                    />
                                                </div>

                                                {/* Discount Items */}
                                                <div className="mb-6">
                                                    <WorkOrderGenericItems
                                                        items={formData.discountItems}
                                                        onItemsChange={handleDiscountItemsChange}
                                                        workOrderId={undefined} // No workOrderId for creation
                                                        onItemSaved={handleGenericItemSaved}
                                                        isEditing={true}
                                                        itemType="discount"
                                                        title="Discounts"
                                                    />
                                                </div>

                                                {/* Package Items */}
                                                <div>
                                                    <WorkOrderGenericItems
                                                        items={formData.packageItems}
                                                        onItemsChange={handlePackageItemsChange}
                                                        workOrderId={undefined} // No workOrderId for creation
                                                        onItemSaved={handleGenericItemSaved}
                                                        isEditing={true}
                                                        itemType="package"
                                                        title="Packages"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Optional Sections - Available after Step 3 is complete */}
                                    {isStep3Complete && (
                                        <>
                                            {/* Cost Summary */}
                                            <div className="transition-opacity duration-200">
                                                <WorkOrderCostSummary
                                                    workOrderItems={[
                                                        ...formData.laborItems.map(item => ({
                                                            id: item.id,
                                                            work_order_id: '',
                                                            shop_id: shopId || '',
                                                            item_type: 'labor' as const,
                                                            description: item.description,
                                                            quantity: 1,
                                                            unit_price: item.unit_price,
                                                            total_price: item.total_price,
                                                            labor_hours: item.labor_hours,
                                                            technician_id: item.technician_id,
                                                            unit_cost: item.unit_cost,
                                                            category: item.category,
                                                            notes: item.notes,
                                                            active: item.active !== false,
                                                            created_at: new Date().toISOString(),
                                                            updated_at: new Date().toISOString(),
                                                        })),
                                                        ...formData.partsItems.map(item => ({
                                                            id: item.id,
                                                            work_order_id: '',
                                                            shop_id: shopId || '',
                                                            item_type: 'part' as const,
                                                            description: item.description,
                                                            quantity: item.quantity,
                                                            unit_price: item.unit_price,
                                                            total_price: item.total_price,
                                                            part_number: item.part_number,
                                                            unit_cost: item.unit_cost,
                                                            total_cost: item.total_cost,
                                                            supplier: item.supplier,
                                                            category: item.category,
                                                            warranty_period: item.warranty_period,
                                                            notes: item.notes,
                                                            active: item.active !== false,
                                                            created_at: new Date().toISOString(),
                                                            updated_at: new Date().toISOString(),
                                                        })),
                                                        ...formData.serviceItems.map(item => ({
                                                            id: item.id,
                                                            work_order_id: '',
                                                            shop_id: shopId || '',
                                                            item_type: 'service' as const,
                                                            description: item.description,
                                                            quantity: item.quantity,
                                                            unit_price: item.unit_price,
                                                            total_price: item.total_price,
                                                            unit_cost: item.unit_cost,
                                                            category: item.category,
                                                            notes: item.notes,
                                                            active: item.active !== false,
                                                            created_at: new Date().toISOString(),
                                                            updated_at: new Date().toISOString(),
                                                        })),
                                                        ...formData.feeItems.map(item => ({
                                                            id: item.id,
                                                            work_order_id: '',
                                                            shop_id: shopId || '',
                                                            item_type: 'fee' as const,
                                                            description: item.description,
                                                            quantity: item.quantity,
                                                            unit_price: item.unit_price,
                                                            total_price: item.total_price,
                                                            unit_cost: item.unit_cost,
                                                            category: item.category,
                                                            notes: item.notes,
                                                            active: item.active !== false,
                                                            created_at: new Date().toISOString(),
                                                            updated_at: new Date().toISOString(),
                                                        })),
                                                        ...formData.discountItems.map(item => ({
                                                            id: item.id,
                                                            work_order_id: '',
                                                            shop_id: shopId || '',
                                                            item_type: 'discount' as const,
                                                            description: item.description,
                                                            quantity: item.quantity,
                                                            unit_price: item.unit_price,
                                                            total_price: item.total_price,
                                                            unit_cost: item.unit_cost,
                                                            category: item.category,
                                                            notes: item.notes,
                                                            active: item.active !== false,
                                                            created_at: new Date().toISOString(),
                                                            updated_at: new Date().toISOString(),
                                                        })),
                                                        ...formData.packageItems.map(item => ({
                                                            id: item.id,
                                                            work_order_id: '',
                                                            shop_id: shopId || '',
                                                            item_type: 'package' as const,
                                                            description: item.description,
                                                            quantity: item.quantity,
                                                            unit_price: item.unit_price,
                                                            total_price: item.total_price,
                                                            unit_cost: item.unit_cost,
                                                            category: item.category,
                                                            labor_hours: item.labor_hours,
                                                            notes: item.notes,
                                                            active: item.active !== false,
                                                            created_at: new Date().toISOString(),
                                                            updated_at: new Date().toISOString(),
                                                        })),
                                                    ]}
                                                />
                                            </div>

                                            {/* Notes */}
                                            <div className="transition-opacity duration-200">
                                                <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                                                    Notes <span className="text-xs text-muted-foreground dark:text-gray-400 font-normal">(Optional)</span>
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
                                onEdit={() => { }} // Not needed for creation
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onClose={onClose}
                                onDelete={undefined} // No delete for new work orders
                            />
                        </div>
                    </ResizablePanel>

                    {/* Resizable Handle */}
                    <ResizableHandle withHandle />

                    {/* Right Panel - Customer History */}
                    <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                        <div className="h-full w-full bg-card dark:bg-[#131313] border-l border-border dark:border-[#333333] flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-border dark:border-[#333333] flex-shrink-0">
                                <h3 className="text-foreground dark:text-white font-medium text-lg">
                                    Customer History
                                </h3>
                                <p className="text-muted-foreground dark:text-gray-400 text-sm mt-1">
                                    {formData.customerId && formData.customerType === 'registered' 
                                        ? 'Previous invoices and work orders'
                                        : 'Select a customer to view history'
                                    }
                                </p>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                                {formData.customerId && 
                                 formData.customerType === 'registered' && 
                                 formData.customerId !== '' && 
                                 formData.customerId !== 'new' &&
                                 /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.customerId) ? (
                                    <InvoiceHistoryPanel
                                        customerId={formData.customerId}
                                        shopId={shopId}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center p-8">
                                        <div className="text-center">
                                            <FileText className="h-12 w-12 text-muted-foreground dark:text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                                                No Customer Selected
                                            </h3>
                                            <p className="text-muted-foreground dark:text-gray-400 text-sm">
                                                Select a registered customer to view their invoice and work order history
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
