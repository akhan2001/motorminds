'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Box } from 'lucide-react'
import type { InvoiceItem } from '../../types/invoice'

interface InvoicePackagesItemsProps {
    items: InvoiceItem[]
    onItemsChange: (items: InvoiceItem[]) => void
}

export const InvoicePackagesItems: React.FC<InvoicePackagesItemsProps> = ({ items, onItemsChange }) => {
    const packagesItems = items.filter(item => item.item_type === 'package')

    const addPackageItem = () => {
        const newItem: InvoiceItem = {
            id: crypto.randomUUID(),
            item_type: 'package',
            description: '',
            quantity: 1,
            unit_price: 0,
            total_price: 0,
        }
        onItemsChange([...items, newItem])
    }

    const updatePackageItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const packageIndex = items.findIndex(item => item.id === packagesItems[index].id)
        const updatedItems = [...items]
        updatedItems[packageIndex] = { ...updatedItems[packageIndex], [field]: value }
        
        // Recalculate total_price
        if (field === 'quantity' || field === 'unit_price') {
            updatedItems[packageIndex].total_price = updatedItems[packageIndex].quantity * updatedItems[packageIndex].unit_price
        }
        
        onItemsChange(updatedItems)
    }

    const removePackageItem = (index: number) => {
        const packageIndex = items.findIndex(item => item.id === packagesItems[index].id)
        onItemsChange(items.filter((_, i) => i !== packageIndex))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Box className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold text-foreground dark:text-white">Package Items</h3>
            </div>

            {packagesItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-500 border border-dashed border-border dark:border-[#2a2a2a] rounded-lg">
                    No packages added yet. Click "Add Package" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {packagesItems.map((item, index) => (
                        <div key={item.id} className="bg-white dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400">Package Item {index + 1}</h4>
                                <Button
                                    type="button"
                                    onClick={() => removePackageItem(index)}
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
                                    <Label htmlFor={`package_description_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                        Description *
                                    </Label>
                                    <Input
                                        id={`package_description_${index}`}
                                        value={item.description}
                                        onChange={(e) => updatePackageItem(index, 'description', e.target.value)}
                                        className="bg-background dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                        placeholder="e.g., Complete service package, Maintenance package"
                                    />
                                </div>

                                {/* Quantity and Unit Price */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`package_quantity_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                            Quantity *
                                        </Label>
                                        <Input
                                            id={`package_quantity_${index}`}
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updatePackageItem(index, 'quantity', Number(e.target.value))}
                                            className="bg-background dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`package_price_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                            Unit Price *
                                        </Label>
                                        <Input
                                            id={`package_price_${index}`}
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updatePackageItem(index, 'unit_price', Number(e.target.value))}
                                            className="bg-background dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                {/* Total */}
                                <div>
                                    <Label htmlFor={`package_total_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                        Total Price
                                    </Label>
                                    <Input
                                        id={`package_total_${index}`}
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

            {/* Add Package Button at Bottom */}
            <div className="pt-3 border-t border-border dark:border-[#2a2a2a]">
                <Button
                    type="button"
                    onClick={addPackageItem}
                    size="sm"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Package
                </Button>
            </div>
        </div>
    )
}

