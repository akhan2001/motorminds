'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { TIME_PERIODS } from '../types/message-template'
import { useState } from 'react'
import { SAMPLE_DATA } from './sample_data'

interface DelaySelectorProps {
    value: number // delay in hours
    onChange: (hours: number) => void
    disabled?: boolean
}

const PRESET_DELAYS = [
    { value: TIME_PERIODS.IMMEDIATE, label: 'Immediately' },
    { value: TIME_PERIODS.ONE_HOUR, label: '1 Hour' },
    { value: TIME_PERIODS.SIX_HOURS, label: '6 Hours' },
    { value: TIME_PERIODS.ONE_DAY, label: '1 Day' },
    { value: TIME_PERIODS.THREE_DAYS, label: '3 Days' },
    { value: TIME_PERIODS.ONE_WEEK, label: '1 Week' },
    { value: TIME_PERIODS.TWO_WEEKS, label: '2 Weeks' },
    { value: TIME_PERIODS.ONE_MONTH, label: '1 Month' },
    { value: TIME_PERIODS.THREE_MONTHS, label: '3 Months' },
    { value: TIME_PERIODS.SIX_MONTHS, label: '6 Months' },
]

export function DelaySelector({ value, onChange, disabled }: DelaySelectorProps) {
    const [useCustom, setUseCustom] = useState(!PRESET_DELAYS.some(p => p.value === value))
    const [customValue, setCustomValue] = useState(value)

    const handlePresetChange = (selectedValue: string) => {
        if (selectedValue === 'custom') {
            setUseCustom(true)
        } else {
            setUseCustom(false)
            onChange(parseInt(selectedValue))
        }
    }

    const handleCustomChange = (hours: number) => {
        setCustomValue(hours)
        onChange(hours)
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="delay">Send Delay</Label>
            <div className="flex gap-2">
                <Select 
                    value={useCustom ? 'custom' : value.toString()} 
                    onValueChange={handlePresetChange}
                    disabled={disabled}
                >
                    <SelectTrigger id="delay" className="flex-1">
                        <SelectValue placeholder="Select delay" />
                    </SelectTrigger>
                    <SelectContent>
                        {PRESET_DELAYS.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value.toString()}>
                                {preset.label}
                            </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                </Select>

                {useCustom && (
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="0"
                            value={customValue}
                            onChange={(e) => handleCustomChange(parseInt(e.target.value) || 0)}
                            className="w-24"
                            disabled={disabled}
                        />
                        <span className="text-sm text-muted-foreground">hours</span>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                Message will be scheduled to send after this delay from the trigger event
            </p>
        </div>
    )
}

