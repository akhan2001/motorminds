'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, User, Car, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useCustomerSearch, useCustomerVehicles } from '@/hooks/use-customer-search'
import { Customer, CustomerVehicle } from '@/app/(features)/customers/types'
import { getInitials, formatPhoneNumber } from '@/lib/utils/text'

interface CustomerSearchBarProps {
    onSelect: (data: CustomerVehicleSelection) => void
    placeholder?: string
    className?: string
    showVehicles?: boolean
    disabled?: boolean
}

interface CustomerVehicleSelection {
    customer: Customer
    vehicle?: CustomerVehicle
}

export function CustomerSearchBar({
    onSelect,
    placeholder = "Search customers...",
    className,
    showVehicles = true,
    disabled = false
}: CustomerSearchBarProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [selectedVehicle, setSelectedVehicle] = useState<CustomerVehicle | null>(null)
    const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    // Search customers
    const { customers, isLoading: customersLoading } = useCustomerSearch({
        searchQuery,
        enabled: open && searchQuery.trim().length > 0
    })

    // Get vehicles for selected customer
    const { vehicles, isLoading: vehiclesLoading } = useCustomerVehicles({
        customerId: selectedCustomer?.id || '',
        enabled: !!selectedCustomer && showVehicles
    })

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setOpen(false)
                setVehicleDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer)
        setSearchQuery(customer.customer_name)
        setOpen(false)

        if (showVehicles && vehicles.length > 0) {
            setVehicleDropdownOpen(true)
        } else {
            // No vehicles or vehicles disabled, emit selection immediately
            onSelect({ customer, vehicle: undefined })
        }
    }

    const handleVehicleSelect = (vehicle: CustomerVehicle) => {
        setSelectedVehicle(vehicle)
        setVehicleDropdownOpen(false)
        onSelect({ customer: selectedCustomer!, vehicle })
    }

    const handleInputChange = (value: string) => {
        setSearchQuery(value)
        if (value.trim().length === 0) {
            setSelectedCustomer(null)
            setSelectedVehicle(null)
        }
    }

    const displayText = selectedCustomer
        ? `${selectedCustomer.customer_name}${selectedVehicle ? ` - ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : ''}`
        : searchQuery

    return (
        <div className={cn("relative", className)} ref={popoverRef}>
            {/* Main Search Input */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-start text-left font-normal h-10 px-3 py-2",
                            "bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg shadow-sm",
                            "hover:bg-[#2a2a2a] hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-200",
                            "transition-all duration-200 text-white",
                            !selectedCustomer && "text-gray-500"
                        )}
                        disabled={disabled}
                    >
                        <Search className="mr-2 h-4 w-4 text-gray-400" />
                        {displayText || placeholder}
                        <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-[#1a1a1a] border-[#3a3a3a]" align="start">
                    <Command className="bg-[#1a1a1a]">
                        <CommandInput
                            placeholder="Search customers..."
                            value={searchQuery}
                            onValueChange={handleInputChange}
                            ref={inputRef}
                            className="bg-[#1a1a1a] text-white border-[#3a3a3a] focus:border-red-500"
                        />
                        <CommandList>
                            {customersLoading && (
                                <div className="p-4 text-center text-sm text-gray-400">
                                    Searching...
                                </div>
                            )}
                            {!customersLoading && customers.length === 0 && searchQuery.trim() && (
                                <CommandEmpty className="text-gray-400">No customers found.</CommandEmpty>
                            )}
                            {customers.length > 0 && (
                                <CommandGroup>
                                    {customers.map((customer) => (
                                        <CommandItem
                                            key={customer.id}
                                            value={customer.customer_name}
                                            onSelect={() => handleCustomerSelect(customer)}
                                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#2a2a2a] text-white"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="bg-red-600 text-white text-xs">
                                                    {getInitials(customer.customer_name)}
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
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Vehicle Selection Dropdown */}
            {showVehicles && selectedCustomer && vehicles.length > 0 && (
                <Popover open={vehicleDropdownOpen} onOpenChange={setVehicleDropdownOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal h-10 px-3 py-2 mt-2",
                                "bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg shadow-sm",
                                "hover:bg-[#2a2a2a] hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-200",
                                "transition-all duration-200 text-white"
                            )}
                        >
                            <Car className="mr-2 h-4 w-4 text-gray-400" />
                            {selectedVehicle
                                ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                                : "Select vehicle..."
                            }
                            <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-[#1a1a1a] border-[#3a3a3a]" align="start">
                        <Command className="bg-[#1a1a1a]">
                            <CommandList>
                                {vehiclesLoading && (
                                    <div className="p-4 text-center text-sm text-gray-400">
                                        Loading vehicles...
                                    </div>
                                )}
                                {!vehiclesLoading && vehicles.length === 0 && (
                                    <div className="p-4 text-center text-sm text-gray-400">
                                        No vehicles found for this customer.
                                    </div>
                                )}
                                {vehicles.length > 0 && (
                                    <CommandGroup>
                                        {vehicles.map((vehicle) => (
                                            <CommandItem
                                                key={vehicle.id}
                                                value={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                                onSelect={() => handleVehicleSelect(vehicle)}
                                                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#2a2a2a] text-white"
                                            >
                                                <Car className="h-4 w-4 text-gray-400" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-white">
                                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                                    </div>
                                                    {vehicle.license_plate && (
                                                        <div className="text-sm text-gray-400">
                                                            {vehicle.license_plate}
                                                        </div>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    )
}
