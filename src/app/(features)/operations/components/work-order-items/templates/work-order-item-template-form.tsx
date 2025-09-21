'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Package, Wrench, Star, DollarSign, Loader2, Save } from 'lucide-react'
import { useCreateWorkOrderItemTemplate, useUpdateWorkOrderItemTemplate } from '../../../hooks/use-work-order-item-templates'
import { getTemplateCategories } from './Categories/template-categories'
import type { WorkOrderItemTemplate, WorkOrderItemTemplateFormData } from '../../../types/work-order-item-templates'

const itemTypeOptions = [
    { value: 'labor', label: 'Labor', icon: Wrench },
    { value: 'part', label: 'Part', icon: Package },
    { value: 'service', label: 'Service', icon: Star },
    { value: 'fee', label: 'Fee', icon: DollarSign },
]

interface WorkOrderItemTemplateFormProps {
    template?: WorkOrderItemTemplate
    shopId: string
    onSuccess?: () => void
    onCancel?: () => void
    className?: string
}

export const WorkOrderItemTemplateForm: React.FC<WorkOrderItemTemplateFormProps> = ({
    template,
    shopId,
    onSuccess,
    onCancel,
    className = ""
}) => {
    const [formData, setFormData] = useState<WorkOrderItemTemplateFormData>({
        item_type: 'labor',
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        unit_cost: 0,
        part_number: '',
        supplier: '',
        category: '',
        labor_hours: 0,
        warranty_period: ''
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    const createTemplateMutation = useCreateWorkOrderItemTemplate()
    const updateTemplateMutation = useUpdateWorkOrderItemTemplate()

    // Initialize form data when template is provided
    useEffect(() => {
        if (template) {
            setFormData({
                item_type: template.item_type || 'labor', // Fallback to 'labor' if empty
                name: template.name || '',
                description: template.description || '',
                quantity: template.quantity || 1,
                unit_price: template.unit_price || 0,
                unit_cost: template.unit_cost || 0,
                part_number: template.part_number || '',
                supplier: template.supplier || '',
                category: template.category || '',
                labor_hours: template.labor_hours || 0,
                warranty_period: template.warranty_period || ''
            })
        }
    }, [template])

    // Ensure form always has a valid item_type
    useEffect(() => {
        if (!formData.item_type || !['labor', 'part', 'service', 'fee'].includes(formData.item_type)) {
            setFormData(prev => ({
                ...prev,
                item_type: 'labor'
            }))
        }
    }, [formData.item_type])

    const handleFieldChange = (field: keyof WorkOrderItemTemplateFormData, value: any) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            }
            
            // Ensure item_type is always valid
            if (field === 'item_type' && (!value || !['labor', 'part', 'service', 'fee'].includes(value))) {
                newData.item_type = 'labor' // Default fallback
            }
            
            return newData
        })
    }

    const calculateTotal = () => {
        if (isLabor) {
            // For labor items: labor_hours * hourly_rate
            return (formData.labor_hours || 0) * formData.unit_price
        } else {
            // For other items: quantity * unit_price
            return formData.quantity * formData.unit_price
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Validate item_type before submitting
            const validItemTypes = ['labor', 'part', 'service', 'fee']
            
            if (!formData.item_type || !validItemTypes.includes(formData.item_type)) {
                throw new Error(`Invalid item type: "${formData.item_type}". Must be one of: ${validItemTypes.join(', ')}`)
            }

            if (template) {
                // Update existing template
                await updateTemplateMutation.mutateAsync({
                    id: template.id,
                    data: {
                        item_type: formData.item_type,
                        name: formData.name,
                        description: formData.description || undefined,
                        quantity: formData.quantity,
                        unit_price: formData.unit_price,
                        unit_cost: formData.unit_cost || undefined,
                        part_number: formData.part_number || undefined,
                        supplier: formData.supplier || undefined,
                        category: formData.category || undefined,
                        labor_hours: formData.labor_hours || undefined,
                        warranty_period: formData.warranty_period || undefined
                    }
                })
            } else {
                // Create new template
                await createTemplateMutation.mutateAsync({
                    shop_id: shopId,
                    item_type: formData.item_type,
                    name: formData.name,
                    description: formData.description || undefined,
                    quantity: formData.quantity,
                    unit_price: formData.unit_price,
                    unit_cost: formData.unit_cost || undefined,
                    part_number: formData.part_number || undefined,
                    supplier: formData.supplier || undefined,
                    category: formData.category || undefined,
                    labor_hours: formData.labor_hours || undefined,
                    warranty_period: formData.warranty_period || undefined
                })
            }
            
            onSuccess?.()
        } catch (error) {
            console.error('Error saving template:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const isLabor = formData.item_type === 'labor'
    const isPart = formData.item_type === 'part'
    const isService = formData.item_type === 'service'
    const isFee = formData.item_type === 'fee'

    return (
        <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
            {/* Item Type Selection */}
            <div className="space-y-2">
                <Label htmlFor="item_type" className="text-sm font-medium text-gray-300">
                    Item Type *
                </Label>
                <Select
                    value={formData.item_type}
                    onValueChange={(value: any) => handleFieldChange('item_type', value)}
                    disabled={!!template} // Disable when editing existing template
                >
                    <SelectTrigger className={`bg-[#1a1a1a] border-[#2a2a2a] text-white ${template ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {itemTypeOptions.map((option) => {
                            const IconComponent = option.icon
                            return (
                                <SelectItem 
                                    key={option.value} 
                                    value={option.value}
                                    className="text-gray-300 hover:text-white hover:bg-[#2a2a2a]"
                                >
                                    <div className="flex items-center gap-2">
                                        <IconComponent className="h-4 w-4" />
                                        {option.label}
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
                {template && (
                    <p className="text-xs text-gray-500">
                        Item type cannot be changed after creation
                    </p>
                )}
            </div>

            {/* Name */}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                    Name *
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Enter template name..."
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                    required
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-300">
                    Description
                </Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Enter template description..."
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                    rows={3}
                />
            </div>

            {/* Category */}
            <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-300">
                    Category
                </Label>
                <Input
                    id="category"
                    value={formData.category || ''}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    placeholder="Enter category..."
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                />
            </div>

            <div className={`grid gap-4 ${isLabor ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {/* Quantity - Hidden for labor items */}
                {!isLabor && (
                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm font-medium text-gray-300">
                            Quantity *
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="0"
                            step="1"
                            value={formData.quantity}
                            onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
                            placeholder="Enter quantity..."
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                            required
                        />
                    </div>
                )}

                {/* Unit Price */}
                <div className="space-y-2">
                    <Label htmlFor="unit_price" className="text-sm font-medium text-gray-300">
                        {isLabor ? 'Hourly Rate' : 'Unit Price'} *
                    </Label>
                    <Input
                        id="unit_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => handleFieldChange('unit_price', parseFloat(e.target.value) || 0)}
                        placeholder={isLabor ? "Enter hourly rate..." : "Enter unit price..."}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                        required
                    />
                </div>
            </div>

            {/* Labor Hours (for labor items) */}
            {isLabor && (
                <div className="space-y-2">
                    <Label htmlFor="labor_hours" className="text-sm font-medium text-gray-300">
                        Labor Hours
                    </Label>
                    <Input
                        id="labor_hours"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.labor_hours || ''}
                        onChange={(e) => handleFieldChange('labor_hours', parseFloat(e.target.value) || undefined)}
                        placeholder="Enter hours..."
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                    />
                </div>
            )}

            {/* Part Number (for parts and some services) */}
            {(isPart || formData.item_type === 'service') && (
                <div className="space-y-2">
                    <Label htmlFor="part_number" className="text-sm font-medium text-gray-300">
                        Part Number {isPart ? '*' : ''}
                    </Label>
                    <Input
                        id="part_number"
                        value={formData.part_number || ''}
                        onChange={(e) => handleFieldChange('part_number', e.target.value)}
                        placeholder="Enter part number..."
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                        required={isPart}
                    />
                </div>
            )}

            {/* Supplier (for parts and services only) */}
            {(isPart || formData.item_type === 'service') && (
                <div className="space-y-2">
                    <Label htmlFor="supplier" className="text-sm font-medium text-gray-300">
                        Supplier
                    </Label>
                    <Input
                        id="supplier"
                        value={formData.supplier || ''}
                        onChange={(e) => handleFieldChange('supplier', e.target.value)}
                        placeholder="Enter supplier..."
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                    />
                </div>
            )}

            {/* Unit Cost */}
            <div className="space-y-2">
                <Label htmlFor="unit_cost" className="text-sm font-medium text-gray-300">
                    Unit Cost
                </Label>
                <Input
                    id="unit_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => handleFieldChange('unit_cost', parseFloat(e.target.value) || 0)}
                    placeholder="Enter cost price..."
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                />
            </div>

            {/* Warranty Period (for parts) */}
            {isPart && (
                <div className="space-y-2">
                    <Label htmlFor="warranty_period" className="text-sm font-medium text-gray-300">
                        Warranty Period
                    </Label>
                    <Input
                        id="warranty_period"
                        value={formData.warranty_period || ''}
                        onChange={(e) => handleFieldChange('warranty_period', e.target.value)}
                        placeholder="e.g., 1 year, 12 months..."
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                    />
                </div>
            )}

            <Separator className="bg-[#2a2a2a]" />

            {/* Calculation Display */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">
                        {isLabor 
                            ? `${formData.labor_hours || 0} hours × $${formData.unit_price.toFixed(2)}/hr`
                            : `${formData.quantity} × $${formData.unit_price.toFixed(2)}`
                        }
                    </span>
                    <span className="text-white font-semibold text-lg">
                        Total: ${calculateTotal().toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            {template ? 'Update Template' : 'Create Template'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
