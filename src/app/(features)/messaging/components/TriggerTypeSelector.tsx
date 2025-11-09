'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TriggerType } from '../types/message-template'

interface TriggerTypeSelectorProps {
    value: TriggerType
    onChange: (value: TriggerType) => void
    disabled?: boolean
}

const TRIGGER_TYPES = [
    {
        value: 'work_order_complete' as TriggerType,
        label: 'Work Order Complete',
        description: 'Triggered when a work order is marked as completed'
    },
    {
        value: 'manual' as TriggerType,
        label: 'Manual',
        description: 'Manually triggered by user action'
    },
    {
        value: 'service_reminder' as TriggerType,
        label: 'Service Reminder',
        description: 'Periodic service reminders (future feature)'
    }
]

export function TriggerTypeSelector({ value, onChange, disabled }: TriggerTypeSelectorProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="trigger-type">Trigger Type</Label>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger id="trigger-type">
                    <SelectValue placeholder="Select when this message should be sent" />
                </SelectTrigger>
                <SelectContent>
                    {TRIGGER_TYPES.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                            <div className="flex flex-col">
                                <span className="font-medium">{trigger.label}</span>
                                <span className="text-xs text-muted-foreground">
                                    {trigger.description}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

