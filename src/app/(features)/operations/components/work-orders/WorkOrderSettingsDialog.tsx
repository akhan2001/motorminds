'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export type CompletedFilter = 'all' | '90days'

interface WorkOrderSettingsDialogProps {
    completedFilter: CompletedFilter
    onCompletedFilterChange: (value: CompletedFilter) => void
    onSettingsChange?: () => void
}

export const WorkOrderSettingsDialog: React.FC<WorkOrderSettingsDialogProps> = ({
    completedFilter,
    onCompletedFilterChange,
    onSettingsChange,
}) => {
    const handleChange = (value: string) => {
        const filter = value as CompletedFilter
        onCompletedFilterChange(filter)
        onSettingsChange?.()
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                    Completed Work Orders
                </h3>
                <p className="text-sm text-muted-foreground">
                    Choose how many completed work orders to display in the Kanban board.
                </p>
                <RadioGroup
                    value={completedFilter}
                    onValueChange={handleChange}
                    className="space-y-3"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="filter-all" />
                        <Label htmlFor="filter-all" className="cursor-pointer font-normal">
                            Show all completed work orders
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="90days" id="filter-90days" />
                        <Label htmlFor="filter-90days" className="cursor-pointer font-normal">
                            Show past 90 days only
                        </Label>
                    </div>
                </RadioGroup>
            </div>
        </div>
    )
}
