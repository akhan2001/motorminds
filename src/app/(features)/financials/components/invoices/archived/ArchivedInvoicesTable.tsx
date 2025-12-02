'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { 
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Archive,
    Search,
    X
} from 'lucide-react'
import { useAuth } from '../../../../operations/hooks/use-auth'
import { useArchivedInvoices, useArchivedInvoiceCount } from '../../../hooks/use-archived-invoices'
import { ArchivedInvoiceCard } from './ArchivedInvoiceCard'
import { InvoiceDetailSheet } from '../InvoiceDetailSheet'
import { useInvoiceDetailSheet } from '../../../hooks/use-invoice-detail-sheet'

interface ArchivedInvoicesTableProps {
    // No props needed
}

const ITEMS_PER_PAGE = 50

export function ArchivedInvoicesTable({}: ArchivedInvoicesTableProps) {
    const { shopId } = useAuth()
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [localSearchValue, setLocalSearchValue] = useState('')
    const { selectedInvoice, isSheetOpen, openInvoiceDetail, closeInvoiceDetail } = useInvoiceDetailSheet()
    
    // Memoize filters to prevent unnecessary re-renders
    const filters = useMemo(() => ({
        search: searchTerm || undefined
    }), [searchTerm])

    // Debounced search update - prevents excessive API calls
    const debouncedUpdateSearch = useDebouncedCallback((term: string) => {
        setSearchTerm(term)
        // Reset to page 1 when searching
        setCurrentPage(1)
    }, 500)
    
    const { data: invoices, isLoading, error } = useArchivedInvoices({
        shopId: shopId || '',
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        filters
    })

    const { data: totalCount = 0 } = useArchivedInvoiceCount(shopId || '', filters)

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    const handlePageChange = useCallback((newPage: number) => {
        setCurrentPage(newPage)
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const handleSearchChange = useCallback((value: string) => {
        setLocalSearchValue(value)
        debouncedUpdateSearch(value)
    }, [debouncedUpdateSearch])

    const handleClearSearch = useCallback(() => {
        setLocalSearchValue('')
        setSearchTerm('')
        setCurrentPage(1)
    }, [])

    if (isLoading) {
        return (
            <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-foreground dark:text-white flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Archived Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-32 w-full bg-secondary dark:bg-[#2a2a2a]" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">Error Loading Archived Invoices</h3>
                    <p className="text-red-500 dark:text-red-400">
                        {error instanceof Error ? error.message : 'Failed to load archived invoices'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground dark:text-white flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Archived Invoices
                        {totalCount > 0 && (
                            <Badge variant="secondary" className="bg-secondary dark:bg-[#2a2a2a] text-muted-foreground dark:text-gray-300 ml-2">
                                {totalCount.toLocaleString()} invoices
                            </Badge>
                        )}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {/* Search */}
                <div className="mb-6">
                    <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
                            <Input
                                placeholder="Search invoices by number, title..."
                                value={localSearchValue}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10 pr-10 bg-background dark:bg-[#131313] border-border dark:border-[#3a3a3a] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 focus:border-red-500"
                            />
                            {localSearchValue && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearSearch}
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-accent dark:hover:bg-gray-700"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results */}
                {!invoices || invoices.length === 0 ? (
                    <div className="p-8 text-center">
                        <Archive className="h-12 w-12 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
                            {searchTerm ? 'No archived invoices found' : 'No archived invoices'}
                        </h3>
                        <p className="text-muted-foreground dark:text-gray-400">
                            {searchTerm
                                ? 'Try adjusting your search terms'
                                : 'Archived invoices will appear here'
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Invoice Cards */}
                        <div className="space-y-3">
                            {invoices.map((invoice) => (
                                <ArchivedInvoiceCard
                                    key={invoice.id}
                                    invoice={invoice}
                                    isSelected={false}
                                    onClick={() => openInvoiceDetail(invoice)}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border dark:border-gray-800">
                                <div className="text-sm text-muted-foreground dark:text-gray-400">
                                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount.toLocaleString()} invoices
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    
                                    <div className="flex items-center gap-1">
                                        {/* Page Numbers */}
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum: number
                                            if (totalPages <= 5) {
                                                pageNum = i + 1
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i
                                            } else {
                                                pageNum = currentPage - 2 + i
                                            }
                                            
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={
                                                        currentPage === pageNum
                                                            ? "bg-red-600 hover:bg-red-700 text-white"
                                                            : "bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white"
                                                    }
                                                >
                                                    {pageNum}
                                                </Button>
                                            )
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white disabled:opacity-50"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {/* Invoice Detail Sheet */}
            <InvoiceDetailSheet
                invoice={selectedInvoice}
                isOpen={isSheetOpen}
                onClose={closeInvoiceDetail}
            />
        </Card>
    )
}

