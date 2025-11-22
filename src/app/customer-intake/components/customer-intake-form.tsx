'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    validateForm,
    createWorkOrder,
    getInitialCustomerState,
    type CustomerIntakeState,
    type WorkOrderData
} from '../utils/customer-intake-utils'
import { CustomerIntakeFormSuccess } from './customer-intake-form-success'
import { CustomerIntakeFormContent } from './customer-intake-form-content'

interface CustomerIntakeFormProps {
    shopId: string
    user: any
}

export default function CustomerIntakeForm({ shopId, user }: CustomerIntakeFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [createdWorkOrderNumber, setCreatedWorkOrderNumber] = useState<string | null>(null)
    const [serviceDescription, setServiceDescription] = useState('')
    const [customerState, setCustomerState] = useState<CustomerIntakeState>(getInitialCustomerState())
    const router = useRouter()

    // Auto-hide success message after 40 seconds
    useEffect(() => {
        if (showSuccess) {
            const timeoutId = setTimeout(handleReset, 40000)
            return () => clearTimeout(timeoutId)
        }
    }, [showSuccess])

    const handleFieldChange = (field: string, value: string) => {
        setCustomerState(prev => {
            switch (field) {
                case 'customer':
                    return { ...prev, customerName: value }
                case 'customerId':
                    return { ...prev, customerId: value }
                case 'customerEmail':
                    return { ...prev, customerEmail: value }
                case 'customerPhone':
                    return { ...prev, customerPhone: value }
                case 'customerAddress':
                    return { ...prev, customerAddress: value }
                case 'vehicleId':
                    return { ...prev, vehicleId: value }
                case 'vehicleYear':
                    return { ...prev, vehicleYear: value }
                case 'vehicleMake':
                    return { ...prev, vehicleMake: value }
                case 'vehicleModel':
                    return { ...prev, vehicleModel: value }
                case 'vehicleColor':
                    return { ...prev, vehicleColor: value }
                case 'vehicleVin':
                    return { ...prev, vehicleVin: value }
                case 'vehicleLicensePlate':
                    return { ...prev, vehicleLicensePlate: value }
                case 'vehicleMileage':
                    return { ...prev, vehicleMileage: value }
                default:
                    return prev
            }
        })
    }

    const handleCustomerSaved = (savedCustomerId: string, customerData: any) => {
        setCustomerState(prev => ({
            ...prev,
            customerId: savedCustomerId,
            customerName: customerData.name,
            customerEmail: customerData.email || '',
            customerPhone: customerData.phone || '',
            customerAddress: customerData.address || ''
        }))
    }

    const handleVehicleSelect = (selectedVehicleId: string, vehicleData?: any) => {
        if (vehicleData) {
            setCustomerState(prev => ({
                ...prev,
                vehicleId: selectedVehicleId,
                vehicleYear: vehicleData.year?.toString() || '',
                vehicleMake: vehicleData.make || '',
                vehicleModel: vehicleData.model || '',
                vehicleColor: vehicleData.color || '',
                vehicleVin: vehicleData.vin || '',
                vehicleLicensePlate: vehicleData.license_plate || '',
                vehicleMileage: vehicleData.mileage?.toString() || ''
            }))
        } else {
            setCustomerState(prev => ({ ...prev, vehicleId: selectedVehicleId }))
        }
    }

    const handleVehicleSaved = (savedVehicleId: string) => {
        setCustomerState(prev => ({ ...prev, vehicleId: savedVehicleId }))
    }

    const handleReset = () => {
        setShowSuccess(false)
        setCreatedWorkOrderNumber(null)
        setServiceDescription('')
        setCustomerState(getInitialCustomerState())
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)

        try {
            // Validate form
            const validationError = validateForm(
                serviceDescription,
                customerState.customerId,
                customerState.vehicleId
            )

            if (validationError) {
                toast.error(validationError)
                return
            }

            // Create work order
            const workOrderData: WorkOrderData = {
                serviceDescription,
                customerState
            }

            const result = await createWorkOrder(shopId, workOrderData)

            if (result.success && result.workOrderNumber) {
                setCreatedWorkOrderNumber(result.workOrderNumber)
                setShowSuccess(true)
                toast.success("Work Order created successfully!")
            } else {
                toast.error(result.error || 'Failed to create work order')
            }
        } catch (error: any) {
            console.error('Error creating work order:', error)
            toast.error(`Error: ${error.message || 'Failed to create work order'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (showSuccess && createdWorkOrderNumber) {
        return (
            <CustomerIntakeFormSuccess
                workOrderNumber={createdWorkOrderNumber}
                customerName={customerState.customerName}
                vehicleInfo={{
                    year: customerState.vehicleYear,
                    make: customerState.vehicleMake,
                    model: customerState.vehicleModel
                }}
                serviceDescription={serviceDescription}
                onReset={handleReset}
            />
        )
    }

    return (
        <CustomerIntakeFormContent
            shopId={shopId}
            serviceDescription={serviceDescription}
            isSubmitting={isSubmitting}
            customerId={customerState.customerId}
            customerName={customerState.customerName}
            customerEmail={customerState.customerEmail}
            customerPhone={customerState.customerPhone}
            customerAddress={customerState.customerAddress}
            vehicleId={customerState.vehicleId}
            vehicleYear={customerState.vehicleYear}
            vehicleMake={customerState.vehicleMake}
            vehicleModel={customerState.vehicleModel}
            vehicleColor={customerState.vehicleColor}
            vehicleVin={customerState.vehicleVin}
            vehicleLicensePlate={customerState.vehicleLicensePlate}
            vehicleMileage={customerState.vehicleMileage}
            onServiceDescriptionChange={setServiceDescription}
            onFieldChange={handleFieldChange}
            onCustomerChange={(id) => setCustomerState(prev => ({ ...prev, customerId: id }))}
            onCustomerSaved={handleCustomerSaved}
            onVehicleSelect={handleVehicleSelect}
            onVehicleSaved={handleVehicleSaved}
            onSubmit={handleSubmit}
        />
    )
}
