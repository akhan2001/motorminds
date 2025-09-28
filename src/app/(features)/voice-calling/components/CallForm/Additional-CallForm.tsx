'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send } from 'lucide-react'
import { PartsRequestPriority } from '@/app/(features)/voice-calling/types'

interface AdditionalCallFormProps {
    priority: PartsRequestPriority
    onPriorityChange: (priority: PartsRequestPriority) => void
    notes: string
    onNotesChange: (notes: string) => void
}

export default function AdditionalCallForm({ 
    priority, 
    onPriorityChange,
    notes,
    onNotesChange
}: AdditionalCallFormProps) {
    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Send className="h-5 w-5 text-purple-400" />
                    Additional Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-white">Priority</Label>
                        <Select value={priority} onValueChange={onPriorityChange}>
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <Label className="text-white">Additional Notes</Label>
                    <Textarea
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder="Additional notes for this parts request..."
                        className="bg-gray-900 border-gray-700 text-white"
                        rows={2}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
