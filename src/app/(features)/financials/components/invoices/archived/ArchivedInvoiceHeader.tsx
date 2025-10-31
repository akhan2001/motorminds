'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Search, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ArchivedInvoiceHeaderProps {
    className?: string
    searchValue?: string
    onSearchChange?: (value: string) => void
}

export const ArchivedInvoiceHeader: React.FC<ArchivedInvoiceHeaderProps> = ({
    className,
    searchValue = '',
    onSearchChange,
}) => {
    return (
        <div className={cn("bg-[#0d0d0d] border-b border-[#2a2a2a] flex-shrink-0", className)}>
            {/* Main Header */}
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left Section - Title */}
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Archive className="h-6 w-6 text-gray-400" />
                                Archived Invoices
                            </h1>
                            <p className="text-sm text-gray-400 mt-1">
                                View and manage archived historical invoices
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-6 pb-3">
                <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search archived invoices by number, customer, or amount..."
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="pl-10 bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-red-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ArchivedInvoiceHeader

