'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, X, Calendar } from 'lucide-react'
import { EmailHistoryFilters } from '../../hooks/use-email-history'

interface EmailFiltersProps {
    filters: EmailHistoryFilters
    onFiltersChange: (filters: EmailHistoryFilters) => void
}

export function EmailFilters({ filters, onFiltersChange }: EmailFiltersProps) {
    const [searchInput, setSearchInput] = useState(filters.search || '')

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        onFiltersChange({ ...filters, search: searchInput, page: 1 })
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearchSubmit()
        }
    }

    const handleStatusChange = (value: string) => {
        const status = value === 'all' ? '' : value
        onFiltersChange({ ...filters, status, page: 1 })
    }

    const handleDatePreset = (preset: string) => {
        const now = new Date()
        let dateFrom = ''
        let dateTo = ''

        switch (preset) {
            case 'today':
                dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0]
                dateTo = dateFrom
                break
            case 'week':
                dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString().split('T')[0]
                dateTo = now.toISOString().split('T')[0]
                break
            case 'month':
                dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                dateTo = now.toISOString().split('T')[0]
                break
            case 'all':
            default:
                dateFrom = ''
                dateTo = ''
                break
        }

        onFiltersChange({ ...filters, dateFrom, dateTo, page: 1 })
    }

    const clearFilters = () => {
        setSearchInput('')
        onFiltersChange({ page: 1, limit: filters.limit })
    }

    const hasActiveFilters = filters.search || filters.status || filters.dateFrom || filters.dateTo

    // Determine which date preset is active
    const getActiveDatePreset = () => {
        if (!filters.dateFrom && !filters.dateTo) return 'all'
        
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0]
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString().split('T')[0]
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

        if (filters.dateFrom === today && filters.dateTo === today) return 'today'
        if (filters.dateFrom === weekAgo) return 'week'
        if (filters.dateFrom === monthStart) return 'month'
        
        return 'custom'
    }

    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search emails..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-9"
                />
            </div>

            {/* Status Filter */}
            <Select
                value={filters.status || 'all'}
                onValueChange={handleStatusChange}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
            </Select>

            {/* Date Presets */}
            <Select
                value={getActiveDatePreset()}
                onValueChange={handleDatePreset}
            >
                <SelectTrigger className="w-[140px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    )
}
