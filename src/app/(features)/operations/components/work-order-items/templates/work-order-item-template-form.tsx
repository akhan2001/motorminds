'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X } from 'lucide-react'
import { useCreateWorkOrderItemTemplate, useUpdateWorkOrderItemTemplate } from '../../../hooks/use-work-order-item-templates'
import type { WorkOrderItemTemplate, WorkOrderItemTemplateFormData } from '../../../types/work-order-item-templates'

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
                item_type: template.item_type,
                name: template.name,
                description: template.description || '',
                quantity: template.quantity,
                unit_price: template.unit_price,
                unit_cost: template.unit_cost || 0,
                part_number: template.part_number || '',
                supplier: template.supplier || '',
                category: template.category || '',
                labor_hours: template.labor_hours || 0,
                warranty_period: template.warranty_period || ''
            })
        }
    }, [template])

    const handleFieldChange = (field: keyof WorkOrderItemTemplateFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
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
    const isPackage = formData.item_type === 'package'

    return (
        <Card className={`bg-[#1a1a1a] border-[#2a2a2a] ${className}`}>
            <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                    {template ? 'Edit Template' : 'Create Template'}
                    {onCancel && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Item Type */}
                    <div className="space-y-2">
                        <Label className="text-gray-300">Item Type</Label>
                        <Select 
                            value={formData.item_type} 
                            onValueChange={(value: any) => handleFieldChange('item_type', value)}
                        >
                            <SelectTrigger className="bg-[#292929] text-white border-[#626262]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                <SelectItem value="labor">Labor</SelectItem>
                                <SelectItem value="part">Part</SelectItem>
                                <SelectItem value="service">Service</SelectItem>
                                <SelectItem value="fee">Fee</SelectItem>
                                <SelectItem value="package">Package</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label className="text-gray-300">Name *</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="Template name"
                            className="bg-[#292929] text-white border-[#626262]"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-gray-300">Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Template description"
                            className="bg-[#292929] text-white border-[#626262]"
                            rows={3}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-gray-300">Category</Label>
                        <Input
                            value={formData.category}
                            onChange={(e) => handleFieldChange('category', e.target.value)}
                            placeholder="e.g., Brakes, Engine, Maintenance"
                            className="bg-[#292929] text-white border-[#626262]"
                        />
                    </div>

                    {/* Quantity and Unit Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">
                                {isLabor ? 'Default Quantity' : 'Quantity'}
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.quantity}
                                onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
                                className="bg-[#292929] text-white border-[#626262]"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">
                                {isLabor ? 'Hourly Rate' : 'Unit Price'}
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.unit_price}
                                onChange={(e) => handleFieldChange('unit_price', parseFloat(e.target.value) || 0)}
                                className="bg-[#292929] text-white border-[#626262]"
                                required
                            />
                        </div>
                    </div>

                    {/* Labor Hours (for labor items) */}
                    {isLabor && (
                        <div className="space-y-2">
                            <Label className="text-gray-300">Labor Hours</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.labor_hours}
                                onChange={(e) => handleFieldChange('labor_hours', parseFloat(e.target.value) || 0)}
                                placeholder="Hours"
                                className="bg-[#292929] text-white border-[#626262]"
                            />
                        </div>
                    )}

                    {/* Part Number and Supplier (for parts) */}
                    {isPart && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Part Number</Label>
                                <Input
                                    value={formData.part_number}
                                    onChange={(e) => handleFieldChange('part_number', e.target.value)}
                                    placeholder="Part number"
                                    className="bg-[#292929] text-white border-[#626262]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Supplier</Label>
                                <Input
                                    value={formData.supplier}
                                    onChange={(e) => handleFieldChange('supplier', e.target.value)}
                                    placeholder="Supplier name"
                                    className="bg-[#292929] text-white border-[#626262]"
                                />
                            </div>
                        </>
                    )}

                    {/* Unit Cost */}
                    <div className="space-y-2">
                        <Label className="text-gray-300">Unit Cost</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.unit_cost}
                            onChange={(e) => handleFieldChange('unit_cost', parseFloat(e.target.value) || 0)}
                            placeholder="Cost price"
                            className="bg-[#292929] text-white border-[#626262]"
                        />
                    </div>

                    {/* Warranty Period */}
                    <div className="space-y-2">
                        <Label className="text-gray-300">Warranty Period</Label>
                        <Input
                            value={formData.warranty_period}
                            onChange={(e) => handleFieldChange('warranty_period', e.target.value)}
                            placeholder="e.g., 12 months, 2 years"
                            className="bg-[#292929] text-white border-[#626262]"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting || !formData.name.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
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
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]"
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
