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
import { Package, Wrench, Star, DollarSign } from 'lucide-react'
import type { WorkOrderItem, WorkOrderItemFormData, WorkOrderItemType } from '../../types/work-order-items'

interface WorkOrderItemFormProps {
    item?: WorkOrderItem | null
    onSubmit: (data: WorkOrderItemFormData) => void
    onCancel: () => void
    isSubmitting?: boolean
    className?: string
}

const itemTypeOptions = [
    { value: 'labor' as WorkOrderItemType, label: 'Labor', icon: Wrench },
    { value: 'part' as WorkOrderItemType, label: 'Part', icon: Package },
    { value: 'service' as WorkOrderItemType, label: 'Service', icon: Star },
    { value: 'fee' as WorkOrderItemType, label: 'Fee', icon: DollarSign },
]

export const WorkOrderItemForm: React.FC<WorkOrderItemFormProps> = ({
    item,
    onSubmit,
    onCancel,
    isSubmitting = false,
    className = ""
}) => {
    const [formData, setFormData] = useState<WorkOrderItemFormData>({
        item_type: 'part',
        description: '',
        part_number: '',
        quantity: 1,
        unit_price: 0,
        supplier: '',
        category: '',
        warranty_period: '',
        notes: '',
        labor_hours: undefined,
        technician_id: '',
    })

    // Populate form with item data if editing
    useEffect(() => {
        if (item) {
            setFormData({
                item_type: item.item_type,
                description: item.description,
                part_number: item.part_number || '',
                quantity: item.quantity,
                unit_price: item.unit_price,
                supplier: item.supplier || '',
                category: item.category || '',
                warranty_period: item.warranty_period || '',
                notes: item.notes || '',
                labor_hours: item.labor_hours || undefined,
                technician_id: item.technician_id || '',
            })
        }
    }, [item])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    const handleFieldChange = (field: keyof WorkOrderItemFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const calculateTotal = () => {
        return formData.quantity * formData.unit_price
    }

    const isLabor = formData.item_type === 'labor'
    const isPart = formData.item_type === 'part'

    return (
        <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
            {/* Item Type Selection */}
            <div className="space-y-2">
                <Label htmlFor="item_type" className="text-sm font-medium text-gray-300">
                    Item Type *
                </Label>
                <Select
                    value={formData.item_type}
                    onValueChange={(value: WorkOrderItemType) => handleFieldChange('item_type', value)}
                >
                    <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
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
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-300">
                    Description *
                </Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Enter item description..."
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                    rows={3}
                    required
                />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-medium text-gray-300">
                        Quantity *
                    </Label>
                    <Input
                        id="quantity"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.quantity}
                        onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                        required
                    />
                </div>

                {/* Unit Price */}
                <div className="space-y-2">
                    <Label htmlFor="unit_price" className="text-sm font-medium text-gray-300">
                        Unit Price *
                    </Label>
                    <Input
                        id="unit_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => handleFieldChange('unit_price', parseFloat(e.target.value) || 0)}
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

            <div className="grid grid-cols-2 gap-4">
                {/* Supplier */}
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

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-300">
                    Notes
                </Label>
                <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Additional notes..."
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                    rows={2}
                />
            </div>

            <Separator className="bg-[#2a2a2a]" />

            {/* Calculation Display */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">
                        {formData.quantity} × ${formData.unit_price.toFixed(2)}
                    </span>
                    <span className="text-white font-semibold text-lg">
                        Total: ${calculateTotal().toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting || !formData.description.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isSubmitting ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
                </Button>
            </div>
        </form>
    )
}
