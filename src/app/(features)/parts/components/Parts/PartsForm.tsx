'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Hash, Type, DollarSign, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { CreatePartsRequestRequest, PartItem, VehicleInfo, SupplierInfo } from '@/app/(features)/parts/types/parts'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'

interface PartsIntakeFormProps {
    supplierId?: string
    onSuccess?: (partsRequest: any) => void
    onCancel?: () => void
}

export default function PartsIntakeForm({ supplierId, onSuccess, onCancel }: PartsIntakeFormProps) {

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
    )
}
