'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useStagingCustomerSearch } from '../../hooks/use-staging-invoices'
import { StagingCustomer } from '../../types/staging-invoices'
import { getInitials } from '@/lib/utils/text'
import { formatPhoneNumber } from '@/utils/format-phone'

interface CustomerSearchProps {
    shopId?: string
    placeholder?: string
    className?: string
    selectedCustomer: StagingCustomer | null
    onCustomerSelect: (customer: StagingCustomer) => void
    onClearSelection: () => void
}

export function CustomerSearch({ 
    shopId, 
    placeholder = "Search staging customers...",
    className,
    selectedCustomer,
    onCustomerSelect,
    onClearSelection
}: CustomerSearchProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    // Search customers
    const { data: customers = [], isLoading } = useStagingCustomerSearch(searchQuery, shopId)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleCustomerSelect = (customer: StagingCustomer) => {
        onCustomerSelect(customer)
        setSearchQuery(customer.customer_name || '')
        setOpen(false)
    }

    const handleInputChange = (value: string) => {
        setSearchQuery(value)
        if (value.trim().length === 0) {
            onClearSelection()
        }
    }

    const displayText = selectedCustomer ? selectedCustomer.customer_name : searchQuery

    return (
        <div className={cn("relative", className)} ref={popoverRef}>
            {/* Main Search Input */}
            <div className="relative">
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                    className={cn(
                        "w-full justify-start text-left font-normal h-10 px-3 py-2",
                        "bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg shadow-sm",
                        "hover:bg-[#2a2a2a] hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-200",
                        "transition-all duration-200 text-white",
                        !selectedCustomer && "text-gray-500"
                    )}
                >
                    <Search className="mr-2 h-4 w-4 text-gray-400" />
                    {displayText || placeholder}
                    <ChevronDown className={cn("ml-auto h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
                </Button>

                {/* Customer Dropdown */}
                {open && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {/* Search Input */}
                        <div className="p-3 border-b border-[#3a3a3a]">
                            <Input
                                placeholder="Search customers..."
                                value={searchQuery}
                                onChange={(e) => handleInputChange(e.target.value)}
                                ref={inputRef}
                                className="bg-[#1a1a1a] text-white border-[#3a3a3a] focus:border-red-500"
                                autoFocus
                            />
                        </div>

                        {/* Customer List */}
                        <div className="py-1">
                            {isLoading && (
                                <div className="p-4 text-center text-sm text-gray-400">
                                    Searching...
                                </div>
                            )}
                            {!isLoading && customers.length === 0 && searchQuery.trim() && (
                                <div className="p-4 text-center text-sm text-gray-400">
                                    No customers found.
                                </div>
                            )}
                            {customers.length > 0 && (
                                <div className="space-y-1">
                                    {customers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            onClick={() => handleCustomerSelect(customer)}
                                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#2a2a2a] text-white"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="bg-red-600 text-white text-xs">
                                                    {getInitials(customer.customer_name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-white truncate">
                                                    {customer.customer_name}
                                                </div>
                                                <div className="text-sm text-gray-400 truncate">
                                                    {customer.customer_phone && formatPhoneNumber(customer.customer_phone)}
                                                    {customer.customer_email && ` • ${customer.customer_email}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
