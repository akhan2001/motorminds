'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useStatusTrackerPresets } from '../../hooks/use-status-trackers'
import { useAuth } from '../../hooks/use-auth'
import type { StatusTracker } from '../../types/status-tracker'
import { Loader2, X, Plus } from 'lucide-react'
import { MAX_WORK_ORDER_STATUS_TRACKERS } from '../../lib/status-tracker-constants'
import { Button } from '@/components/ui/button'

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

    // Normalize value to array (handle both old format single object and new format array)
    const normalizeTrackers = (tracker: any): StatusTracker[] => {
        if (!tracker) return []
        if (Array.isArray(tracker)) return tracker
        // Handle old format: single object
        if (tracker && typeof tracker === 'object' && tracker.name && tracker.color) {
            return [tracker]
        }
        return []
    }
    const selectedTrackers = normalizeTrackers(value)
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

    const [isOpen, setIsOpen] = useState(false)
    const popoverRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
        )
    }

    return (
        <div className={`relative ${className}`} ref={popoverRef}>
            {/* Selected Trackers Display */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {selectedTrackers.map((tracker, index) => (
                    <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-secondary dark:bg-[#2a2a2a] text-secondary-foreground dark:text-gray-300 h-6"
                    >
                        <div
                            className="w-2 h-2 rounded flex-shrink-0"
                            style={{ backgroundColor: tracker.color }}
                        />
                        <span className="truncate max-w-[80px]">{tracker.name}</span>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => handleRemoveTracker(tracker)}
                                className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                aria-label={`Remove ${tracker.name}`}
                            >
                                <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                            </button>
                        )}
                    </Badge>
                ))}
                
                {/* Add/Select Button */}
                {!disabled && !isMaxReached && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsOpen(!isOpen)}
                        className="h-6 px-2 text-xs border-dashed"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                    </Button>
                )}
            </div>

            {/* Dropdown for Presets */}
            {isOpen && !disabled && (
                <div className="absolute top-full left-0 mt-1 z-50 w-48 max-h-60 overflow-y-auto bg-popover dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-md shadow-lg">
                    {sortedPresets.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                            No presets available
                        </div>
                    ) : (
                        <div className="p-1">
                            {sortedPresets.map((preset) => {
                                const isSelected = isPresetSelected(preset.id)
                                const isDisabled = !isSelected && isMaxReached

                                return (
                                    <label
                                        key={preset.id}
                                        className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer transition-colors ${
                                            isDisabled
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-accent dark:hover:bg-[#2a2a2a]'
                                        }`}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => {
                                                handlePresetToggle(preset.id)
                                                if (!isSelected) setIsOpen(false)
                                            }}
                                            disabled={isDisabled}
                                            className="h-3 w-3"
                                        />
                                        <div
                                            className="w-3 h-3 rounded flex-shrink-0"
                                            style={{ backgroundColor: preset.color }}
                                        />
                                        <span className="text-foreground dark:text-white flex-1 truncate">
                                            {preset.name}
                                        </span>
                                    </label>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default StatusTrackerSelector

