'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Package } from 'lucide-react'
import type { InvoiceItem } from '../../types/invoice'

interface InvoicePartsItemsProps {
    items: InvoiceItem[]
    onItemsChange: (items: InvoiceItem[]) => void
}

export const InvoicePartsItems: React.FC<InvoicePartsItemsProps> = ({ items, onItemsChange }) => {
    const partsItems = items.filter(item => item.item_type === 'part')

    const addPartItem = () => {
        const newItem: InvoiceItem = {
            id: crypto.randomUUID(),
            item_type: 'part',
            description: '',
            quantity: 1,
            unit_price: 0,
            total_price: 0,
            part_number: '',
            supplier: ''
        }
        onItemsChange([...items, newItem])
    }

    const updatePartItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const partIndex = items.findIndex(item => item.id === partsItems[index].id)
        const updatedItems = [...items]
        updatedItems[partIndex] = { ...updatedItems[partIndex], [field]: value }
        
        // Recalculate total_price
        if (field === 'quantity' || field === 'unit_price') {
            updatedItems[partIndex].total_price = updatedItems[partIndex].quantity * updatedItems[partIndex].unit_price
        }
        
        onItemsChange(updatedItems)
    }

    const removePartItem = (index: number) => {
        const partIndex = items.findIndex(item => item.id === partsItems[index].id)
        onItemsChange(items.filter((_, i) => i !== partIndex))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Parts Items</h3>
            </div>

            {partsItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-dashed border-[#2a2a2a] rounded-lg">
                    No parts added yet. Click "Add Part" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {partsItems.map((item, index) => (
                        <div key={item.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <h4 className="text-sm font-medium text-green-400">Part Item {index + 1}</h4>
                                <Button
                                    type="button"
                                    onClick={() => removePartItem(index)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 w-7 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {/* Description */}
                                <div>
                                    <Label htmlFor={`part_description_${index}`} className="text-gray-400 text-xs">
                                        Description *
                                    </Label>
                                    <Input
                                        id={`part_description_${index}`}
                                        value={item.description}
                                        onChange={(e) => updatePartItem(index, 'description', e.target.value)}
                                        className="bg-[#111111] border-[#2a2a2a] text-white"
                                        placeholder="e.g., Oil filter, Brake pads"
                                    />
                                </div>

                                {/* Part Number and Supplier */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`part_number_${index}`} className="text-gray-400 text-xs">
                                            Part Number
                                        </Label>
                                        <Input
                                            id={`part_number_${index}`}
                                            value={item.part_number || ''}
                                            onChange={(e) => updatePartItem(index, 'part_number', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            placeholder="PN-12345"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`supplier_${index}`} className="text-gray-400 text-xs">
                                            Supplier
                                        </Label>
                                        <Input
                                            id={`supplier_${index}`}
                                            value={item.supplier || ''}
                                            onChange={(e) => updatePartItem(index, 'supplier', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            placeholder="Supplier name"
                                        />
                                    </div>
                                </div>

                                {/* Quantity and Unit Price */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`part_quantity_${index}`} className="text-gray-400 text-xs">
                                            Quantity *
                                        </Label>
                                        <Input
                                            id={`part_quantity_${index}`}
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updatePartItem(index, 'quantity', Number(e.target.value))}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_price_${index}`} className="text-gray-400 text-xs">
                                            Unit Price *
                                        </Label>
                                        <Input
                                            id={`part_price_${index}`}
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updatePartItem(index, 'unit_price', Number(e.target.value))}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                {/* Total */}
                                <div>
                                    <Label htmlFor={`part_total_${index}`} className="text-gray-400 text-xs">
                                        Total Price
                                    </Label>
                                    <Input
                                        id={`part_total_${index}`}
                                        type="number"
                                        value={item.total_price.toFixed(2)}
                                        disabled
                                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Part Button at Bottom */}
            <div className="pt-3 border-t border-[#2a2a2a]">
                <Button
                    type="button"
                    onClick={addPartItem}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Part
                </Button>
            </div>
        </div>
    )
}

