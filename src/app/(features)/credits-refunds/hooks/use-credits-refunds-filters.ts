/**
 * Credits & Refunds Filters Hook
 */

'use client'

import { useState, useMemo } from 'react'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
import { useDebouncedSearch } from '@/app/(features)/admin/hooks/use-debounced-search'
import type { CreditsRefundsFilters } from '../data/credits-refunds-query'

export function useCreditsRefundsFilters() {
    const {
        searchTerm: searchInput,
        debouncedSearchTerm: debouncedSearch,
        updateSearchTerm: setSearchInput,
        clearSearch,
        isSearching,
    } = useDebouncedSearch('', 300)

    const { suppliers } = useSuppliers()
    const activeSuppliers = suppliers.filter((s) => s.status === 'active')
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all')

    const selectedSupplierName = useMemo(() => {
        if (selectedSupplierId === 'all') return undefined
        const supplier = activeSuppliers.find((s) => s.id === selectedSupplierId)
        return supplier?.name
    }, [selectedSupplierId, activeSuppliers])

    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [status, setStatus] = useState<'pending' | 'processed' | 'reconciled' | 'all'>('all')

    const filters: CreditsRefundsFilters = useMemo(
        () => ({
            search: debouncedSearch || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            supplier: selectedSupplierName,
            status: status === 'all' ? undefined : status,
        }),
        [debouncedSearch, selectedSupplierName, startDate, endDate, status]
    )

    const hasActiveFilters = !!(
        searchInput ||
        selectedSupplierId !== 'all' ||
        startDate ||
        endDate ||
        status !== 'all'
    )

    const clearAllFilters = () => {
        clearSearch()
        setSelectedSupplierId('all')
        setStartDate('')
        setEndDate('')
        setStatus('all')
    }

    return {
        searchInput,
        setSearchInput,
        clearSearch,
        isSearching,
        debouncedSearch,
        selectedSupplierId,
        setSelectedSupplierId,
        selectedSupplierName,
        activeSuppliers,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        status,
        setStatus,
        filters,
        hasActiveFilters,
        clearAllFilters,
    }
}
