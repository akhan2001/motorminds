'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { 
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useDebouncedSearch } from '../../hooks/use-debounced-search'

interface Customer {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone?: string
    customer_address?: string
    shop_id: string
    created_at: string
    updated_at?: string
    notes?: string
    shops?: {
        shop_name: string
        shop_email?: string
    }
}

interface CustomerTableProps {
    customers: Customer[]
    loading: boolean
    error: string | null
    totalCount: number
    currentPage: number
    itemsPerPage: number
    onCustomerClick: (customer: Customer) => void
    onSearch: (search: string) => void
    onPageChange: (page: number) => void
    showShopName?: boolean
    className?: string
}

export const CustomerTable = React.memo<CustomerTableProps>(({
    customers,
    loading,
    error,
    totalCount,
    currentPage,
    itemsPerPage,
    onCustomerClick,
    onSearch,
    onPageChange,
    showShopName = false,
    className = ""
}) => {
    const [searchQuery, setSearchQuery] = useState("")
    const { debouncedSearchTerm } = useDebouncedSearch(searchQuery, 300)

    // Handle search input change
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
    }, [])

    // Trigger search when debounced term changes
    React.useEffect(() => {
        onSearch(debouncedSearchTerm)
    }, [debouncedSearchTerm, onSearch])

    // Format phone number
    const formatPhoneNumber = useCallback((phone: string | undefined | null) => {
        if (!phone) return "-"
        
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '')
        
        // Format as (XXX) XXX-XXXX if 10 digits
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
        }
        
        // Return original if not 10 digits
        return phone
    }, [])

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / itemsPerPage)
    
    // Generate pagination items
    const generatePaginationItems = useCallback(() => {
        const items = []
        const maxVisiblePages = 5
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            onClick={() => onPageChange(i)}
                            isActive={currentPage === i}
                            className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                )
            }
        } else {
            // Show ellipsis for large page counts
            const showLeftEllipsis = currentPage > 3
            const showRightEllipsis = currentPage < totalPages - 2
            
            // Always show first page
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        onClick={() => onPageChange(1)}
                        isActive={currentPage === 1}
                        className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            )
            
            if (showLeftEllipsis) {
                items.push(<PaginationEllipsis key="left-ellipsis" />)
            }
            
            // Show pages around current page
            const start = Math.max(2, currentPage - 1)
            const end = Math.min(totalPages - 1, currentPage + 1)
            
            for (let i = start; i <= end; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            onClick={() => onPageChange(i)}
                            isActive={currentPage === i}
                            className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                )
            }
            
            if (showRightEllipsis) {
                items.push(<PaginationEllipsis key="right-ellipsis" />)
            }
            
            // Always show last page
            if (totalPages > 1) {
                items.push(
                    <PaginationItem key={totalPages}>
                        <PaginationLink
                            onClick={() => onPageChange(totalPages)}
                            isActive={currentPage === totalPages}
                            className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                        >
                            {totalPages}
                        </PaginationLink>
                    </PaginationItem>
                )
            }
        }
        
        return items
    }, [currentPage, totalPages, onPageChange])

    // Handle row click
    const handleRowClick = useCallback((customer: Customer) => {
        onCustomerClick(customer)
    }, [onCustomerClick])

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search Bar */}
            <div className="relative mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        className="pl-10 bg-background border-border hover:border-border focus:border-border text-foreground w-full"
                        placeholder="Search by name, email, phone, or address..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
                {searchQuery && !loading && (
                    <p className="text-sm text-muted-foreground mt-2">
                        Found {totalCount} {totalCount === 1 ? 'customer' : 'customers'}
                    </p>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Table */}
            <div className="rounded-md border border-border overflow-hidden bg-white dark:bg-card">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-muted/50 border-none">
                            <TableRow className="hover:bg-muted/50 border-b border-border">
                                <TableHead className="text-foreground font-medium">Name</TableHead>
                                <TableHead className="text-foreground font-medium hidden sm:table-cell">Email</TableHead>
                                <TableHead className="text-foreground font-medium hidden md:table-cell">Phone</TableHead>
                                {showShopName && (
                                    <TableHead className="text-foreground font-medium hidden lg:table-cell">Shop</TableHead>
                                )}
                                <TableHead className="text-foreground font-medium hidden xl:table-cell">Address</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={showShopName ? 5 : 4} className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            <span className="text-muted-foreground">Loading customers...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : customers.length > 0 ? (
                                customers.map((customer) => (
                                    <TableRow
                                        className="hover:bg-muted/50 border-b border-border cursor-pointer"
                                        key={customer.id}
                                        onClick={() => handleRowClick(customer)}
                                    >
                                        <TableCell className="text-foreground font-medium">
                                            {customer.customer_name}
                                        </TableCell>
                                        <TableCell className="text-foreground hidden sm:table-cell">
                                            {customer.customer_email || "-"}
                                        </TableCell>
                                        <TableCell className="text-foreground hidden md:table-cell">
                                            {formatPhoneNumber(customer.customer_phone)}
                                        </TableCell>
                                        {showShopName && (
                                            <TableCell className="text-foreground hidden lg:table-cell">
                                                {customer.shops?.shop_name || "-"}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-foreground hidden xl:table-cell">
                                            {customer.customer_address || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={showShopName ? 5 : 4} className="text-center py-8 text-muted-foreground">
                                        {searchQuery ? "No matching customers found" : "No customers found"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {customers.length > 0 && totalPages > 1 && (
                    <div className="py-4 bg-slate-50 dark:bg-muted/30 border-t border-border">
                        <Pagination>
                            <PaginationContent>
                                {/* Desktop pagination */}
                                <div className="hidden sm:flex items-center gap-1">
                                    <PaginationItem>
                                        <PaginationPrevious 
                                            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                                            className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"} border-border`}
                                        />
                                    </PaginationItem>
                                    
                                    {generatePaginationItems()}
                                    
                                    <PaginationItem>
                                        <PaginationNext 
                                            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                                            className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"} border-border`}
                                        />
                                    </PaginationItem>
                                </div>

                                {/* Mobile pagination */}
                                <div className="flex sm:hidden items-center justify-between w-full gap-2">
                                    <button
                                        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-2 rounded border border-border ${
                                            currentPage === 1 
                                                ? "opacity-50 cursor-not-allowed" 
                                                : "text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    <span className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <button
                                        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-2 rounded border border-border ${
                                            currentPage === totalPages 
                                                ? "opacity-50 cursor-not-allowed" 
                                                : "text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>
        </div>
    )
})

CustomerTable.displayName = 'CustomerTable'