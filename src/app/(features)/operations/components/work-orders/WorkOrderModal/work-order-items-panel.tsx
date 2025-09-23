'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, Package, Wrench, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

export interface WorkOrderItemsPanelProps {
    workOrderId: string
    className?: string
}

interface WorkOrderItem {
    id: string
    type: 'labor' | 'part' | 'service' | 'fee'
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
    partNumber?: string
    category?: string
}

export const WorkOrderItemsPanel: React.FC<WorkOrderItemsPanelProps> = ({
    workOrderId,
    className = ""
}) => {
    const [items, setItems] = useState<WorkOrderItem[]>([])
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [newItem, setNewItem] = useState<Partial<WorkOrderItem>>({
        type: 'labor',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
    })

    // Calculate total for all items
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)

    const handleAddItem = () => {
        if (!newItem.description || !newItem.unitPrice) {
            return
        }

        const item: WorkOrderItem = {
            id: Date.now().toString(),
            type: newItem.type as 'labor' | 'part' | 'service' | 'fee',
            description: newItem.description,
            quantity: newItem.quantity || 1,
            unitPrice: newItem.unitPrice,
            totalPrice: (newItem.quantity || 1) * newItem.unitPrice,
            partNumber: newItem.partNumber,
            category: newItem.category
        }

        setItems(prev => [...prev, item])
        setNewItem({
            type: 'labor',
            description: '',
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0
        })
        setIsAddingItem(false)
    }

    const handleRemoveItem = (itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId))
    }

    const handleNewItemChange = (field: string, value: any) => {
        setNewItem(prev => {
            const updated = { ...prev, [field]: value }
            // Recalculate total price when quantity or unit price changes
            if (field === 'quantity' || field === 'unitPrice') {
                updated.totalPrice = (updated.quantity || 0) * (updated.unitPrice || 0)
            }
            return updated
        })
    }

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'labor':
                return <Wrench className="h-4 w-4" />
            case 'part':
                return <Package className="h-4 w-4" />
            case 'service':
                return <Wrench className="h-4 w-4" />
            case 'fee':
                return <DollarSign className="h-4 w-4" />
            default:
                return <Package className="h-4 w-4" />
        }
    }

    const getItemTypeColor = (type: string) => {
        switch (type) {
            case 'labor':
                return 'bg-blue-500'
            case 'part':
                return 'bg-green-500'
            case 'service':
                return 'bg-purple-500'
            case 'fee':
                return 'bg-orange-500'
            default:
                return 'bg-gray-500'
        }
    }

    return (
        <div className={`w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-[#222222] flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium text-sm">Work Order Items</h3>
                        <p className="text-gray-400 text-xs mt-1">Parts, labor, and services</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingItem(true)}
                        className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                    </Button>
                </div>
            </div>

            {/* Content Area - Scrollable */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-4">
                    {/* Add New Item Form */}
                    {isAddingItem && (
                        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                            <h4 className="text-sm font-medium text-white mb-3">Add New Item</h4>
                            
                            <div className="space-y-3">
                                {/* Item Type */}
                                <div className="space-y-1">
                                    <Label className="text-gray-400 text-xs">Type</Label>
                                    <Select 
                                        value={newItem.type} 
                                        onValueChange={(value) => handleNewItemChange('type', value)}
                                    >
                                        <SelectTrigger className="bg-[#292929] text-white border-[#626262] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                            <SelectItem value="labor">Labor</SelectItem>
                                            <SelectItem value="part">Part</SelectItem>
                                            <SelectItem value="service">Service</SelectItem>
                                            <SelectItem value="fee">Fee</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <Label className="text-gray-400 text-xs">Description</Label>
                                    <Input
                                        value={newItem.description || ''}
                                        onChange={(e) => handleNewItemChange('description', e.target.value)}
                                        placeholder="Item description"
                                        className="bg-[#292929] text-white border-[#626262] text-xs"
                                    />
                                </div>

                                {/* Quantity and Unit Price */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-gray-400 text-xs">Qty</Label>
                                        <Input
                                            type="number"
                                            value={newItem.quantity || 1}
                                            onChange={(e) => handleNewItemChange('quantity', parseFloat(e.target.value) || 1)}
                                            className="bg-[#292929] text-white border-[#626262] text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-gray-400 text-xs">Price</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={newItem.unitPrice || 0}
                                            onChange={(e) => handleNewItemChange('unitPrice', parseFloat(e.target.value) || 0)}
                                            className="bg-[#292929] text-white border-[#626262] text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Part Number (if applicable) */}
                                {newItem.type === 'part' && (
                                    <div className="space-y-1">
                                        <Label className="text-gray-400 text-xs">Part Number</Label>
                                        <Input
                                            value={newItem.partNumber || ''}
                                            onChange={(e) => handleNewItemChange('partNumber', e.target.value)}
                                            placeholder="Part number"
                                            className="bg-[#292929] text-white border-[#626262] text-xs"
                                        />
                                    </div>
                                )}

                                {/* Total Price Display */}
                                <div className="pt-2 border-t border-[#2a2a2a]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-xs">Total:</span>
                                        <span className="text-white font-medium text-sm">
                                            {formatCurrency(newItem.totalPrice || 0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        onClick={handleAddItem}
                                        className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1"
                                    >
                                        Add Item
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsAddingItem(false)}
                                        className="border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] text-xs"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items List */}
                    {items.length > 0 ? (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-2 flex-1">
                                            <div className={`w-2 h-2 rounded-full ${getItemTypeColor(item.type)} mt-1.5 flex-shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getItemIcon(item.type)}
                                                    <Badge 
                                                        variant="secondary" 
                                                        className="text-xs bg-[#2a2a2a] text-gray-400 capitalize"
                                                    >
                                                        {item.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-white text-sm font-medium line-clamp-2">
                                                    {item.description}
                                                </p>
                                                {item.partNumber && (
                                                    <p className="text-gray-400 text-xs mt-1">
                                                        Part: {item.partNumber}
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-gray-400 text-xs">
                                                        {item.quantity} × {formatCurrency(item.unitPrice)}
                                                    </span>
                                                    <span className="text-white font-medium text-sm">
                                                        {formatCurrency(item.totalPrice)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-1 h-auto"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No items added yet</p>
                            <p className="text-gray-600 text-xs mt-1">Add parts, labor, or services</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer - Total */}
            {items.length > 0 && (
                <div className="p-4 border-t border-[#222222] flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Total Items:</span>
                        <span className="text-white font-bold text-lg">
                            {formatCurrency(totalAmount)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-500 text-xs">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

// Default export for easy importing  
export default WorkOrderItemsPanel
