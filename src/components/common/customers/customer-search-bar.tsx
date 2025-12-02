'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCustomerSearch } from '@/hooks/use-customer-search'
import { Customer } from '@/app/(features)/customers/types'
import { getInitials } from '@/lib/utils/text'
import { formatPhoneNumber } from '@/utils/format-phone'
import { Plus } from 'lucide-react'

interface CustomerSearchBarProps {
    onSelect: (customer: Customer) => void
    onCreateNew?: () => void
    showCreateOption?: boolean
    placeholder?: string
    className?: string
    disabled?: boolean
    organizationWide?: boolean
    showShopNames?: boolean
}

export function CustomerSearchBar({
    onSelect,
    onCreateNew,
    showCreateOption = true,
    placeholder = "Search customers by name, phone, or email...",
    className,
    disabled = false,
    organizationWide = false,
    showShopNames = false
}: CustomerSearchBarProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    // Search customers
    const { customers, isLoading: customersLoading, isOrganizationSearch } = useCustomerSearch({
        searchQuery,
        enabled: open && searchQuery.trim().length > 0,
        organizationWide
    })

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

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer)
        setSearchQuery(customer.customer_name)
        setOpen(false)
        onSelect(customer)
    }

    const handleInputChange = (value: string) => {
        setSearchQuery(value)
        if (value.trim().length === 0) {
            setSelectedCustomer(null)
        }
    }

    const handleCreateNew = () => {
        setOpen(false)
        setSearchQuery('')
        setSelectedCustomer(null)
        onCreateNew?.()
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
                        "bg-white dark:bg-background border border-border rounded-lg shadow-sm",
                        "hover:bg-muted/50 hover:border-red-600 dark:hover:border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800",
                        "transition-all duration-200 text-foreground",
                        !selectedCustomer && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    {displayText || placeholder}
                    <ChevronDown className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
                </Button>

                {/* Customer Dropdown */}
                {open && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-50 dark:bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {/* Search Input */}
                        <div className="p-3 border-b border-border">
                            <Input
                                placeholder="Search customers by name, phone, or email..."
                                value={searchQuery}
                                onChange={(e) => handleInputChange(e.target.value)}
                                ref={inputRef}
                                className="bg-white dark:bg-background text-foreground border-border focus:border-red-600"
                                autoFocus
                            />
                        </div>

                        {/* Customer List */}
                        <div className="py-1">
                            {customersLoading && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Searching...
                                </div>
                            )}
                            {!customersLoading && customers.length === 0 && searchQuery.trim() && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No customers found.
                                </div>
                            )}
                            {customers.length > 0 && (
                                <div className="space-y-1">
                                    {customers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            onClick={() => handleCustomerSelect(customer)}
                                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 text-foreground transition-colors"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="bg-red-600 text-white text-xs">
                                                    {getInitials(customer.customer_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium text-foreground truncate">
                                                        {customer.customer_name}
                                                    </div>
                                                    {isOrganizationSearch && !customer.isFromCurrentShop && showShopNames && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                            {customer.shopName || 'Other Shop'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {customer.customer_phone && formatPhoneNumber(customer.customer_phone)}
                                                    {customer.customer_email && customer.customer_email != 'NULL' ? ` • ${customer.customer_email}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Customer Option */}
                            {showCreateOption && onCreateNew && (
                                <>
                                    {customers.length > 0 && (
                                        <div className="border-t border-border my-1" />
                                    )}
                                    <div
                                        onClick={handleCreateNew}
                                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-600/10 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-green-50 dark:bg-green-600/20 flex items-center justify-center">
                                            <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-foreground">Add New Customer</div>
                                            <div className="text-xs text-muted-foreground">Create a new customer</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
