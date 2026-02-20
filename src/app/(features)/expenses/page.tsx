/**
 * Expenses Page
 * 
 * Fetches all expenses without pagination.
 * Uses filters to narrow down results.
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { useCreditsRefundsQuery } from '@/app/(features)/credits-refunds/data/credits-refunds-query'
import { formatCurrency } from '@/lib/utils/currency'
import { ArrowRight, DollarSign } from 'lucide-react'

export default function ExpensesPage() {
    const { shopId } = useAuth()
    const filtersHook = useExpensesFilters()
    const { data: categories = [] } = useExpenseCategories(shopId)

    // Fetch all expenses matching filters (no pagination)
    const { data, isLoading, error, refetch } = useExpensesQuery(shopId, {
        filters: filtersHook.filters,
    })

    // Fetch credits/refunds for same date range (money flowing back in)
    const { data: creditsData } = useCreditsRefundsQuery(shopId, {
        filters: {
            startDate: filtersHook.startDate || undefined,
            endDate: filtersHook.endDate || undefined,
        },
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

            {/* Credits & Refunds Summary Card */}
            {creditsData && creditsData.stats && creditsData.stats.totalAmount > 0 && (
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                Credits & Refunds This Period
                            </CardTitle>
                            <Link href="/credits-refunds">
                                <Button variant="outline" size="sm" className="border-green-500/30">
                                    View All
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(creditsData.stats.totalAmount)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {creditsData.stats.count} credit(s)/refund(s) — reduces net expenses
                        </p>
                    </CardContent>
                </Card>
            )}

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
