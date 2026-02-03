/**
 * Expenses Filters Hook with URL State Management
 * 
 * Following Supabase Studio patterns:
 * - Uses nuqs for URL state management (shareable URLs, browser back/forward)
 * - Debounced search for performance
 * - All filters synced to URL query params
 * 
 * Note: Install nuqs with: npm install nuqs
 * Once installed, uncomment the nuqs imports and remove the fallback implementation
 */

'use client'

import { useState, useMemo } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
// TODO: Install nuqs and uncomment:
// import { parseAsString, useQueryState } from 'nuqs'

import type { ExpenseFilters } from '../data/expenses-query'

/**
 * Hook for managing expense filters with URL state
 * 
 * Following Supabase Studio pattern:
 * - Search in URL: ?search=test
 * - Filters in URL: ?startDate=2024-01-01&endDate=2024-12-31&supplierId=abc&itemType=expense
 * - Debounced search (500ms delay)
 */
export function useExpensesFiltersURL() {
    // TODO: Replace with nuqs once installed:
    // const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
    // const [startDate, setStartDate] = useQueryState('startDate', parseAsString)
    // const [endDate, setEndDate] = useQueryState('endDate', parseAsString)
    // const [supplierId, setSupplierId] = useQueryState('supplierId', parseAsString)
    // const [itemType, setItemType] = useQueryState('itemType', parseAsString)
    
    // Temporary fallback using local state (matches current useExpensesFilters pattern)
    const [search, setSearch] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all')
    const [itemType, setItemType] = useState<'part' | 'expense' | 'general_expense' | 'all'>('all')

    // Supplier filter - using dropdown (like current implementation)
    const { suppliers } = useSuppliers()
    const activeSuppliers = suppliers.filter(s => s.status === 'active')
    
    // Get supplier name from ID for API filtering
    const selectedSupplierName = useMemo(() => {
        if (selectedSupplierId === 'all') return undefined
        const supplier = activeSuppliers.find(s => s.id === selectedSupplierId)
        return supplier?.name
    }, [selectedSupplierId, activeSuppliers])

    // Debounce search (like Supabase Studio - 500ms delay)
    const debouncedSearch = useDebounce(search, 500)

    // Build filters object (like Supabase Studio)
    const filters: ExpenseFilters = useMemo(() => ({
        search: debouncedSearch || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        supplier: selectedSupplierName,
        itemType: itemType === 'all' ? undefined : itemType,
    }), [debouncedSearch, startDate, endDate, selectedSupplierName, itemType])

    // Check if any filters are active
    const hasActiveFilters = !!(search || selectedSupplierId !== 'all' || startDate || endDate || itemType !== 'all')

    // Clear all filters
    const clearAllFilters = () => {
        setSearch('')
        setSelectedSupplierId('all')
        setStartDate('')
        setEndDate('')
        setItemType('all')
    }

    return {
        // Search
        searchInput: search,
        setSearchInput: setSearch,
        clearSearch: () => setSearch(''),
        isSearching: false, // Will be true when debouncing with nuqs
        debouncedSearch,
        
        // Supplier
        selectedSupplierId,
        setSelectedSupplierId,
        selectedSupplierName,
        activeSuppliers,
        
        // Dates
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        
        // Item type
        itemType,
        setItemType,
        
        // Filters object (uses debounced search)
        filters,
        hasActiveFilters,
        clearAllFilters,
    }
}
