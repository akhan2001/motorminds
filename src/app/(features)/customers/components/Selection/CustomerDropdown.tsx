'use client'

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import { formatPhoneNumber } from "@/lib/utils/text"

// Customer dropdown option (same as work-order-form.tsx)
interface CustomerOption {
    id: string
    name: string
    phone: string
    email?: string
    address?: string
}

export interface CustomerDropdownProps {
    shopId: string
    selectedCustomerId: string
    onCustomerSelect: (customerId: string, customerData?: CustomerOption) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    isLoading?: boolean // External loading state (e.g., waiting for shopId)
}


export const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
    shopId,
    selectedCustomerId,
    onCustomerSelect,
    placeholder = "Select Customer",
    disabled = false,
    className = "",
    isLoading: externalLoading = false
}) => {
    const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([])
    const [internalLoading, setInternalLoading] = useState(false)
    
    // Combine external and internal loading states
    const isLoading = externalLoading || internalLoading

    // Fetch customers on mount (same pattern as work-order-form.tsx)
    useEffect(() => {
        async function fetchCustomers() {
            if (!shopId) return
            
            setInternalLoading(true)
            try {
                const supabase = createClient()
                const { data: customersData, error } = await supabase
                    .from("customers")
                    .select("id, customer_name, customer_phone, customer_email, customer_address")
                    .eq("shop_id", shopId)

                if (!error && customersData) {
                    const options: CustomerOption[] = customersData.map((cust: any) => ({
                        id: cust.id,
                        name: cust.customer_name,
                        phone: cust.customer_phone,
                        email: cust.customer_email,
                        address: cust.customer_address,
                    }))
                    setCustomerOptions(options)
                }
            } catch (error) {
                console.error("Error fetching customers:", error)
            } finally {
                setInternalLoading(false)
            }
        }

        fetchCustomers()
    }, [shopId])

    // Handle customer selection
    const handleCustomerChange = (value: string) => {
        if (value === "new") {
            onCustomerSelect("new")
        } else {
            const selectedCust = customerOptions.find((opt) => opt.id === value)
            onCustomerSelect(value, selectedCust)
        }
    }

    // Dynamic placeholder based on loading state
    const getPlaceholder = () => {
        if (externalLoading) return "Loading..."
        if (internalLoading) return "Loading customers..."
        return placeholder
    }

    return (
        <Select
            value={selectedCustomerId}
            onValueChange={handleCustomerChange}
            disabled={disabled || isLoading}
        >
            <SelectTrigger className={`bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 ${className}`}>
                <SelectValue placeholder={getPlaceholder()} />
            </SelectTrigger>
            <SelectContent className="bg-[#292929] text-white border-[#626262]">
                {!isLoading && (
                    <>
                        <SelectItem value="new">+ Add New Customer</SelectItem>
                        {customerOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                                {option.name} <span className="text-gray-400 text-xs">{formatPhoneNumber(option.phone)}</span>
                            </SelectItem>
                        ))}
                    </>
                )}
                {isLoading && (
                    <SelectItem value="loading" disabled>
                        Loading customers...
                    </SelectItem>
                )}
            </SelectContent>
        </Select>
    )
}

export default CustomerDropdown
