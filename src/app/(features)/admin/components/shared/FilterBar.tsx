'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface FilterOption {
    value: string
    label: string
}

interface FilterBarProps {
    filters: {
        [key: string]: {
            label: string
            value: string
            options: FilterOption[]
            onChange: (value: string) => void
        }
    }
    onClear?: () => void
}

export function FilterBar({ filters, onClear }: FilterBarProps) {
    const hasActiveFilters = Object.values(filters).some(filter => filter.value !== 'all' && filter.value !== '')

    return (
        <div className="flex flex-wrap gap-3 items-end">
            {Object.entries(filters).map(([key, filter]) => (
                <div key={key} className="min-w-[150px]">
                    <label className="text-sm font-medium text-foreground mb-1 block">
                        {filter.label}
                    </label>
                    <Select value={filter.value} onValueChange={filter.onChange}>
                        <SelectTrigger>
                            <SelectValue placeholder={`Select ${filter.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {filter.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ))}
            {hasActiveFilters && onClear && (
                <Button
                    onClick={onClear}
                    variant="outline"
                    size="sm"
                    className="mb-0"
                >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                </Button>
            )}
        </div>
    )
}

