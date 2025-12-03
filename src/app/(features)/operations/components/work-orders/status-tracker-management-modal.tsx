'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Palette, Edit2, X } from 'lucide-react'
import { useStatusTrackerPresets, useAddStatusTrackerPreset, useUpdateStatusTrackerPreset, useDeleteStatusTrackerPreset } from '../../hooks/use-status-trackers'
import { useAuth } from '@/lib/auth/AuthProvider'
import type { StatusTrackerPreset } from '../../types/status-tracker'
import { Loader2 } from 'lucide-react'
import { MAX_STATUS_TRACKERS } from '../../lib/status-tracker-constants'
import { toast } from 'sonner'

interface StatusTrackerManagementModalProps {
    isOpen: boolean
    onClose: () => void
}

// Predefined color options
const COLOR_OPTIONS = [
    '#EF4444', // red
    '#F97316', // orange
    '#F59E0B', // amber
    '#EAB308', // yellow
    '#84CC16', // lime
    '#22C55E', // green
    '#10B981', // emerald
    '#14B8A6', // teal
    '#06B6D4', // cyan
    '#3B82F6', // blue
    '#6366F1', // indigo
    '#8B5CF6', // violet
    '#A855F7', // purple
    '#D946EF', // fuchsia
    '#EC4899', // pink
    '#6B7280', // gray
]

