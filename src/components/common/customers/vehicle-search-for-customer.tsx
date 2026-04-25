'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Car, User, ChevronDown } from 'lucide-react'
import { useDebouncedVehicleSearch } from '@/hooks/use-vehicle-search'
import { Customer } from '@/app/(features)/customers/types'
import { CustomerVehicle } from '@/app/(features)/customers/types/vehicle'
import { formatPhoneNumber } from '@/utils/format-phone'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/text'
import { cn } from '@/lib/utils'

interface VehicleSearchForCustomerProps {
    shopId: string
    onCustomerSelect: (customer: Customer, vehicle?: CustomerVehicle) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function VehicleSearchForCustomer({
    shopId,
    onCustomerSelect,
    placeholder = "Search by license plate...",
    className,
    disabled = false
}: VehicleSearchForCustomerProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [open, setOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    // Search vehicles with debouncing
    const { data: searchResults, isLoading: isSearching } = useDebouncedVehicleSearch(
        searchQuery,
        shopId
    )

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

    // One row per matching vehicle so the user can pick the exact plate they searched for
    const vehicleMatches = React.useMemo(() => {
        if (!searchResults) return []

        return searchResults
            .filter((row: any) => row.customer_id && row.customers)
            .map((row: any) => {
                const { customers, ...vehicleFields } = row
                return {
                    customer: customers as Customer,
                    vehicle: vehicleFields as CustomerVehicle,
                }
            })
    }, [searchResults])

    const handleInputChange = (value: string) => {
        setSearchQuery(value.toUpperCase())
        if (value.trim().length === 0) {
            setOpen(false)
        } else {
            setOpen(true)
        }
    }

    const handleMatchSelect = (customer: Customer, vehicle: CustomerVehicle) => {
        onCustomerSelect(customer, vehicle)
        setSearchQuery('')
        setOpen(false)
    }

    return (
        <div className={cn("relative", className)} ref={popoverRef}>
            {/* Search Input */}
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
                        !searchQuery && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    {searchQuery || placeholder}
                    <ChevronDown className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
                </Button>

                {/* Customer Dropdown */}
                {open && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-50 dark:bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {/* Search Input */}
                        <div className="p-3 border-b border-border">
                            <Input
                                placeholder="Enter license plate..."
                                value={searchQuery}
                                onChange={(e) => handleInputChange(e.target.value)}
                                ref={inputRef}
                                className="bg-white dark:bg-background text-foreground border-border focus:border-red-600"
                                autoFocus
                            />
                        </div>

                        {/* Customer List */}
                        <div className="py-1">
                            {isSearching && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                    Searching...
                                </div>
                            )}
                            {!isSearching && vehicleMatches.length === 0 && searchQuery.trim() && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No vehicles found with this license plate.
                                </div>
                            )}
                            {vehicleMatches.length > 0 && (
                                <div className="space-y-1">
                                    {vehicleMatches.map(({ customer, vehicle }) => (
                                        <div
                                            key={vehicle.id}
                                            onClick={() => handleMatchSelect(customer, vehicle)}
                                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 text-foreground transition-colors"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="bg-red-600 text-white text-xs">
                                                    {getInitials(customer.customer_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-foreground truncate">
                                                    {customer.customer_name}
                                                </div>
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {customer.customer_phone && formatPhoneNumber(customer.customer_phone)}
                                                    {customer.customer_email && customer.customer_email != 'NULL' ? ` • ${customer.customer_email}` : ''}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Car className="h-3 w-3" />
                                                    <span>
                                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                                        {vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}
                                                    </span>
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

