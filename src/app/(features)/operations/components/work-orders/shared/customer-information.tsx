'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, formatPhoneNumber } from "@/lib/utils/text"
import { useAuth } from "../../../hooks/use-auth"
import { CustomerDropdown } from "@/app/(features)/customers/components/Selection"
import { CustomerSearchBar } from "@/components/common/customers/customer-search-bar"
import { CustomerService, type CustomerFormData } from "@/app/(features)/customers/lib/customer-service"
import { toast } from "sonner"
import { Save, Loader2 } from "lucide-react"

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
    onCustomerSaved?: (customerId: string, customerData: any) => void
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
    onCustomerSaved,
    className = ""
}) => {
    const { shopId } = useAuth()
    const [isSaving, setIsSaving] = useState(false)

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

    // Handle saving new customer
    const handleSaveCustomer = async () => {
        if (!shopId) {
            toast.error('Shop ID is required')
            return
        }

        if (!customerName.trim()) {
            toast.error('Customer name is required')
            return
        }

        if (!customerPhone.trim()) {
            toast.error('Customer phone is required')
            return
        }

        setIsSaving(true)
        try {
            const customerData: CustomerFormData = {
                name: customerName.trim(),
                email: customerEmail.trim() || undefined,
                phone: customerPhone.trim(),
                address: customerAddress.trim() || undefined,
                source: 'work_order'
            }

            const savedCustomer = await CustomerService.createCustomer(shopId, customerData)

            toast.success(`Customer "${savedCustomer.customer_name}" created successfully`)

            // Notify parent component with the new customer data
            onCustomerSaved?.(savedCustomer.id, {
                id: savedCustomer.id,
                name: savedCustomer.customer_name,
                email: savedCustomer.customer_email,
                phone: savedCustomer.customer_phone,
                address: savedCustomer.customer_address
            })

            // Update the customer ID to the newly created customer
            onCustomerChange?.(savedCustomer.id)

        } catch (error: any) {
            console.error('Error saving customer:', error)
            toast.error(error.message || 'Failed to save customer')
        } finally {
            setIsSaving(false)
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
                        {/* Customer Selection - Use Search Bar for better UX */}
                        {isCreating && isEditing && (
                            <div className="flex flex-wrap gap-2">
                                <div className="w-full sm:w-auto sm:flex-1">
                                    <CustomerSearchBar
                                        onSelect={(customer) => {
                                            // Handle customer selection from search bar
                                            onFieldChange('customer', customer.customer_name)
                                            onFieldChange('customerEmail', customer.customer_email || '')
                                            onFieldChange('customerPhone', customer.customer_phone || '')
                                            onFieldChange('customerAddress', customer.customer_address || '')
                                            onCustomerChange?.(customer.id)
                                        }}
                                        placeholder="Search customers..."
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Customer Information Fields */}
                        <div className="space-y-2 mt-2 p-3 border border-[#2a2a2a] rounded-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {/* First row */}
                                <div>
                                    <Input
                                        className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                        placeholder="Customer Name"
                                        value={customerName}
                                        onChange={(e) => isEditing && onFieldChange('customer', e.target.value)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                        required={isCreating && customerId === "new"}
                                    />
                                </div>
                                <div>
                                    <Input
                                        className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                        placeholder="Phone Number"
                                        value={formatPhoneNumber(customerPhone)}
                                        onChange={(e) => isEditing && onFieldChange('customerPhone', e.target.value)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                        required={isCreating && customerId === "new"}
                                        inputMode="numeric"
                                    />
                                </div>

                                {/* Second row */}
                                <div>
                                    <Input
                                        className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                        placeholder="Email Address"
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => isEditing && onFieldChange('customerEmail', e.target.value)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                    />
                                </div>
                                <div>
                                    <Input
                                        className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                        placeholder="Address"
                                        value={customerAddress}
                                        onChange={(e) => isEditing && onFieldChange('customerAddress', e.target.value)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                    />
                                </div>
                            </div>

                            {/* Save Customer Button - Only show when creating new customer */}
                            {isCreating && isEditing && customerId === "new" && (
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        onClick={handleSaveCustomer}
                                        disabled={isSaving || !customerName.trim() || !customerPhone.trim()}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        size="sm"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Customer
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
