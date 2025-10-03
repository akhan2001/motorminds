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
import { Card } from '@/components/ui/card'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InvoiceItemType, InvoiceItemFormData, InvoiceItem } from '../../types/invoice-items'

interface InvoiceItemFormProps {
    onSubmit: (data: InvoiceItemFormData) => void
    onCancel: () => void
    initialData?: InvoiceItem | null
    isLoading?: boolean
    className?: string
}

const itemTypes: { value: InvoiceItemType; label: string }[] = [
    { value: 'part', label: 'Part' },
    { value: 'labor', label: 'Labor' },
    { value: 'service', label: 'Service' },
    { value: 'fee', label: 'Fee' },
]

export const InvoiceItemForm: React.FC<InvoiceItemFormProps> = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
    className,
}) => {
    const [formData, setFormData] = useState<InvoiceItemFormData>({
        item_type: initialData?.item_type || 'part',
        description: initialData?.description || '',
        part_number: initialData?.part_number || '',
        supplier: initialData?.supplier || '',
        category: initialData?.category || '',
        quantity: initialData?.quantity || 1,
        unit_price: initialData?.unit_price || 0,
        unit_cost: initialData?.unit_cost || undefined,
        labor_hours: initialData?.labor_hours || undefined,
        technician_id: initialData?.technician_id || undefined,
        invoice_specific_notes: initialData?.invoice_specific_notes || '',
        invoice_specific_discount: initialData?.invoice_specific_discount || 0,
        warranty_period: initialData?.warranty_period || '',
    })

    const [calculatedTotal, setCalculatedTotal] = useState<number>(0)

    // Calculate total whenever quantity, unit_price, or discount changes
    useEffect(() => {
        const quantity = formData.quantity || 0
        const unitPrice = formData.unit_price || 0
        const discount = formData.invoice_specific_discount || 0
        const total = quantity * unitPrice - discount
        setCalculatedTotal(Math.max(0, total))
    }, [formData.quantity, formData.unit_price, formData.invoice_specific_discount])

    const handleChange = (field: keyof InvoiceItemFormData, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validate required fields
        if (!formData.description.trim()) {
            alert('Description is required')
            return
        }

        if (formData.quantity <= 0) {
            alert('Quantity must be greater than 0')
            return
        }

        if (formData.unit_price < 0) {
            alert('Unit price cannot be negative')
            return
        }

        // Clean up form data based on item type
        const cleanedData: InvoiceItemFormData = {
            ...formData,
            part_number: formData.part_number?.trim() || undefined,
            supplier: formData.supplier?.trim() || undefined,
            category: formData.category?.trim() || undefined,
            invoice_specific_notes: formData.invoice_specific_notes?.trim() || undefined,
            warranty_period: formData.warranty_period?.trim() || undefined,
        }

        // Remove labor-specific fields for non-labor items
        if (formData.item_type !== 'labor') {
            cleanedData.labor_hours = undefined
            cleanedData.technician_id = undefined
        }

        // Remove part-specific fields for non-part items
        if (formData.item_type !== 'part') {
            cleanedData.part_number = undefined
            cleanedData.supplier = undefined
        }

        onSubmit(cleanedData)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    return (
        <Card className={cn('bg-[#1a1a1a] border-[#2a2a2a] p-6', className)}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                        {initialData ? 'Edit Item' : 'Add New Item'}
                    </h3>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Item Type */}
                <div>
                    <Label htmlFor="item_type" className="text-gray-300">
                        Item Type *
                    </Label>
                    <Select
                        value={formData.item_type}
                        onValueChange={(value) => handleChange('item_type', value as InvoiceItemType)}
                    >
                        <SelectTrigger className="bg-[#111111] border-[#2a2a2a] text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                            {itemTypes.map((type) => (
                                <SelectItem
                                    key={type.value}
                                    value={type.value}
                                    className="text-white hover:bg-[#2a2a2a]"
                                >
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Description */}
                <div>
                    <Label htmlFor="description" className="text-gray-300">
                        Description *
                    </Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Enter item description"
                        className="bg-[#111111] border-[#2a2a2a] text-white"
                        rows={2}
                        required
                    />
                </div>

                {/* Part-specific fields */}
                {formData.item_type === 'part' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="part_number" className="text-gray-300">
                                Part Number
                            </Label>
                            <Input
                                id="part_number"
                                value={formData.part_number}
                                onChange={(e) => handleChange('part_number', e.target.value)}
                                placeholder="PN-12345"
                                className="bg-[#111111] border-[#2a2a2a] text-white"
                            />
                        </div>
                        <div>
                            <Label htmlFor="supplier" className="text-gray-300">
                                Supplier
                            </Label>
                            <Input
                                id="supplier"
                                value={formData.supplier}
                                onChange={(e) => handleChange('supplier', e.target.value)}
                                placeholder="Supplier name"
                                className="bg-[#111111] border-[#2a2a2a] text-white"
                            />
                        </div>
                    </div>
                )}

                {/* Labor-specific fields */}
                {formData.item_type === 'labor' && (
                    <div>
                        <Label htmlFor="labor_hours" className="text-gray-300">
                            Labor Hours
                        </Label>
                        <Input
                            id="labor_hours"
                            type="number"
                            step="0.25"
                            min="0"
                            value={formData.labor_hours || ''}
                            onChange={(e) => handleChange('labor_hours', parseFloat(e.target.value) || undefined)}
                            placeholder="2.5"
                            className="bg-[#111111] border-[#2a2a2a] text-white"
                        />
                    </div>
                )}

                {/* Category */}
                <div>
                    <Label htmlFor="category" className="text-gray-300">
                        Category
                    </Label>
                    <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        placeholder="e.g., Engine, Brakes, etc."
                        className="bg-[#111111] border-[#2a2a2a] text-white"
                    />
                </div>

                {/* Quantity and Pricing */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="quantity" className="text-gray-300">
                            Quantity *
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.quantity}
                            onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 1)}
                            className="bg-[#111111] border-[#2a2a2a] text-white"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="unit_price" className="text-gray-300">
                            Unit Price * {formData.item_type === 'labor' && '(per hour)'}
                        </Label>
                        <Input
                            id="unit_price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.unit_price}
                            onChange={(e) => handleChange('unit_price', parseFloat(e.target.value) || 0)}
                            className="bg-[#111111] border-[#2a2a2a] text-white"
                            required
                        />
                    </div>
                </div>

                {/* Unit Cost (optional) */}
                <div>
                    <Label htmlFor="unit_cost" className="text-gray-300">
                        Unit Cost (Optional - for profit tracking)
                    </Label>
                    <Input
                        id="unit_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unit_cost || ''}
                        onChange={(e) => handleChange('unit_cost', parseFloat(e.target.value) || undefined)}
                        placeholder="Your cost"
                        className="bg-[#111111] border-[#2a2a2a] text-white"
                    />
                </div>

                {/* Discount */}
                <div>
                    <Label htmlFor="discount" className="text-gray-300">
                        Item Discount
                    </Label>
                    <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.invoice_specific_discount || ''}
                        onChange={(e) => handleChange('invoice_specific_discount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="bg-[#111111] border-[#2a2a2a] text-white"
                    />
                </div>

                {/* Warranty */}
                <div>
                    <Label htmlFor="warranty_period" className="text-gray-300">
                        Warranty Period
                    </Label>
                    <Input
                        id="warranty_period"
                        value={formData.warranty_period}
                        onChange={(e) => handleChange('warranty_period', e.target.value)}
                        placeholder="e.g., 90 days, 1 year"
                        className="bg-[#111111] border-[#2a2a2a] text-white"
                    />
                </div>

                {/* Notes */}
                <div>
                    <Label htmlFor="notes" className="text-gray-300">
                        Notes
                    </Label>
                    <Textarea
                        id="notes"
                        value={formData.invoice_specific_notes}
                        onChange={(e) => handleChange('invoice_specific_notes', e.target.value)}
                        placeholder="Additional notes for this item"
                        className="bg-[#111111] border-[#2a2a2a] text-white"
                        rows={2}
                    />
                </div>

                {/* Total Display */}
                <div className="pt-4 border-t border-[#2a2a2a]">
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-white font-semibold">{formatCurrency(calculatedTotal)}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                        {isLoading ? (
                            'Saving...'
                        ) : (
                            <>
                                {initialData ? 'Update Item' : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Item
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    )
}

export default InvoiceItemForm

