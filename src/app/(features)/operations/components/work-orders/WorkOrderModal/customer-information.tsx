'use client'

import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, formatPhoneNumber } from "@/lib/utils/text"
import { useAuth } from "../../../hooks/use-auth"
import { CustomerDropdown } from "@/app/(features)/customers/components/Selection"

export interface CustomerInformationProps {
    customerId: string
    customerName: string
    customerEmail: string
    customerPhone: string
    customerAddress: string
    isEditing: boolean
    isCreating?: boolean
    onFieldChange: (field: string, value: string) => void
    onCustomerChange?: (customerId: string) => void
    className?: string
}

export const CustomerInformation: React.FC<CustomerInformationProps> = ({
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    isEditing,
    isCreating = false,
    onFieldChange,
    onCustomerChange,
    className = ""
}) => {
    const { shopId } = useAuth()

    // Handle customer selection from dropdown
    const handleCustomerSelect = (selectedCustomerId: string, customerData?: any) => {
        if (selectedCustomerId === "new") {
            // "Add New Customer" - clear all fields
            onFieldChange('customer', '')
            onFieldChange('customerEmail', '')
            onFieldChange('customerPhone', '')
            onFieldChange('customerAddress', '')
            onCustomerChange?.("new")
        } else if (customerData) {
            // Existing customer - populate data
            onFieldChange('customer', customerData.name)
            onFieldChange('customerEmail', customerData.email || '')
            onFieldChange('customerPhone', customerData.phone || '')
            onFieldChange('customerAddress', customerData.address || '')
            onCustomerChange?.(selectedCustomerId)
        }
    }


    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-white">Customer Information</h3>
            <div className="bg-[#1A1A1A] rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-[#b22222] text-white text-xl">
                            {getInitials(customerName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        {/* Customer Selection Dropdown (only for creation mode) */}
                        {isCreating && isEditing && (
                            <div className="flex flex-wrap gap-2">
                                <div className="w-full sm:w-auto sm:flex-1">
                                    <CustomerDropdown
                                        shopId={shopId || ""}
                                        selectedCustomerId={customerId}
                                        onCustomerSelect={handleCustomerSelect}
                                        placeholder={shopId ? "Select Customer" : "Loading..."}
                                        className="w-full"
                                        isLoading={!shopId}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Customer Information Fields */}
                        <div className="space-y-2 mt-2 p-3 border border-[#626262] rounded-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {/* First row */}
                                <div>
                                    <Input
                                        className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                        placeholder="Customer Name"
                                        value={customerName}
                                        onChange={(e) => isEditing && onFieldChange('customer', e.target.value)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                        required={isCreating && customerId === "new"}
                                    />
                                </div>
                                <div>
                                    <Input
                                        className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                        placeholder="Phone Number"
                                        value={formatPhoneNumber(customerPhone)}
                                        onChange={(e) => isEditing && onFieldChange('customerPhone', e.target.value)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                        required={isCreating && customerId === "new"}
                                    />
                                </div>
                                
                                {/* Second row */}
                                <div>
                                    <Input
                                        className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                        placeholder="Email Address"
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => isEditing && onFieldChange('customerEmail', e.target.value)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                    />
                                </div>
                                <div>
                                    <Input
                                        className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                        placeholder="Address"
                                        value={customerAddress}
                                        onChange={(e) => isEditing && onFieldChange('customerAddress', e.target.value)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
