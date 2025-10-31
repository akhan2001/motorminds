'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Archive
} from 'lucide-react'
import { useAuth } from '../../../../operations/hooks/use-auth'
import { useArchivedInvoices, useArchivedInvoiceCount } from '../../../hooks/use-archived-invoices'
import { ArchivedInvoiceCard } from './ArchivedInvoiceCard'

interface ArchivedInvoicesTableProps {
    // No props needed
}

const ITEMS_PER_PAGE = 50

export function ArchivedInvoicesTable({}: ArchivedInvoicesTableProps) {
    const { shopId } = useAuth()
    const [currentPage, setCurrentPage] = useState(1)
    
    const { data: invoices, isLoading, error } = useArchivedInvoices({
        shopId: shopId || '',
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        filters: {}
    })

    const { data: totalCount = 0 } = useArchivedInvoiceCount(shopId || '', {})

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (isLoading) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Archived Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-32 w-full bg-[#2a2a2a]" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Error Loading Archived Invoices</h3>
                    <p className="text-red-400">
                        {error instanceof Error ? error.message : 'Failed to load archived invoices'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Archived Invoices
                        {totalCount > 0 && (
                            <Badge variant="secondary" className="bg-[#2a2a2a] text-gray-300 ml-2">
                                {totalCount.toLocaleString()} invoices
                            </Badge>
                        )}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {/* Results */}
                {!invoices || invoices.length === 0 ? (
                    <div className="p-8 text-center">
                        <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No archived invoices</h3>
                        <p className="text-gray-400">Archived invoices will appear here</p>
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
                                    onClick={() => {
                                        // Could open a modal or navigate to detail view
                                        console.log('Invoice clicked:', invoice.invoice_number)
                                    }}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
                                <div className="text-sm text-gray-400">
                                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount.toLocaleString()} invoices
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50"
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
                                                            : "bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
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
                                        className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50"
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
        </Card>
    )
}

