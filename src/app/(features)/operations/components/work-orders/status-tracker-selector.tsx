'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useStatusTrackerPresets } from '../../hooks/use-status-trackers'
import { useAuth } from '../../hooks/use-auth'
import type { StatusTracker } from '../../types/status-tracker'
import { Loader2, X } from 'lucide-react'
import { MAX_WORK_ORDER_STATUS_TRACKERS } from '../../lib/status-tracker-constants'

interface StatusTrackerSelectorProps {
    value: StatusTracker[] | null | undefined // Changed to array
    onChange: (trackers: StatusTracker[] | null) => void
    disabled?: boolean
    className?: string
    maxTrackers?: number // Default to MAX_WORK_ORDER_STATUS_TRACKERS
}

export const StatusTrackerSelector: React.FC<StatusTrackerSelectorProps> = ({
    value,
    onChange,
    disabled = false,
    className = "",
    maxTrackers = MAX_WORK_ORDER_STATUS_TRACKERS
}) => {
    const { shopId } = useAuth()
    const { data: presets = [], isLoading } = useStatusTrackerPresets(shopId || '')

    // Normalize value to array
    const selectedTrackers = value || []
    const selectedCount = selectedTrackers.length
    const isMaxReached = selectedCount >= maxTrackers

    // Sort presets by display_order
    const sortedPresets = [...presets].sort((a, b) => {
        const orderA = a.display_order ?? 0
        const orderB = b.display_order ?? 0
        return orderA - orderB
    })

    // Check if a preset is selected (by matching name and color)
    const isPresetSelected = (presetId: string): boolean => {
        const preset = sortedPresets.find(p => p.id === presetId)
        if (!preset) return false
        return selectedTrackers.some(
            tracker => tracker.name === preset.name && tracker.color === preset.color
        )
    }

    // Toggle preset selection
    const handlePresetToggle = (presetId: string) => {
        if (disabled) return

        const preset = sortedPresets.find(p => p.id === presetId)
        if (!preset) return

        const tracker: StatusTracker = {
            name: preset.name,
            color: preset.color,
        }

        const isSelected = isPresetSelected(presetId)

        if (isSelected) {
            // Remove tracker
            const newTrackers = selectedTrackers.filter(
                t => !(t.name === tracker.name && t.color === tracker.color)
            )
            onChange(newTrackers.length > 0 ? newTrackers : null)
        } else {
            // Add tracker (if not at max)
            if (!isMaxReached) {
                const newTrackers = [...selectedTrackers, tracker]
                onChange(newTrackers)
            }
        }
    }

    // Remove a specific tracker
    const handleRemoveTracker = (trackerToRemove: StatusTracker) => {
        if (disabled) return
        const newTrackers = selectedTrackers.filter(
            t => !(t.name === trackerToRemove.name && t.color === trackerToRemove.color)
        )
        onChange(newTrackers.length > 0 ? newTrackers : null)
    }

    // Clear all trackers
    const handleClearAll = () => {
        if (disabled) return
        onChange(null)
    }

    if (isLoading) {
        return (
            <div className={`space-y-1.5 ${className}`}>
                <Label className="text-muted-foreground dark:text-gray-400">Status Trackers</Label>
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md border-border dark:border-[#2a2a2a] bg-background dark:bg-[#1a1a1a]">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading trackers...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center justify-between">
                <Label className="text-muted-foreground dark:text-gray-400">Status Trackers</Label>
                {selectedCount > 0 && (
                    <span className="text-xs text-muted-foreground dark:text-gray-500">
                        {selectedCount}/{maxTrackers} selected
                    </span>
                )}
            </div>

            {/* Selected Trackers as Badges */}
            {selectedTrackers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border rounded-md border-border dark:border-[#2a2a2a] bg-background dark:bg-[#1a1a1a]">
                    {selectedTrackers.map((tracker, index) => (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1.5 px-2 py-1 text-xs bg-secondary dark:bg-[#2a2a2a] text-secondary-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#3a3a3a]"
                        >
                            <div
                                className="w-3 h-3 rounded border border-border dark:border-[#2a2a2a] flex-shrink-0"
                                style={{ backgroundColor: tracker.color }}
                            />
                            <span>{tracker.name}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTracker(tracker)}
                                    className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                    aria-label={`Remove ${tracker.name}`}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </button>
                            )}
                        </Badge>
                    ))}
                    {!disabled && selectedTrackers.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="text-xs text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors px-2"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            )}

            {/* Available Presets as Checkboxes */}
            <div className="space-y-2 p-3 border rounded-md border-border dark:border-[#2a2a2a] bg-background dark:bg-[#1a1a1a]">
                {sortedPresets.length === 0 ? (
                    <p className="text-sm text-muted-foreground dark:text-gray-400 text-center py-2">
                        No status tracker presets available. Create some in Settings.
                    </p>
                ) : (
                    sortedPresets.map((preset) => {
                        const isSelected = isPresetSelected(preset.id)
                        const isDisabled = disabled || (!isSelected && isMaxReached)

                        return (
                            <label
                                key={preset.id}
                                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                    isDisabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-accent dark:hover:bg-[#2a2a2a]'
                                }`}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handlePresetToggle(preset.id)}
                                    disabled={isDisabled}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div
                                    className="w-4 h-4 rounded border border-border dark:border-[#2a2a2a] flex-shrink-0"
                                    style={{ backgroundColor: preset.color }}
                                />
                                <span className="text-sm text-foreground dark:text-white flex-1">
                                    {preset.name}
                                </span>
                            </label>
                        )
                    })
                )}
            </div>

            {/* Max Limit Message */}
            {isMaxReached && (
                <p className="text-xs text-muted-foreground dark:text-gray-500">
                    Maximum of {maxTrackers} trackers reached. Remove one to add another.
                </p>
            )}
        </div>
    )
}

export default StatusTrackerSelector

