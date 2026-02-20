/**
 * Credits & Refunds Page
 * Tracks money flowing back into the business (supplier credits, refunds)
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'
import {
    CreditsRefundsPageHeader,
    CreditsRefundsFiltersSection,
    CreditsRefundsStatsCards,
    CreditsRefundsTable,
} from './components'
import { useCreditsRefundsFilters } from './hooks/use-credits-refunds-filters'
import { useCreditsRefundsQuery } from './data/credits-refunds-query'

export default function CreditsRefundsPage() {
    const { shopId } = useAuth()
    const filtersHook = useCreditsRefundsFilters()

    const { data, isLoading, error, refetch } = useCreditsRefundsQuery(shopId, {
        filters: filtersHook.filters,
    })

    return (
        <div className="container mx-auto p-6 space-y-6">
            <CreditsRefundsPageHeader
                shopId={shopId}
                onCreditRefundAdded={refetch}
            />

            <CreditsRefundsFiltersSection
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
                status={filtersHook.status}
                onStatusChange={filtersHook.setStatus}
                activeSuppliers={filtersHook.activeSuppliers.map((s) => ({
                    id: s.id,
                    name: s.name,
                }))}
                hasActiveFilters={filtersHook.hasActiveFilters}
                onClearAllFilters={filtersHook.clearAllFilters}
                filteredCount={data?.total}
            />

            <CreditsRefundsStatsCards
                isLoading={isLoading}
                stats={data?.stats}
                totalCount={data?.total}
            />

            <Card>
                <CardHeader>
                    <CardTitle>
                        All Credits & Refunds
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            {filtersHook.hasActiveFilters
                                ? `(${data?.total || 0} filtered results)`
                                : 'Vendor credits and refunds'}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CreditsRefundsTable
                        items={data?.creditsRefunds || []}
                        isLoading={isLoading}
                        error={error as Error | null}
                        onCreditRefundUpdated={refetch}
                        shopId={shopId || ''}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
