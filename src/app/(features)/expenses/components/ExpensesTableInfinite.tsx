/**
 * Infinite Scroll Expenses Table Component
 * 
 * Following Supabase Studio patterns:
 * - Uses useInfiniteQuery for infinite scroll
 * - Auto-loads when scrolling near bottom
 * - Shows loading state while fetching next page
 */

'use client'

import React, { useMemo, useCallback, UIEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExpensesTable } from './ExpensesTable'
import { Skeleton } from '@/components/ui/skeleton'
import type { ExpenseItem } from '../types/expenses'

interface ExpensesTableInfiniteProps {
    items: ExpenseItem[]
    isLoading: boolean
    isFetchingNextPage: boolean
    hasNextPage: boolean
    error: Error | null
    onExpenseUpdated?: () => void
    onLoadNextPage: () => void
    totalRows?: number
    totalRowsFetched?: number
}

/**
 * Checks if user has scrolled near the bottom of the container
 */
function isAtBottom(event: UIEvent<HTMLElement>, threshold = 100): boolean {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    return scrollHeight - scrollTop - clientHeight < threshold
}

export function ExpensesTableInfinite({
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    onExpenseUpdated,
    onLoadNextPage,
    totalRows,
    totalRowsFetched,
}: ExpensesTableInfiniteProps) {
    // Scroll handler (like Supabase Studio)
    const handleScroll = useCallback((event: UIEvent<HTMLElement>) => {
        if (isAtBottom(event) && hasNextPage && !isFetchingNextPage) {
            onLoadNextPage()
        }
    }, [hasNextPage, isFetchingNextPage, onLoadNextPage])

    return (
        <Card onScroll={handleScroll} className="max-h-[600px] overflow-auto">
            <CardHeader>
                <CardTitle>
                    All Parts & Expenses
                    {totalRows !== undefined && totalRowsFetched !== undefined && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({totalRowsFetched} of {totalRows} items)
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ExpensesTable
                    items={items}
                    isLoading={isLoading}
                    error={error}
                    onExpenseUpdated={onExpenseUpdated}
                />

                {/* Loading indicator for next page (like Supabase Studio) */}
                {isFetchingNextPage && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Skeleton className="h-4 w-4 rounded" />
                        <span>Loading more...</span>
                    </div>
                )}

                {/* Load more button (like Supabase Studio) */}
                {hasNextPage && !isFetchingNextPage && (
                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={onLoadNextPage}
                            className="text-sm text-muted-foreground hover:text-foreground underline"
                        >
                            Load more
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
