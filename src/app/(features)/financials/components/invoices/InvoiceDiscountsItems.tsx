'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Tag } from 'lucide-react'
import type { InvoiceItem } from '../../types/invoice'

interface InvoiceDiscountsItemsProps {
    items: InvoiceItem[]
    onItemsChange: (items: InvoiceItem[]) => void
}

export const InvoiceDiscountsItems: React.FC<InvoiceDiscountsItemsProps> = ({ items, onItemsChange }) => {
    const discountsItems = items.filter(item => item.item_type === 'discount')

    const addDiscountItem = () => {
        const newItem: InvoiceItem = {
            id: crypto.randomUUID(),
            item_type: 'discount',
            description: '',
            quantity: 1,
            unit_price: 0,
            total_price: 0,
        }
        onItemsChange([...items, newItem])
    }

    const updateDiscountItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const discountIndex = items.findIndex(item => item.id === discountsItems[index].id)
        const updatedItems = [...items]
        updatedItems[discountIndex] = { ...updatedItems[discountIndex], [field]: value }
        
        // For discounts: total_price = unit_price (discount amount)
        if (field === 'unit_price') {
            updatedItems[discountIndex].total_price = value || 0
        }
        
        onItemsChange(updatedItems)
    }

    const removeDiscountItem = (index: number) => {
        const discountIndex = items.findIndex(item => item.id === discountsItems[index].id)
        onItemsChange(items.filter((_, i) => i !== discountIndex))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-foreground dark:text-white">Discount Items</h3>
            </div>

            {discountsItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-500 border border-dashed border-border dark:border-[#2a2a2a] rounded-lg">
                    No discounts added yet. Click "Add Discount" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {discountsItems.map((item, index) => (
                        <div key={item.id} className="bg-white dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <h4 className="text-sm font-medium text-red-600 dark:text-red-400">Discount Item {index + 1}</h4>
                                <Button
                                    type="button"
                                    onClick={() => removeDiscountItem(index)}
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
                                    <Label htmlFor={`discount_description_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                        Description *
                                    </Label>
                                    <Input
                                        id={`discount_description_${index}`}
                                        value={item.description}
                                        onChange={(e) => updateDiscountItem(index, 'description', e.target.value)}
                                        className="bg-background dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                        placeholder="e.g., 10% off, Senior discount, Loyalty discount"
                                    />
                                </div>

                                {/* Discount Amount */}
                                <div>
                                    <Label htmlFor={`discount_amount_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                        Discount Amount *
                                    </Label>
                                    <Input
                                        id={`discount_amount_${index}`}
                                        type="number"
                                        value={item.unit_price || ''}
                                        onChange={(e) => {
                                            const inputValue = e.target.value
                                            // Allow empty string for clearing, otherwise parse as number
                                            if (inputValue === '') {
                                                updateDiscountItem(index, 'unit_price', 0)
                                            } else {
                                                const numValue = parseFloat(inputValue)
                                                if (!isNaN(numValue)) {
                                                    updateDiscountItem(index, 'unit_price', numValue)
                                                }
                                            }
                                        }}
                                        className="bg-background dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter discount amount"
                                    />
                                </div>

                                {/* Total (showing as negative for discount) */}
                                <div>
                                    <Label htmlFor={`discount_total_${index}`} className="text-muted-foreground dark:text-gray-400 text-xs">
                                        Discount Amount
                                    </Label>
                                    <Input
                                        id={`discount_total_${index}`}
                                        type="number"
                                        value={item.total_price.toFixed(2)}
                                        disabled
                                        className="bg-slate-50 dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-red-600 dark:text-red-400 font-semibold"
                                    />
                                    <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                                        This amount will be subtracted from the subtotal
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Discount Button at Bottom */}
            <div className="pt-3 border-t border-border dark:border-[#2a2a2a]">
                <Button
                    type="button"
                    onClick={addDiscountItem}
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Discount
                </Button>
            </div>
        </div>
    )
}

