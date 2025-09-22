'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Building2, Hash, Type, DollarSign, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { CreatePartsRequestRequest, PartItem, VehicleInfo, SupplierInfo } from '@/app/(features)/parts/types/parts'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'

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
                setFormData(prev => ({
                    ...prev,
                    supplier_info: {
                        supplier_id: selectedSupplier.id,
                        supplier_name: selectedSupplier.name,
                        contact_person: selectedSupplier.contact_person || '',
                        phone_number: selectedSupplier.phone_number || '',
                        account_number: selectedSupplier.account_number || ''
                    }
                }))
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

    const handleInputChange = (field: string, value: string | number | undefined) => {
        setFormData(prev => {
            const newData = { ...prev }
            
            // Handle nested object updates
            if (field.includes('.')) {
                const [parentKey, childKey] = field.split('.')
                if (parentKey === 'vehicle_info') {
                    newData.vehicle_info = { ...prev.vehicle_info, [childKey]: value }
                } else if (parentKey === 'supplier_info') {
                    newData.supplier_info = { ...prev.supplier_info, [childKey]: value }
                } else if (parentKey === 'parts_requested') {
                    const newParts = [...prev.parts_requested]
                    newParts[0] = { ...newParts[0], [childKey]: value }
                    newData.parts_requested = newParts
                }
            } else {
                // Handle direct field updates
                (newData as any)[field] = value
            }
            
            return newData
        })
    }

    const handleSupplierChange = (supplierId: string) => {
        const selectedSupplier = suppliers.find(s => s.id === supplierId)
        if (selectedSupplier) {
            setFormData(prev => ({
                ...prev,
                supplier_info: {
                    supplier_id: selectedSupplier.id,
                    supplier_name: selectedSupplier.name,
                    contact_person: selectedSupplier.contact_person || '',
                    phone_number: selectedSupplier.phone_number || '',
                    account_number: selectedSupplier.account_number || ''
                }
            }))
        }
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
        <Card className="bg-[#111111] border-[#2a2a2a] max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Request Parts from Supplier
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Vehicle Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Vehicle Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer_name" className="text-gray-300">
                                    Customer Name
                                </Label>
                                <Input
                                    id="customer_name"
                                    value={formData.vehicle_info?.customer_name || ''}
                                    onChange={(e) => handleInputChange('vehicle_info.customer_name', e.target.value)}
                                    placeholder="John Doe"
                                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="year" className="text-gray-300">
                                    Year
                                </Label>
                                <Input
                                    id="year"
                                    type="number"
                                    min="1900"
                                    max="2030"
                                    value={formData.vehicle_info?.year || ''}
                                    onChange={(e) => handleInputChange('vehicle_info.year', parseInt(e.target.value))}
                                    placeholder="2020"
                                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="make" className="text-gray-300">
                                    Make
                                </Label>
                                <Input
                                    id="make"
                                    value={formData.vehicle_info?.make || ''}
                                    onChange={(e) => handleInputChange('vehicle_info.make', e.target.value)}
                                    placeholder="Honda"
                                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="model" className="text-gray-300">
                                    Model
                                </Label>
                                <Input
                                    id="model"
                                    value={formData.vehicle_info?.model || ''}
                                    onChange={(e) => handleInputChange('vehicle_info.model', e.target.value)}
                                    placeholder="Civic"
                                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="engine" className="text-gray-300">
                                    Engine
                                </Label>
                                <Input
                                    id="engine"
                                    value={formData.vehicle_info?.engine || ''}
                                    onChange={(e) => handleInputChange('vehicle_info.engine', e.target.value)}
                                    placeholder="1.5L Turbo"
                                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Supplier Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="supplier" className="text-gray-300">
                            Supplier *
                        </Label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                            <Select
                                value={formData.supplier_info?.supplier_id}
                                onValueChange={handleSupplierChange}
                                disabled={!!supplierId || loadingSuppliers}
                            >
                                <SelectTrigger className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                    <SelectValue placeholder={loadingSuppliers ? "Loading suppliers..." : "Select a supplier"} />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id} className="text-white">
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Part Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Part Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="part_number" className="text-gray-300">
                                    Part Number *
                                </Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="part_number"
                                        value={formData.parts_requested[0]?.part_number || ''}
                                        onChange={(e) => handleInputChange('parts_requested.part_number', e.target.value)}
                                        placeholder="ABC123-456"
                                        className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="part_name" className="text-gray-300">
                                    Part Name *
                                </Label>
                                <div className="relative">
                                    <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="part_name"
                                        value={formData.parts_requested[0]?.part_name || ''}
                                        onChange={(e) => handleInputChange('parts_requested.part_name', e.target.value)}
                                        placeholder="Brake Pad Set"
                                        className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-gray-300">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.parts_requested[0]?.description || ''}
                                onChange={(e) => handleInputChange('parts_requested.description', e.target.value)}
                                placeholder="Front brake pads for 2018 Honda Civic..."
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[80px]"
                            />
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Order Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="text-gray-300">
                                    Quantity *
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={formData.parts_requested[0]?.quantity || 1}
                                    onChange={(e) => handleInputChange('parts_requested.quantity', parseInt(e.target.value))}
                                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="estimated_price" className="text-gray-300">
                                    Estimated Price (CAD)
                                </Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="estimated_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.parts_requested[0]?.estimated_price || ''}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            handleInputChange('parts_requested.estimated_price', value ? parseFloat(value) : undefined)
                                        }}
                                        placeholder="0.00"
                                        className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="urgency" className="text-gray-300">
                                    Urgency
                                </Label>
                                <Select
                                    value={formData.parts_requested[0]?.urgency || 'normal'}
                                    onValueChange={(value) => handleInputChange('parts_requested.urgency', value)}
                                >
                                    <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                                        <SelectItem value="low" className="text-white">Low</SelectItem>
                                        <SelectItem value="normal" className="text-white">Normal</SelectItem>
                                        <SelectItem value="high" className="text-white">High</SelectItem>
                                        <SelectItem value="urgent" className="text-white">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Priority and Notes */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Additional Information</h3>
                        
                        <div className="space-y-2">
                            <Label htmlFor="priority" className="text-gray-300">
                                Priority
                            </Label>
                            <Select
                                value={formData.priority || 'normal'}
                                onValueChange={(value) => handleInputChange('priority', value)}
                            >
                                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                                    <SelectItem value="low" className="text-white">Low Priority</SelectItem>
                                    <SelectItem value="normal" className="text-white">Normal Priority</SelectItem>
                                    <SelectItem value="high" className="text-white">High Priority</SelectItem>
                                    <SelectItem value="urgent" className="text-white">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-gray-300">
                                Internal Notes
                            </Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Textarea
                                    id="notes"
                                    value={formData.notes || ''}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Internal notes for shop staff..."
                                    className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[80px]"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="customer_notes" className="text-gray-300">
                                Customer Notes
                            </Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Textarea
                                    id="customer_notes"
                                    value={formData.customer_notes || ''}
                                    onChange={(e) => handleInputChange('customer_notes', e.target.value)}
                                    placeholder="Customer-specific requirements or notes..."
                                    className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[80px]"
                                />
                            </div>
                        </div>
                    </div>

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
            </CardContent>
        </Card>
    )
}
