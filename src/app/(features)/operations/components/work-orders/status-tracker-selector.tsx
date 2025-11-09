'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useStatusTrackerPresets } from '../../hooks/use-status-trackers'
import { useAuth } from '../../hooks/use-auth'
import type { StatusTracker } from '../../types/status-tracker'
import { Loader2 } from 'lucide-react'

interface StatusTrackerSelectorProps {
    value: StatusTracker | null | undefined
    onChange: (tracker: StatusTracker | null) => void
    disabled?: boolean
    className?: string
}

export const StatusTrackerSelector: React.FC<StatusTrackerSelectorProps> = ({
    value,
    onChange,
    disabled = false,
    className = ""
}) => {
    const { shopId } = useAuth()
    const { data: presets = [], isLoading } = useStatusTrackerPresets(shopId || '')

    // Sort presets by display_order
    const sortedPresets = [...presets].sort((a, b) => {
        const orderA = a.display_order ?? 0
        const orderB = b.display_order ?? 0
        return orderA - orderB
    })

    // Find the selected preset by matching name and color
    const selectedPresetId = value
        ? sortedPresets.find(p => p.name === value.name && p.color === value.color)?.id
        : undefined

    const handleValueChange = (presetId: string) => {
        if (presetId === 'none') {
            onChange(null)
        } else {
            const preset = sortedPresets.find(p => p.id === presetId)
            if (preset) {
                // Convert preset to StatusTracker format (without id and display_order)
                onChange({
                    name: preset.name,
                    color: preset.color,
                })
            }
        }
    }

    if (isLoading) {
        return (
            <div className={`space-y-1.5 ${className}`}>
                <Label className="text-muted-foreground dark:text-gray-400">Status Tracker</Label>
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md border-border dark:border-[#2a2a2a] bg-background dark:bg-[#1a1a1a]">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading trackers...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`space-y-1.5 ${className}`}>
            <Label className="text-muted-foreground dark:text-gray-400">Status Tracker</Label>
            <Select
                value={selectedPresetId || 'none'}
                onValueChange={handleValueChange}
                disabled={disabled}
            >
                <SelectTrigger className="bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border-border dark:border-[#2a2a2a] focus:ring-gray-500">
                    <SelectValue placeholder="Select a status tracker">
                        {value ? (
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded border border-border dark:border-[#2a2a2a] flex-shrink-0"
                                    style={{ backgroundColor: value.color }}
                                />
                                <span>{value.name}</span>
                            </div>
                        ) : (
                            'None'
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                    <SelectItem
                        value="none"
                        className="text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#2a2a2a] focus:bg-accent dark:focus:bg-[#2a2a2a]"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-border dark:border-[#2a2a2a] bg-transparent" />
                            <span>None</span>
                        </div>
                    </SelectItem>
                    {sortedPresets.map((preset) => (
                        <SelectItem
                            key={preset.id}
                            value={preset.id}
                            className="text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#2a2a2a] focus:bg-accent dark:focus:bg-[#2a2a2a]"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded border border-border dark:border-[#2a2a2a] flex-shrink-0"
                                    style={{ backgroundColor: preset.color }}
                                />
                                <span>{preset.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

export default StatusTrackerSelector

