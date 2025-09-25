'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign } from 'lucide-react'

interface OrderDetailsFormProps {
    quantity: number
    estimatedPrice?: number
    urgency: string
    onQuantityChange: (quantity: number) => void
    onEstimatedPriceChange: (price: number | undefined) => void
    onUrgencyChange: (urgency: string) => void
    className?: string
}

export default function OrderDetailsForm({ 
    quantity, 
    estimatedPrice, 
    urgency, 
    onQuantityChange, 
    onEstimatedPriceChange, 
    onUrgencyChange,
    className = "" 
}: OrderDetailsFormProps) {
    return (
        <div className={`space-y-4 ${className}`}>
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
                        value={quantity}
                        onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
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
                            value={estimatedPrice || ''}
                            onChange={(e) => {
                                const value = e.target.value
                                onEstimatedPriceChange(value ? parseFloat(value) : undefined)
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
                        value={urgency}
                        onValueChange={onUrgencyChange}
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
    )
}
