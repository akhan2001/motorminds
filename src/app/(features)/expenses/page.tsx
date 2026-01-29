/**
 * Expenses Page
 * 
 * Fetches all expenses without pagination.
 * Uses filters to narrow down results.
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'
import {
    ExpensesPageHeader,
    ExpensesFiltersSection,
    ExpensesStatsCards,
    ExpensesTable,
} from './components'
import { useExpensesFilters } from './hooks/use-expenses-filters'
import { useExpenseCategories } from './hooks/use-expense-categories'
import { useExpensesQuery } from './data/expenses-query'

export default function ExpensesPage() {
    const { shopId } = useAuth()
    const filtersHook = useExpensesFilters()
    const { data: categories = [] } = useExpenseCategories(shopId)

    // Fetch all expenses matching filters (no pagination)
    const { data, isLoading, error, refetch } = useExpensesQuery(shopId, {
        filters: filtersHook.filters,
    })

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <ExpensesPageHeader
                shopId={shopId}
                onExpenseAdded={refetch}
            />

            {/* Search and Filters */}
            <ExpensesFiltersSection
                searchInput={filtersHook.searchInput}
                onSearchChange={filtersHook.setSearchInput}
                onSearchClear={filtersHook.clearSearch}
                isSearching={filtersHook.isSearching}
                selectedSupplierId={filtersHook.selectedSupplierId}
                onSupplierChange={filtersHook.setSelectedSupplierId}
                startDate={filtersHook.startDate}
                onStartDateChange={filtersHook.setStartDate}
                endDate={filtersHook.endDate}
                onEndDateChange={filtersHook.setEndDate}
                sourceType={filtersHook.sourceType}
                onSourceTypeChange={filtersHook.setSourceType}
                category={filtersHook.category}
                onCategoryChange={filtersHook.setCategory}
                categories={categories}
                activeSuppliers={filtersHook.activeSuppliers}
                hasActiveFilters={filtersHook.hasActiveFilters}
                onClearAllFilters={filtersHook.clearAllFilters}
                filteredCount={data?.total}
            />

            {/* Stats Cards */}
            <ExpensesStatsCards
                isLoading={isLoading}
                stats={data?.stats}
                totalCount={data?.total}
                currentPageCount={data?.total}
            />

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        All Expenses
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            {filtersHook.hasActiveFilters 
                                ? `(${data?.total || 0} filtered results)`
                                : '(including general business expenses)'
                            }
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ExpensesTable
                        items={data?.expenses || []}
                        isLoading={isLoading}
                        error={error as Error | null}
                        onExpenseUpdated={refetch}
                        shopId={shopId || ''}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
