'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { TriggerType } from '../types/message-template'

interface TriggerTypeSelectorProps {
    value: TriggerType
    onChange: (value: TriggerType) => void
    disabled?: boolean
}

interface TriggerOption {
    value: TriggerType | string
    label: string
    description: string
    available: boolean
}

const TRIGGER_TYPES: TriggerOption[] = [
    {
        value: 'work_order_complete',
        label: 'Work Order Complete',
        description: 'Triggered when a work order is marked as completed',
        available: true
    },
    {
        value: 'invoice_paid',
        label: 'Invoice Paid',
        description: 'Triggered when a customer pays an invoice',
        available: false
    },
    {
        value: 'appointment_scheduled',
        label: 'Appointment Scheduled',
        description: 'Triggered when a customer schedules an appointment',
        available: false
    },
]

export function TriggerTypeSelector({ value, onChange, disabled }: TriggerTypeSelectorProps) {
    const availableTriggers = TRIGGER_TYPES.filter(t => t.available)
    const comingSoonTriggers = TRIGGER_TYPES.filter(t => !t.available)
    const selectedTrigger = TRIGGER_TYPES.find(t => t.value === value)

    return (
        <div className="space-y-2">
            <Label htmlFor="trigger-type">
                Trigger Type <span className="text-destructive">*</span>
            </Label>
            <Select 
                value={value} 
                onValueChange={(val) => onChange(val as TriggerType)} 
                disabled={disabled}
            >
                <SelectTrigger id="trigger-type" className="h-auto min-h-[2.5rem] py-2">
                    <SelectValue placeholder="Select when this message should be sent">
                        {selectedTrigger ? (
                            <div className="flex flex-col items-start text-left">
                                <span className="font-medium leading-tight">{selectedTrigger.label}</span>
                                <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                                    {selectedTrigger.description}
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">Select when this message should be sent</span>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {/* Available triggers */}
                    {availableTriggers.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value} className="py-3">
                            <div className="flex flex-col gap-1">
                                <span className="font-medium leading-tight">{trigger.label}</span>
                                <span className="text-xs text-muted-foreground leading-tight">
                                    {trigger.description}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                    
                    {/* Coming soon section */}
                    {comingSoonTriggers.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                                Coming Soon
                            </div>
                            {comingSoonTriggers.map((trigger) => (
                                <SelectItem 
                                    key={trigger.value} 
                                    value={trigger.value}
                                    disabled
                                    className="opacity-60 cursor-not-allowed"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{trigger.label}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    Coming Soon
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {trigger.description}
                                            </span>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </>
                    )}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
                More trigger types will be available soon. Currently, only "Work Order Complete" is active.
            </p>
        </div>
    )
}

