'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X, Filter } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface CreditsRefundsFiltersSectionProps {
    searchInput: string
    onSearchChange: (value: string) => void
    onSearchClear: () => void
    isSearching: boolean
    selectedSupplierId: string
    onSupplierChange: (value: string) => void
    startDate: string
    onStartDateChange: (value: string) => void
    endDate: string
    onEndDateChange: (value: string) => void
    status: 'pending' | 'processed' | 'reconciled' | 'all'
    onStatusChange: (value: 'pending' | 'processed' | 'reconciled' | 'all') => void
    activeSuppliers: { id: string; name: string }[]
    hasActiveFilters: boolean
    onClearAllFilters: () => void
    filteredCount?: number
}

export function CreditsRefundsFiltersSection({
    searchInput,
    onSearchChange,
    onSearchClear,
    isSearching,
    selectedSupplierId,
    onSupplierChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    status,
    onStatusChange,
    activeSuppliers,
    hasActiveFilters,
    onClearAllFilters,
    filteredCount,
}: CreditsRefundsFiltersSectionProps) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Search & Filters
                    </CardTitle>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAllFilters}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear all
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                        <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                            Search
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Search by reason, supplier, or notes..."
                                value={searchInput}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9"
                            />
                            {searchInput && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={onSearchClear}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        {isSearching && (
                            <p className="text-xs text-muted-foreground mt-1">Searching...</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="supplier" className="text-sm font-medium mb-2 block">
                            Supplier
                        </Label>
                        <Select value={selectedSupplierId} onValueChange={onSupplierChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="All suppliers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Suppliers</SelectItem>
                                {activeSuppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
                            From Date
                        </Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => onStartDateChange(e.target.value)}
                            max={endDate || undefined}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
                            To Date
                        </Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => onEndDateChange(e.target.value)}
                            min={startDate || undefined}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                    <div className="w-48">
                        <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                            Status
                        </Label>
                        <Select
                            value={status}
                            onValueChange={(v) =>
                                onStatusChange(v as 'pending' | 'processed' | 'reconciled' | 'all')
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processed">Processed</SelectItem>
                                <SelectItem value="reconciled">Reconciled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground self-end pb-2">
                            <span>Showing filtered results</span>
                            {filteredCount !== undefined && (
                                <span className="font-medium text-foreground">
                                    ({filteredCount} items found)
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
