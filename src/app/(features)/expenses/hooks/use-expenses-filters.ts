/**
 * Expenses Filters Hook
 * 
 * Works with the expenses table structure:
 * - source_type: 'work_order' | 'invoice' | 'general'
 * - vendor (not supplier)
 * - category
 * - No itemType filter (only expenses, no parts)
 */

'use client'

import { useState, useMemo } from 'react'
import { useDebouncedSearch } from '@/app/(features)/admin/hooks/use-debounced-search'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
import type { ExpenseFilters as ExpenseFiltersType } from '../data/expenses-query'

export function useExpensesFilters() {
    // Search with debounce
    const { 
        searchTerm: searchInput, 
        debouncedSearchTerm: debouncedSearch, 
        updateSearchTerm: setSearchInput,
        clearSearch,
        isSearching 
    } = useDebouncedSearch('', 300)

    // Vendor filter - using dropdown (maps to vendor field in expenses table)
    const { suppliers } = useSuppliers()
    const activeSuppliers = suppliers.filter(s => s.status === 'active')
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all')
    
    // Get supplier name from ID for API filtering (maps to vendor)
    const selectedVendorName = useMemo(() => {
        if (selectedSupplierId === 'all') return undefined
        const supplier = activeSuppliers.find(s => s.id === selectedSupplierId)
        return supplier?.name
    }, [selectedSupplierId, activeSuppliers])

    // Date filters (YYYY-MM-DD format for native input)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    
    // Source type filter (work_order, invoice, general)
    const [sourceType, setSourceType] = useState<'work_order' | 'invoice' | 'general' | 'all'>('all')

    // Category filter
    const [category, setCategory] = useState<string>('')

    // Build filters object matching expenses table structure
    const filters: ExpenseFiltersType = useMemo(() => ({
        search: debouncedSearch || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        vendor: selectedVendorName,
        source_type: sourceType === 'all' ? undefined : sourceType,
        category: category || undefined,
    }), [debouncedSearch, selectedVendorName, startDate, endDate, sourceType, category])

    // Check if any filters are active
    const hasActiveFilters = !!(
        searchInput || 
        selectedSupplierId !== 'all' || 
        startDate || 
        endDate || 
        sourceType !== 'all' ||
        category
    )

    // Clear all filters
    const clearAllFilters = () => {
        clearSearch()
        setSelectedSupplierId('all')
        setStartDate('')
        setEndDate('')
        setSourceType('all')
        setCategory('')
    }

    return {
        // Search
        searchInput,
        setSearchInput,
        clearSearch,
        isSearching,
        debouncedSearch,
        
        // Vendor (maps to vendor field in expenses table)
        selectedSupplierId,
        setSelectedSupplierId,
        selectedVendorName,
        activeSuppliers,
        
        // Dates
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        
        // Source type
        sourceType,
        setSourceType,
        
        // Category
        category,
        setCategory,
        
        // Filters object
        filters,
        hasActiveFilters,
        clearAllFilters,
    }
}
