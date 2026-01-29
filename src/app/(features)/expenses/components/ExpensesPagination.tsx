'use client'

import React from 'react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'

interface ExpensesPaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function ExpensesPagination({
    currentPage,
    totalPages,
    onPageChange,
}: ExpensesPaginationProps) {
    if (totalPages <= 1) {
        return null
    }

    return (
        <div className="mt-4 flex justify-center">
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                    </PaginationItem>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        // Show pages around current page
                        let page: number
                        if (totalPages <= 5) {
                            page = i + 1
                        } else if (currentPage <= 3) {
                            page = i + 1
                        } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i
                        } else {
                            page = currentPage - 2 + i
                        }
                        return (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    onClick={() => onPageChange(page)}
                                    isActive={page === currentPage}
                                    className="cursor-pointer"
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        )
                    })}
                    <PaginationItem>
                        <PaginationNext
                            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}
