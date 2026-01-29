/**
 * Expenses Page with Infinite Scroll - Following Supabase Studio patterns
 * 
 * Alternative implementation using infinite scroll instead of page-based pagination.
 * 
 * Uses:
 * - Centralized query keys (expenseKeys)
 * - Infinite scroll pagination (useExpensesInfiniteQuery)
 * - URL state management ready (useExpensesFiltersURL - install nuqs to enable)
 * - Component separation
 */

'use client'

import React, { useMemo } from 'react'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'
import {
    ExpensesPageHeader,
    ExpensesFiltersSection,
    ExpensesStatsCards,
    ExpensesTableInfinite,
} from './components'
import { useExpensesFilters } from './hooks/use-expenses-filters'
// Using new data layer following Supabase patterns
import { useExpensesInfiniteQuery } from './data/expenses-infinite-query'

export default function ExpensesPageInfinite() {
    const { shopId } = useAuth()
    const includeGeneralExpenses = true // Always include general expenses

    const filtersHook = useExpensesFilters()

    // Using infinite query hook following Supabase patterns
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch,
    } = useExpensesInfiniteQuery(shopId, {
        limit: 50,
        includeGeneralExpenses,
        filters: filtersHook.filters,
        keepPreviousData: true, // Smooth transitions
    })

    // Flatten pages (like Supabase Studio)
    const expenses = useMemo(() => 
        data?.pages.flatMap(page => page.expenses) || [],
        [data?.pages]
    )

    // Calculate totals across all pages
    const totalRows = data?.pages[0]?.total ?? 0
    const totalRowsFetched = expenses.length

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
                activeSuppliers={filtersHook.activeSuppliers}
                hasActiveFilters={filtersHook.hasActiveFilters}
                onClearAllFilters={filtersHook.clearAllFilters}
                filteredCount={totalRows}
            />

            {/* Stats Cards */}
            <ExpensesStatsCards
                isLoading={isLoading}
                stats={data?.pages[0]?.stats}
                totalCount={totalRows}
                currentPageCount={totalRowsFetched}
            />

            {/* Infinite Scroll Table */}
            <ExpensesTableInfinite
                items={expenses}
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage ?? false}
                error={error as Error | null}
                onExpenseUpdated={refetch}
                onLoadNextPage={() => fetchNextPage()}
                totalRows={totalRows}
                totalRowsFetched={totalRowsFetched}
            />
        </div>
    )
}
