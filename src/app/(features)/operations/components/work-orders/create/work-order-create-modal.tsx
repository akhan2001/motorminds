'use client'

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from 'uuid'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { WorkOrderPriority } from "../../../types/work-order"
import {
    WorkOrderModalHeader,
    WorkOrderInformation,
    CustomerInformation,
    VehicleInformation,
    WorkOrderNotes,
    WorkOrderModalFooter,
    WorkOrderLaborItems,
    WorkOrderPartsItems,
    WorkOrderGenericItems
} from "../shared"
import { FinancialInformation } from "../manage/financial-information"
import { WorkOrderItemTemplatesPanel } from "../../work-order-items/templates/work-order-item-templates-panel"
import type { WorkOrderItemTemplate } from "../../../types/work-order-item-templates"
import { WorkOrderItemsService } from "../../../lib/work-order-items-service"
import type { WorkOrderItemCreateData } from "../../../types/work-order-items"
import { PanelProvider } from "../../../contexts"
import { Input } from "@/components/ui/input"
import { WalkInVehicleForm } from "./WalkInVehicleForm"
import type { WalkInVehicleInfo } from "../../../../customers/types/vehicle"

// Define the LaborFormItem interface locally to match the component
interface LaborFormItem {
    id: string;
    description: string;
    labor_hours: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    technician_id?: string;
}

// Define the PartFormItem interface locally to match the component
interface PartFormItem {
    id: string;
    description: string;
    part_number?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    supplier?: string;
    category?: string;
    warranty_period?: string;
    notes?: string;
}

// Define the GenericFormItem interface for Services, Fees, Discounts, Packages
interface GenericFormItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
}

export interface WorkOrderCreateModalProps {
    onClose: () => void
    onSave?: (workOrderData: any) => void
    className?: string
    shopId?: string
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

    // Customer type selection
    customerType: 'registered' | 'walk_in'

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

    // Walk-in vehicle information
    walkInVehicleInfo: WalkInVehicleInfo

    // Work order specifics
    estimatedHours: string
    laborCost: string
    partsCost: string
    totalCost: string
    notes: string

    // Labor items
    laborItems: LaborFormItem[]

    // Parts items
    partsItems: PartFormItem[]

    // Generic items (Services, Fees, Discounts, Packages)
    serviceItems: GenericFormItem[]
    feeItems: GenericFormItem[]
    discountItems: GenericFormItem[]
    packageItems: GenericFormItem[]
}

interface SelectedTemplate extends WorkOrderItemTemplate {
    selectedQuantity?: number
    selectedUnitPrice?: number
    selectedLaborHours?: number
    selectedTechnicianId?: string
}

