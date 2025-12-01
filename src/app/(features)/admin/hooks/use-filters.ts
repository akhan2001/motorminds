'use client'

import { useState, useCallback, useMemo } from 'react'

interface FilterOption {
    value: string
    label: string
}

interface FilterConfig {
    [key: string]: {
        value: string
        options: FilterOption[]
    }
}

interface UseFiltersProps {
    initialFilters: FilterConfig
}

/**
 * Custom hook for managing multiple filters
 * Follows engineering standards for reusable state management
 */
export function useFilters({ initialFilters }: UseFiltersProps) {
    const [filters, setFilters] = useState<FilterConfig>(initialFilters)

    const updateFilter = useCallback((filterKey: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [filterKey]: {
                ...prev[filterKey],
                value
            }
        }))
    }, [])

    const resetFilter = useCallback((filterKey: string) => {
        setFilters(prev => ({
            ...prev,
            [filterKey]: {
                ...prev[filterKey],
                value: prev[filterKey].options[0]?.value || ''
            }
        }))
    }, [])

    const resetAllFilters = useCallback(() => {
        setFilters(prev => {
            const reset = { ...prev }
            Object.keys(reset).forEach(key => {
                reset[key] = {
                    ...reset[key],
                    value: reset[key].options[0]?.value || ''
                }
            })
            return reset
        })
    }, [])

    const activeFilters = useMemo(() => {
        return Object.entries(filters).reduce((acc, [key, filter]) => {
            if (filter.value && filter.value !== 'all' && filter.value !== '') {
                acc[key] = filter.value
            }
            return acc
        }, {} as Record<string, string>)
    }, [filters])

    const hasActiveFilters = useMemo(() => {
        return Object.keys(activeFilters).length > 0
    }, [activeFilters])

    return {
        filters,
        activeFilters,
        hasActiveFilters,
        updateFilter,
        resetFilter,
        resetAllFilters
    }
}
