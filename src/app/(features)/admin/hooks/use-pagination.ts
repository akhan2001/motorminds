'use client'

import { useState, useCallback, useMemo } from 'react'

interface UsePaginationProps {
    initialPage?: number
    initialLimit?: number
    totalItems?: number
}

interface UsePaginationReturn {
    page: number
    limit: number
    offset: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    goToPage: (page: number) => void
    nextPage: () => void
    previousPage: () => void
    setLimit: (limit: number) => void
    reset: () => void
}

/**
 * Custom hook for pagination logic
 * Follows engineering standards for reusable logic extraction
 */
export function usePagination({
    initialPage = 1,
    initialLimit = 50,
    totalItems = 0
}: UsePaginationProps = {}): UsePaginationReturn {
    const [page, setPage] = useState(initialPage)
    const [limit, setLimitState] = useState(initialLimit)

    const offset = useMemo(() => (page - 1) * limit, [page, limit])
    const totalPages = useMemo(() => Math.ceil(totalItems / limit), [totalItems, limit])
    const hasNextPage = useMemo(() => page < totalPages, [page, totalPages])
    const hasPreviousPage = useMemo(() => page > 1, [page])

    const goToPage = useCallback((newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage)
        }
    }, [totalPages])

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            setPage(prev => prev + 1)
        }
    }, [hasNextPage])

    const previousPage = useCallback(() => {
        if (hasPreviousPage) {
            setPage(prev => prev - 1)
        }
    }, [hasPreviousPage])

    const setLimit = useCallback((newLimit: number) => {
        setLimitState(newLimit)
        setPage(1) // Reset to first page when changing limit
    }, [])

    const reset = useCallback(() => {
        setPage(initialPage)
        setLimitState(initialLimit)
    }, [initialPage, initialLimit])

    return {
        page,
        limit,
        offset,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        goToPage,
        nextPage,
        previousPage,
        setLimit,
        reset
    }
}
