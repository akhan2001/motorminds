'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CreatePartsRequestRequest, PartItem, VehicleInfo, SupplierInfo } from '@/app/(features)/parts/types/parts'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'
import VehicleInformationForm from './VehicleInformationForm'
import SupplierSelect from './SupplierSelect'
import PartInformationForm from './PartInformationForm'
import OrderDetailsForm from './OrderDetailsForm'
import AdditionalInformationForm from './AdditionalInformationForm'

interface PartsIntakeFormProps {
    supplierId?: string
    onSuccess?: (partsRequest: any) => void
    onCancel?: () => void
}

export default function PartsIntakeForm({ supplierId, onSuccess, onCancel }: PartsIntakeFormProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loadingSuppliers, setLoadingSuppliers] = useState(true)
    const [formData, setFormData] = useState<CreatePartsRequestRequest>({
        vehicle_info: {
            year: undefined,
            make: '',
            model: '',
            engine: '',
            customer_name: ''
        },
        parts_requested: [{
            part_number: '',
            part_name: '',
            description: '',
            quantity: 1,
            estimated_price: undefined,
            urgency: 'normal'
        }],
        supplier_info: {
            supplier_id: supplierId || '',
            supplier_name: '',
            contact_person: '',
            phone_number: '',
            account_number: ''
        },
        priority: 'normal',
        notes: '',
        customer_notes: ''
    })
    const [isLoading, setIsLoading] = useState(false)

    // Fetch suppliers on mount
    useEffect(() => {
        fetchSuppliers()
    }, [])

    // Update supplier info when supplierId prop changes or suppliers are loaded
    useEffect(() => {
        if (supplierId && suppliers.length > 0) {
            const selectedSupplier = suppliers.find(s => s.id === supplierId)
            if (selectedSupplier) {
                handleSupplierChange({
                    supplier_id: selectedSupplier.id,
                    supplier_name: selectedSupplier.name,
                    contact_person: selectedSupplier.contact_person || '',
                    phone_number: selectedSupplier.phone_number || '',
                    account_number: selectedSupplier.account_number || ''
                })
            }
        }
    }, [supplierId, suppliers])

    const fetchSuppliers = async () => {
        try {
            const response = await fetch('/api/suppliers')
            const data = await response.json()
            if (response.ok) {
                setSuppliers(data.suppliers || [])
            } else {
                console.error('Failed to fetch suppliers:', data.error)
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        } finally {
            setLoadingSuppliers(false)
        }
    }

    // Vehicle info handlers
    const handleVehicleInfoChange = (field: keyof VehicleInfo, value: string | number | undefined) => {
        setFormData(prev => ({
            ...prev,
            vehicle_info: { ...prev.vehicle_info, [field]: value }
        }))
    }

    // Supplier handlers
    const handleSupplierChange = (supplierInfo: SupplierInfo) => {
        setFormData(prev => ({
            ...prev,
            supplier_info: supplierInfo
        }))
    }

    // Part info handlers
    const handlePartInfoChange = (field: keyof PartItem, value: string | number | undefined) => {
        setFormData(prev => ({
            ...prev,
            parts_requested: [{ ...prev.parts_requested[0], [field]: value }]
        }))
    }

    // Order details handlers
    const handleQuantityChange = (quantity: number) => {
        setFormData(prev => ({
            ...prev,
            parts_requested: [{ ...prev.parts_requested[0], quantity }]
        }))
    }

    const handleEstimatedPriceChange = (estimatedPrice: number | undefined) => {
        setFormData(prev => ({
            ...prev,
            parts_requested: [{ ...prev.parts_requested[0], estimated_price: estimatedPrice }]
        }))
    }

    const handleUrgencyChange = (urgency: string) => {
        setFormData(prev => ({
            ...prev,
            parts_requested: [{ ...prev.parts_requested[0], urgency: urgency as PartItem['urgency'] }]
        }))
    }

    // Additional info handlers
    const handlePriorityChange = (priority: string) => {
        setFormData(prev => ({ ...prev, priority: priority as CreatePartsRequestRequest['priority'] }))
    }

    const handleNotesChange = (notes: string) => {
        setFormData(prev => ({ ...prev, notes }))
    }

    const handleCustomerNotesChange = (customerNotes: string) => {
        setFormData(prev => ({ ...prev, customer_notes: customerNotes }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.supplier_info?.supplier_name?.trim()) {
            toast.error('Please select a supplier')
            return
        }
        if (!formData.parts_requested[0].part_number.trim()) {
            toast.error('Part number is required')
            return
        }
        if (!formData.parts_requested[0].part_name.trim()) {
            toast.error('Part name is required')
            return
        }
        if (formData.parts_requested[0].quantity <= 0) {
            toast.error('Quantity must be greater than 0')
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/parts/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Parts request created successfully!')
                onSuccess?.(data.partsRequest)
                // Reset form
                setFormData({
                    vehicle_info: {
                        year: undefined,
                        make: '',
                        model: '',
                        engine: '',
                        customer_name: ''
                    },
                    supplier_info: {
                        supplier_id: supplierId || '',
                        supplier_name: '',
                        contact_person: '',
                        phone_number: '',
                        account_number: ''
                    },
                    parts_requested: [{
                        part_number: '',
                        part_name: '',
                        description: '',
                        quantity: 1,
                        estimated_price: undefined,
                        urgency: 'normal'
                    }],
                    priority: 'normal',
                    notes: '',
                    customer_notes: ''
                })
            } else {
                toast.error(data.error || 'Failed to create parts request')
            }
        } catch (error) {
            console.error('Error creating parts request:', error)
            toast.error('Failed to create parts request')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Vehicle Information */}
                    <VehicleInformationForm
                        vehicleInfo={formData.vehicle_info}
                        onChange={handleVehicleInfoChange}
                    />

                    {/* Supplier Selection */}
                    <SupplierSelect
                        suppliers={suppliers}
                        selectedSupplier={formData.supplier_info}
                        onSupplierChange={handleSupplierChange}
                        loading={loadingSuppliers}
                        disabled={!!supplierId}
                    />

                    {/* Part Information */}
                    <PartInformationForm
                        partInfo={formData.parts_requested[0]}
                        onChange={handlePartInfoChange}
                    />

                    {/* Order Details */}
                    <OrderDetailsForm
                        quantity={formData.parts_requested[0]?.quantity || 1}
                        estimatedPrice={formData.parts_requested[0]?.estimated_price}
                        urgency={formData.parts_requested[0]?.urgency || 'normal'}
                        onQuantityChange={handleQuantityChange}
                        onEstimatedPriceChange={handleEstimatedPriceChange}
                        onUrgencyChange={handleUrgencyChange}
                    />

                    {/* Additional Information */}
                    <AdditionalInformationForm
                        priority={formData.priority || 'normal'}
                        notes={formData.notes || ''}
                        customerNotes={formData.customer_notes || ''}
                        onPriorityChange={handlePriorityChange}
                        onNotesChange={handleNotesChange}
                        onCustomerNotesChange={handleCustomerNotesChange}
                    />

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4">
                        {onCancel && (
                            <Button
                                type="button"
                                onClick={onCancel}
                                variant="outline"
                                className="flex-1 border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isLoading || !formData.supplier_info?.supplier_id}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isLoading ? 'Creating Request...' : 'Create Parts Request'}
                        </Button>
                    </div>
                </form>
    )
}
