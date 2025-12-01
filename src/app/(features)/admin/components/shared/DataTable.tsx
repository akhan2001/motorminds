'use client'

import React, { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column<T> {
    key: keyof T | string
    label: string
    render?: (item: T, index: number) => React.ReactNode
    sortable?: boolean
    className?: string
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    loading?: boolean
    error?: string | null
    emptyMessage?: string
    className?: string
    // Pagination
    currentPage?: number
    totalPages?: number
    onPageChange?: (page: number) => void
    // Actions
    onRowClick?: (item: T, index: number) => void
    renderActions?: (item: T, index: number) => React.ReactNode
}

/**
 * Reusable data table component with pagination
 * Follows engineering standards for component reusability
 */
function DataTableComponent<T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    error = null,
    emptyMessage = "No data available",
    className,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    onRowClick,
    renderActions
}: DataTableProps<T>) {
    const renderCell = useMemo(() => (item: T, column: Column<T>, index: number) => {
        if (column.render) {
            return column.render(item, index)
        }
        
        const value = column.key === 'index' ? index + 1 : item[column.key as keyof T]
        return value?.toString() || '-'
    }, [])

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-pulse text-muted-foreground">Loading...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-32">
                        <div className="text-red-500">{error}</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (data.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-32">
                        <div className="text-muted-foreground">{emptyMessage}</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                {columns.map((column, index) => (
                                    <th
                                        key={`${column.key as string}-${index}`}
                                        className={cn(
                                            "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                                            column.className
                                        )}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                                {renderActions && (
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr
                                    key={item.id || index}
                                    className={cn(
                                        "border-b border-border hover:bg-muted/50 transition-colors",
                                        onRowClick && "cursor-pointer"
                                    )}
                                    onClick={() => onRowClick?.(item, index)}
                                >
                                    {columns.map((column, colIndex) => (
                                        <td
                                            key={`${column.key as string}-${colIndex}`}
                                            className={cn(
                                                "px-4 py-3 text-sm text-foreground",
                                                column.className
                                            )}
                                        >
                                            {renderCell(item, column, index)}
                                        </td>
                                    ))}
                                    {renderActions && (
                                        <td className="px-4 py-3 text-right">
                                            {renderActions(item, index)}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && onPageChange && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export const DataTable = memo(DataTableComponent) as <T extends Record<string, any>>(
    props: DataTableProps<T>
) => JSX.Element
