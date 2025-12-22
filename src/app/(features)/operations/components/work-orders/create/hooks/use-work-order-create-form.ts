import { useState, useEffect } from 'react'
import type { WorkOrderPriority } from '../../../../types/work-order'
import type { WalkInVehicleInfo } from '../../../../../customers/types/vehicle'
import type {
    LaborFormItem,
    PartFormItem,
    GenericFormItem
} from '../../../../types/work-order-item-forms'

/**
 * Form data interface for work order creation
 */
export interface WorkOrderCreateFormData {
    // Basic info
    title: string
    description: string
    priority: WorkOrderPriority
    assignee: string
    assigneeId: string
    date: string
    tags: string[]

    // Customer type
    customerType: 'registered' | 'walk_in'

    // Customer info (registered)
    customerId: string
    customer: string
    customerEmail: string
    customerPhone: string
    customerAddress: string

    // Vehicle info (registered)
    vehicleId: string
    vehicle: string
    vehicleYear: string
    vehicleMake: string
    vehicleModel: string
    vehicleColor: string
    vehicleMileage: string
    vehicleVin: string
    vehicleLicensePlate: string

    // Walk-in vehicle info
    walkInVehicleInfo: WalkInVehicleInfo

    // Work order specifics
    estimatedHours: string
    laborCost: string
    partsCost: string
    totalCost: string
    notes: string

    // Items
    laborItems: LaborFormItem[]
    partsItems: PartFormItem[]
    serviceItems: GenericFormItem[]
    feeItems: GenericFormItem[]
    discountItems: GenericFormItem[]
    packageItems: GenericFormItem[]
}

/**
 * Custom hook for managing work order creation form state
 */
export function useWorkOrderCreateForm() {
    const [currentStep, setCurrentStep] = useState(1)

    const [formData, setFormData] = useState<WorkOrderCreateFormData>({
        title: "",
        description: "",
        priority: "medium" as WorkOrderPriority,
        assignee: "",
        assigneeId: "",
        date: new Date().toISOString().split('T')[0],
        tags: [],

        customerType: "registered",

        customerId: "",
        customer: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",

        vehicleId: "",
        vehicle: "",
        vehicleYear: "",
        vehicleMake: "",
        vehicleModel: "",
        vehicleColor: "",
        vehicleMileage: "",
        vehicleVin: "",
        vehicleLicensePlate: "",

        walkInVehicleInfo: {
            year: new Date().getFullYear(),
            make: "",
            model: "",
            license_plate: "",
            color: "",
            vin: "",
            mileage: 0
        },

        estimatedHours: "",
        laborCost: "0.00",
        partsCost: "0.00",
        totalCost: "0.00",
        notes: "",

        laborItems: [],
        partsItems: [],
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
            return formData.walkInVehicleInfo.year &&
                formData.walkInVehicleInfo.make.trim() &&
                formData.walkInVehicleInfo.model.trim()
        }
        return formData.customerId && formData.customerId !== "" && formData.customerId !== "new"
    }

    const isStep2Complete = () => {
        if (formData.customerType === 'walk_in') {
            return isStep1Complete()
        }
        return isStep1Complete() &&
            ((formData.vehicleId && formData.vehicleId !== "" && formData.vehicleId !== "new") ||
                ((!formData.vehicleId || formData.vehicleId === "new") &&
                    formData.vehicleMake.trim() &&
                    formData.vehicleModel.trim() &&
                    formData.vehicleYear.trim()))
    }

    const isStep3Complete = () => {
        return isStep2Complete() && formData.title.trim()
    }

    // Auto-advance to next step
    useEffect(() => {
        if (currentStep === 1 && isStep1Complete()) {
            setCurrentStep(2)
        } else if (currentStep === 2 && isStep2Complete()) {
            setCurrentStep(3)
        }
    }, [currentStep, formData])

    // Field change handler
    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // Walk-in vehicle change handler
    const handleWalkInVehicleChange = (vehicleInfo: WalkInVehicleInfo) => {
        setFormData(prev => ({
            ...prev,
            walkInVehicleInfo: vehicleInfo
        }))
    }

    // Customer type change handler
    const handleCustomerTypeChange = (customerType: 'registered' | 'walk_in') => {
        setFormData(prev => ({
            ...prev,
            customerType,
            customerId: customerType === 'registered' ? prev.customerId : '',
            customer: customerType === 'registered' ? prev.customer : '',
            vehicleId: customerType === 'registered' ? prev.vehicleId : (customerType === 'walk_in' ? prev.vehicleId : ''),
            vehicle: customerType === 'registered' ? prev.vehicle : '',
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

    // Tag handlers
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

    // Items change handlers
    const handleLaborItemsChange = (items: LaborFormItem[]) => {
        setFormData(prev => ({ ...prev, laborItems: items }))
    }

    const handlePartsItemsChange = (items: PartFormItem[]) => {
        setFormData(prev => ({ ...prev, partsItems: items }))
    }

    const handleServiceItemsChange = (items: GenericFormItem[]) => {
        setFormData(prev => ({ ...prev, serviceItems: items }))
    }

    const handleFeeItemsChange = (items: GenericFormItem[]) => {
        setFormData(prev => ({ ...prev, feeItems: items }))
    }

    const handleDiscountItemsChange = (items: GenericFormItem[]) => {
        setFormData(prev => ({ ...prev, discountItems: items }))
    }

    const handlePackageItemsChange = (items: GenericFormItem[]) => {
        setFormData(prev => ({ ...prev, packageItems: items }))
    }

    return {
        formData,
        currentStep,
        setCurrentStep,
        isStep1Complete: isStep1Complete(),
        isStep2Complete: isStep2Complete(),
        isStep3Complete: isStep3Complete(),
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
    }
}
