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
        <Card className="bg-card dark:bg-[#111111] border-border dark:border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-foreground dark:text-white flex items-center gap-2">
                    <Send className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Additional Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-foreground dark:text-white">Priority</Label>
                        <Select value={priority} onValueChange={onPriorityChange}>
                            <SelectTrigger className="bg-background dark:bg-gray-900 border-border dark:border-gray-700 text-foreground dark:text-white">
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                                <SelectItem value="low" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Low</SelectItem>
                                <SelectItem value="normal" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Normal</SelectItem>
                                <SelectItem value="high" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">High</SelectItem>
                                <SelectItem value="urgent" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <Label className="text-foreground dark:text-white">Additional Notes</Label>
                    <Textarea
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder="Additional notes for this parts request..."
                        className="bg-background dark:bg-gray-900 border-border dark:border-gray-700 text-foreground dark:text-white"
                        rows={2}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
