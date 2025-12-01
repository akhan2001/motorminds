'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for debounced search functionality
 * Follows engineering standards for performance optimization
 */
export function useDebouncedSearch(initialValue = '', delay = 300) {
    const [searchTerm, setSearchTerm] = useState(initialValue)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [searchTerm, delay])

    const updateSearchTerm = useCallback((value: string) => {
        setSearchTerm(value)
    }, [])

    const clearSearch = useCallback(() => {
        setSearchTerm('')
        setDebouncedSearchTerm('')
    }, [])

    return {
        searchTerm,
        debouncedSearchTerm,
        updateSearchTerm,
        clearSearch,
        isSearching: searchTerm !== debouncedSearchTerm
    }
}
