'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Wrench } from 'lucide-react'
import { TechnicianDropdown } from '@/app/(features)/technician/components/TechnicianDropdown'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'
import type { InvoiceItem } from '../../types/invoice'

interface InvoiceLaborItemsProps {
    items: InvoiceItem[]
    onItemsChange: (items: InvoiceItem[]) => void
}

export const InvoiceLaborItems: React.FC<InvoiceLaborItemsProps> = ({ items, onItemsChange }) => {
    const { shopId } = useAuth()
    const laborItems = items.filter(item => item.item_type === 'labor')

    const addLaborItem = () => {
        const newItem: InvoiceItem = {
            id: crypto.randomUUID(),
            item_type: 'labor',
            description: '',
            quantity: 1,
            unit_price: 0,
            total_price: 0,
            labor_hours: 0,
            technician_id: ''
        }
        onItemsChange([...items, newItem])
    }

    const updateLaborItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const laborIndex = items.findIndex(item => item.id === laborItems[index].id)
        const updatedItems = [...items]
        updatedItems[laborIndex] = { ...updatedItems[laborIndex], [field]: value }
        
        // Recalculate total_price
        if (field === 'quantity' || field === 'unit_price') {
            updatedItems[laborIndex].total_price = updatedItems[laborIndex].quantity * updatedItems[laborIndex].unit_price
        }
        
        onItemsChange(updatedItems)
    }

    const removeLaborItem = (index: number) => {
        const laborIndex = items.findIndex(item => item.id === laborItems[index].id)
        onItemsChange(items.filter((_, i) => i !== laborIndex))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-foreground dark:text-white">Labor Items</h3>
            </div>

            {laborItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-500 border border-dashed border-border dark:border-[#2a2a2a] rounded-lg">
                    No labor items added yet. Click "Add Labor" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {laborItems.map((item, index) => (
                        <div key={item.id} className="bg-white dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">Labor Item {index + 1}</h4>
                                <Button
                                    type="button"
                                    onClick={() => removeLaborItem(index)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 w-7 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {/* Description */}
                                <div>
                                    <Label htmlFor={`labor_description_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                        Description *
                                    </Label>
                                    <Input
                                        id={`labor_description_${index}`}
                                        value={item.description}
                                        onChange={(e) => updateLaborItem(index, 'description', e.target.value)}
                                        className="bg-background dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                        placeholder="e.g., Oil change, Brake repair"
                                    />
                                </div>

                                {/* Labor Hours and Technician */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`labor_hours_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                            Labor Hours
                                        </Label>
                                        <Input
                                            id={`labor_hours_${index}`}
                                            type="number"
                                            value={item.labor_hours || ''}
                                            onChange={(e) => updateLaborItem(index, 'labor_hours', Number(e.target.value))}
                                            className="bg-background dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                            placeholder="2.5"
                                            min="0"
                                            step="0.25"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`labor_rate_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                            Rate per Hour *
                                        </Label>
                                        <Input
                                            id={`labor_rate_${index}`}
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updateLaborItem(index, 'unit_price', Number(e.target.value))}
                                            className="bg-background dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                {/* Hours and Rate */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* <div>
                                        <Label htmlFor={`labor_quantity_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                            Hours *
                                        </Label>
                                        <Input
                                            id={`labor_quantity_${index}`}
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateLaborItem(index, 'quantity', Number(e.target.value))}
                                            className="bg-background dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                            min="0"
                                            step="0.25"
                                        />
                                    </div> */}
                                    <div>
                                        <Label htmlFor={`technician_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                            Technician (Optional)
                                        </Label>
                                        <TechnicianDropdown
                                            shopId={shopId || ''}
                                            selectedTechnicianId={item.technician_id || ''}
                                            onTechnicianSelect={(technicianId) => updateLaborItem(index, 'technician_id', technicianId === 'none' ? '' : technicianId)}
                                            placeholder="Select Technician"
                                            className="bg-background dark:bg-[#111111] border-border dark:border-[#2a2a2a]"
                                            showNoneOption={true}
                                        />
                                    </div>
                                </div>

                                {/* Total */}
                                <div>
                                    <Label htmlFor={`labor_total_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                        Total Price
                                    </Label>
                                    <Input
                                        id={`labor_total_${index}`}
                                        type="number"
                                        value={item.total_price.toFixed(2)}
                                        disabled
                                        className="bg-slate-50 dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Labor Button at Bottom */}
            <div className="pt-3 border-t border-border dark:border-[#2a2a2a]">
                <Button
                    type="button"
                    onClick={addLaborItem}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Labor
                </Button>
            </div>
        </div>
    )
}