export const StatusTrackerManagementModal: React.FC<StatusTrackerManagementModalProps> = ({
    isOpen,
    onClose
}) => {
    const { shopId } = useAuth()
    const { data: presets = [], isLoading } = useStatusTrackerPresets(shopId || '')
    const createMutation = useAddStatusTrackerPreset()
    const updateMutation = useUpdateStatusTrackerPreset()
    const deleteMutation = useDeleteStatusTrackerPreset()

    const [editingPreset, setEditingPreset] = useState<StatusTrackerPreset | null>(null)
    const [newPresetName, setNewPresetName] = useState('')
    const [newPresetColor, setNewPresetColor] = useState('#3B82F6')
    const [editingName, setEditingName] = useState('')
    const [editingColor, setEditingColor] = useState('')

    const handleCreate = async () => {
        if (!shopId || !newPresetName.trim()) return

        // Check if limit is reached
        if (presets.length >= MAX_STATUS_TRACKERS) {
            toast.error(`Maximum of ${MAX_STATUS_TRACKERS} status trackers allowed. Please delete one before creating a new one.`)
            return
        }

        try {
            await createMutation.mutateAsync({
                shopId,
                data: {
                    name: newPresetName.trim(),
                    color: newPresetColor,
                },
            })
            setNewPresetName('')
            setNewPresetColor('#3B82F6')
        } catch (error) {
            console.error('Failed to create preset:', error)
        }
    }

    const isLimitReached = presets.length >= MAX_STATUS_TRACKERS

    const handleStartEdit = (preset: StatusTrackerPreset) => {
        setEditingPreset(preset)
        setEditingName(preset.name)
        setEditingColor(preset.color)
    }

    const handleCancelEdit = () => {
        setEditingPreset(null)
        setEditingName('')
        setEditingColor('')
    }

    const handleUpdate = async () => {
        if (!shopId || !editingPreset || !editingName.trim()) return

        try {
            await updateMutation.mutateAsync({
                shopId,
                presetId: editingPreset.id,
                updates: {
                    name: editingName.trim(),
                    color: editingColor,
                },
            })
            handleCancelEdit()
        } catch (error) {
            console.error('Failed to update preset:', error)
        }
    }

    const handleDelete = async (presetId: string) => {
        if (!shopId) return
        if (!confirm('Are you sure you want to delete this status tracker preset?')) return

        try {
            await deleteMutation.mutateAsync({ shopId, presetId })
        } catch (error) {
            console.error('Failed to delete preset:', error)
        }
    }

    // Sort presets by display_order
    const sortedPresets = [...presets].sort((a, b) => {
        const orderA = a.display_order ?? 0
        const orderB = b.display_order ?? 0
        return orderA - orderB
    })

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-[#111111] text-foreground dark:text-white border-border dark:border-[#2a2a2a]">
                <DialogHeader>
                    <DialogTitle className="text-foreground dark:text-white">Manage Status Trackers</DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-gray-400">
                        Create upto 5 custom status trackers to color-code work orders (e.g., "Oil Change", "Brake Repair")
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Create New Tracker */}
                        <div className="space-y-4 p-4 border rounded-lg border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground dark:text-white">Create New Tracker</h3>
                                {isLimitReached && (
                                    <span className="text-xs text-muted-foreground dark:text-gray-400">
                                        Limit reached ({MAX_STATUS_TRACKERS}/{MAX_STATUS_TRACKERS})
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Tracker name (e.g., Oil Change)"
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    className="flex-1 bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border-border dark:border-[#2a2a2a]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPresetName.trim()) {
                                            handleCreate()
                                        }
                                    }}
                                />
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={newPresetColor}
                                            onChange={(e) => setNewPresetColor(e.target.value)}
                                            className="w-12 h-10 rounded border border-border dark:border-[#2a2a2a] cursor-pointer"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleCreate}
                                        disabled={!newPresetName.trim() || createMutation.isPending || isLimitReached}
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {createMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            {/* Color Palette */}
                            <div className="flex flex-wrap gap-2">
                                {COLOR_OPTIONS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewPresetColor(color)}
                                        className={`w-8 h-8 rounded border-2 transition-all ${newPresetColor === color
                                                ? 'border-foreground dark:border-white scale-110'
                                                : 'border-border dark:border-[#2a2a2a] hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Existing Trackers */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-foreground dark:text-white">
                                Existing Trackers ({sortedPresets.length})
                            </h3>
                            {sortedPresets.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                                    <Palette className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No status trackers yet. Create one above to get started.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sortedPresets.map((preset) => (
                                        <div
                                            key={preset.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg border-border dark:border-[#2a2a2a] bg-card dark:bg-[#1a1a1a]"
                                        >
                                            {editingPreset?.id === preset.id ? (
                                                <>
                                                    <div
                                                        className="w-12 h-12 rounded border-2 border-border dark:border-[#2a2a2a] flex-shrink-0"
                                                        style={{ backgroundColor: editingColor }}
                                                    />
                                                    <div className="flex-1 flex gap-2">
                                                        <Input
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            className="flex-1 bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border-border dark:border-[#2a2a2a]"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && editingName.trim()) {
                                                                    handleUpdate()
                                                                } else if (e.key === 'Escape') {
                                                                    handleCancelEdit()
                                                                }
                                                            }}
                                                            autoFocus
                                                        />
                                                        <div className="relative">
                                                            <input
                                                                type="color"
                                                                value={editingColor}
                                                                onChange={(e) => setEditingColor(e.target.value)}
                                                                className="w-12 h-10 rounded border border-border dark:border-[#2a2a2a] cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={handleUpdate}
                                                            disabled={!editingName.trim() || updateMutation.isPending}
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-background dark:bg-[#1a1a1a]"
                                                        >
                                                            {updateMutation.isPending ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                'Save'
                                                            )}
                                                        </Button>
                                                        <Button
                                                            onClick={handleCancelEdit}
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-background dark:bg-[#1a1a1a]"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div
                                                        className="w-12 h-12 rounded border-2 border-border dark:border-[#2a2a2a] flex-shrink-0"
                                                        style={{ backgroundColor: preset.color }}
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-foreground dark:text-white">
                                                            {preset.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                            {preset.color}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleStartEdit(preset)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-background dark:bg-[#1a1a1a]"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDelete(preset.id)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-background dark:bg-[#1a1a1a] text-destructive hover:text-destructive"
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            {deleteMutation.isPending ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default StatusTrackerManagementModal

