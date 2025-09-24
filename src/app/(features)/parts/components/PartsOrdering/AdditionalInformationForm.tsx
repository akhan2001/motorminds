'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText } from 'lucide-react'

interface AdditionalInformationFormProps {
    priority: string
    notes: string
    customerNotes: string
    onPriorityChange: (priority: string) => void
    onNotesChange: (notes: string) => void
    onCustomerNotesChange: (notes: string) => void
    className?: string
}

export default function AdditionalInformationForm({ 
    priority, 
    notes, 
    customerNotes, 
    onPriorityChange, 
    onNotesChange, 
    onCustomerNotesChange,
    className = "" 
}: AdditionalInformationFormProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-white">Additional Information</h3>
            
            <div className="space-y-2">
                <Label htmlFor="priority" className="text-gray-300">
                    Priority
                </Label>
                <Select
                    value={priority}
                    onValueChange={onPriorityChange}
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
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
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
                        value={customerNotes}
                        onChange={(e) => onCustomerNotesChange(e.target.value)}
                        placeholder="Customer-specific requirements or notes..."
                        className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[80px]"
                    />
                </div>
            </div>
        </div>
    )
}