export const WorkOrderCreateModal: React.FC<WorkOrderCreateModalProps> = ({
    onClose,
    onSave,
    className = "",
    shopId
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(1) // Track current step (1, 2, 3)
    const [selectedTemplates, setSelectedTemplates] = useState<SelectedTemplate[]>([])

    // Mock technician options (replace with actual data fetching if needed)
    const technicianOptions = [
        { id: 'tech-1', name: 'John Smith' },
        { id: 'tech-2', name: 'Jane Doe' },
        { id: 'tech-3', name: 'Mike Johnson' },
    ]

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

        // Customer type selection
        customerType: "registered",

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

        // Walk-in vehicle information
        walkInVehicleInfo: {
            year: new Date().getFullYear(),
            make: "",
            model: "",
            license_plate: "",
            color: "",
            vin: "",
            mileage: 0
        },

        // Work order specifics
        estimatedHours: "",
        laborCost: "0.00",
        partsCost: "0.00",
        totalCost: "0.00",
        notes: "",

        // Labor items
        laborItems: [],

        // Parts items
        partsItems: [],

        // Generic items (Services, Fees, Discounts, Packages)
        serviceItems: [],
        feeItems: [],
        discountItems: [],
        packageItems: [],
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
        if (formData.customerType === 'walk_in') {
            // For walk-in customers, validate walk-in vehicle info
            return formData.walkInVehicleInfo.year &&
                formData.walkInVehicleInfo.make.trim() &&
                formData.walkInVehicleInfo.model.trim() &&
                true
        }

        // For registered customers, validate customer selection
        // Must have a valid customer ID (not "new" or empty)
        return formData.customerId && formData.customerId !== "" && formData.customerId !== "new"
    }

    const isStep2Complete = () => {
        if (formData.customerType === 'walk_in') {
            // For walk-in customers, step 2 is already complete (vehicle info is in step 1)
            return isStep1Complete()
        }

        // For registered customers, validate vehicle selection
        // Must have completed step 1 (customer saved) AND have valid vehicle
        return isStep1Complete() &&
            ((formData.vehicleId && formData.vehicleId !== "" && formData.vehicleId !== "new") || // Existing vehicle selected OR
                ((!formData.vehicleId || formData.vehicleId === "new") && // New vehicle with required fields
                    formData.vehicleMake.trim() &&
                    formData.vehicleModel.trim() &&
                    formData.vehicleYear.trim()
                )
            )
    }

    const isStep3Complete = () => {
        return isStep2Complete() &&
            formData.title.trim()
    }

    // Auto-advance to next step when current step is completed
    useEffect(() => {
        if (currentStep === 1 && isStep1Complete()) {
            setCurrentStep(2)
        } else if (currentStep === 2 && isStep2Complete()) {
            setCurrentStep(3)
        }
    }, [currentStep, formData.customerId, formData.customer, formData.vehicleId, formData.vehicleMake, formData.vehicleModel, formData.vehicleYear, formData.title, formData.customerType, formData.walkInVehicleInfo])

    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleWalkInVehicleChange = (vehicleInfo: WalkInVehicleInfo) => {
        setFormData(prev => ({
            ...prev,
            walkInVehicleInfo: vehicleInfo
        }))
    }

    const handleCustomerTypeChange = (customerType: 'registered' | 'walk_in') => {
        setFormData(prev => ({
            ...prev,
            customerType,
            // Reset customer/vehicle data when switching types
            customerId: customerType === 'registered' ? prev.customerId : '',
            customer: customerType === 'registered' ? prev.customer : '',
            vehicleId: customerType === 'registered' ? prev.vehicleId : (customerType === 'walk_in' ? prev.vehicleId : ''),
            vehicle: customerType === 'registered' ? prev.vehicle : '',
            // Reset walk-in data when switching to registered
            walkInVehicleInfo: customerType === 'walk_in' ? prev.walkInVehicleInfo : {
                year: new Date().getFullYear(),
                make: "",
                model: "",
                license_plate: "",
                color: "",
                vin: "",
                mileage: 0
            }
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

    // Labor items handlers
    const handleLaborItemsChange = (items: LaborFormItem[]) => {
        setFormData(prev => ({
            ...prev,
            laborItems: items
        }))

        // Update selected templates - remove any templates that no longer have corresponding items
        // This ensures the green highlight is removed when items are deleted
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'labor' || itemDescriptions.includes(template.name)
        ))
    }

    const handleLaborItemSaved = (item: any) => {
        // Handle successful save of individual labor item
        toast.success(`Labor item "${item.description}" saved successfully`)
    }

    // Parts items handlers
    const handlePartsItemsChange = (items: PartFormItem[]) => {
        setFormData(prev => ({
            ...prev,
            partsItems: items
        }))

        // Update selected templates - remove any templates that no longer have corresponding items
        // This ensures the green highlight is removed when items are deleted
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'part' || itemDescriptions.includes(template.name)
        ))
    }

    const handlePartItemSaved = (item: any) => {
        // Handle successful save of individual part item
        toast.success(`Part item "${item.description}" saved successfully`)
    }

    // Generic items handlers (Services, Fees, Discounts, Packages)
    const handleServiceItemsChange = (items: GenericFormItem[]) => {
        setFormData(prev => ({
            ...prev,
            serviceItems: items
        }))

        // Update selected templates - remove any templates that no longer have corresponding items
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'service' || itemDescriptions.includes(template.name)
        ))
    }

    const handleFeeItemsChange = (items: GenericFormItem[]) => {
        setFormData(prev => ({
            ...prev,
            feeItems: items
        }))

        // Update selected templates - remove any templates that no longer have corresponding items
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'fee' || itemDescriptions.includes(template.name)
        ))
    }

    const handleDiscountItemsChange = (items: GenericFormItem[]) => {
        setFormData(prev => ({
            ...prev,
            discountItems: items
        }))

        // Update selected templates - remove any templates that no longer have corresponding items
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'discount' || itemDescriptions.includes(template.name)
        ))
    }

    const handlePackageItemsChange = (items: GenericFormItem[]) => {
        setFormData(prev => ({
            ...prev,
            packageItems: items
        }))

        // Update selected templates - remove any templates that no longer have corresponding items
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'package' || itemDescriptions.includes(template.name)
        ))
    }

    const handleGenericItemSaved = (item: any) => {
        toast.success(`${item.item_type} item "${item.description}" saved successfully`)
    }

    // Template selection handlers
    const handleTemplateSelect = (template: WorkOrderItemTemplate) => {
        // Check if template is already selected
        const isAlreadySelected = selectedTemplates.some(selected => selected.id === template.id)

        if (isAlreadySelected) {
            // Template already selected, don't add it again
            toast.info('Template already selected')
            return
        }

        // Add to selected templates
        const selectedTemplate: SelectedTemplate = {
            ...template,
            selectedQuantity: template.quantity,
            selectedUnitPrice: template.unit_price,
            selectedLaborHours: template.labor_hours
        }
        setSelectedTemplates(prev => [...prev, selectedTemplate])

        // Auto-populate the appropriate items list based on template type
        if (template.item_type === 'labor') {
            // Add to labor items
            const newLaborItem: LaborFormItem = {
                id: uuidv4(),
                description: template.name,
                labor_hours: template.labor_hours || 1,
                unit_price: template.unit_price || 0,
                total_price: (template.labor_hours || 1) * (template.unit_price || 0),
                notes: template.description || '',
                technician_id: ''
            }
            setFormData(prev => ({
                ...prev,
                laborItems: [...prev.laborItems, newLaborItem]
            }))
            toast.success(`Labor template "${template.name}" added to items`)
        } else if (template.item_type === 'part') {
            // Add to parts items
            const newPartItem: PartFormItem = {
                id: uuidv4(),
                description: template.name,
                part_number: template.part_number || '',
                quantity: template.quantity || 1,
                unit_price: template.unit_price || 0,
                total_price: (template.quantity || 1) * (template.unit_price || 0),
                supplier: template.supplier || '',
                category: template.category || '',
                warranty_period: template.warranty_period || '',
                notes: template.description || ''
            }
            setFormData(prev => ({
                ...prev,
                partsItems: [...prev.partsItems, newPartItem]
            }))
            toast.success(`Part template "${template.name}" added to items`)
        } else if (template.item_type === 'service') {
            // Add to service items
            const newServiceItem: GenericFormItem = {
                id: uuidv4(),
                description: template.name,
                quantity: template.quantity || 1,
                unit_price: template.unit_price || 0,
                total_price: (template.quantity || 1) * (template.unit_price || 0),
                notes: template.description || ''
            }
            setFormData(prev => ({
                ...prev,
                serviceItems: [...prev.serviceItems, newServiceItem]
            }))
            toast.success(`Service template "${template.name}" added to items`)
        } else if (template.item_type === 'fee') {
            // Add to fee items
            const newFeeItem: GenericFormItem = {
                id: uuidv4(),
                description: template.name,
                quantity: template.quantity || 1,
                unit_price: template.unit_price || 0,
                total_price: (template.quantity || 1) * (template.unit_price || 0),
                notes: template.description || ''
            }
            setFormData(prev => ({
                ...prev,
                feeItems: [...prev.feeItems, newFeeItem]
            }))
            toast.success(`Fee template "${template.name}" added to items`)
        } else if (template.item_type === 'discount') {
            // Add to discount items
            const newDiscountItem: GenericFormItem = {
                id: uuidv4(),
                description: template.name,
                quantity: template.quantity || 1,
                unit_price: template.unit_price || 0,
                total_price: (template.quantity || 1) * (template.unit_price || 0),
                notes: template.description || ''
            }
            setFormData(prev => ({
                ...prev,
                discountItems: [...prev.discountItems, newDiscountItem]
            }))
            toast.success(`Discount template "${template.name}" added to items`)
        } else if (template.item_type === 'package') {
            // Add to package items
            const newPackageItem: GenericFormItem = {
                id: uuidv4(),
                description: template.name,
                quantity: template.quantity || 1,
                unit_price: template.unit_price || 0,
                total_price: (template.quantity || 1) * (template.unit_price || 0),
                notes: template.description || ''
            }
            setFormData(prev => ({
                ...prev,
                packageItems: [...prev.packageItems, newPackageItem]
            }))
            toast.success(`Package template "${template.name}" added to items`)
        }
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
                toast.error("Please enter a work order title")
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
                                    {isStep3Complete() && (
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
                                    {isStep3Complete() && (
                                        <>
                                            {/* Financial Information */}
                                            {/* <div className="transition-opacity duration-200">
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
                                            </div> */}

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

                    {/* Right Panel - Work Order Item Templates */}
                    <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                        <PanelProvider
                            allowTemplateActions={false}
                            allowTemplateSelection={true}
                            context="work-order-modal"
                        >
                            <WorkOrderItemTemplatesPanel
                                shopId={shopId || ""}
                                workOrderId="new" // Enable template selection for new work orders
                                onTemplateSelected={handleTemplateSelect}
                                selectedTemplateIds={selectedTemplates.map(t => t.id)}
                                className="h-full"
                            />
                        </PanelProvider>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
