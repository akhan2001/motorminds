'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, formatPhoneNumber } from "@/lib/utils/text"
import { useAuth } from "../../../hooks/use-auth"
import { CustomerDropdown } from "@/app/(features)/customers/components/Selection"
import { CustomerSearchBar } from "@/components/common/customers/customer-search-bar"
import { VehicleSearchForCustomer } from "@/components/common/customers/vehicle-search-for-customer"
import { CustomerService, type CustomerFormData } from "@/app/(features)/customers/lib/customer-service"
import { toast } from "sonner"
import { Save, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

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
    const [errors, setErrors] = useState<Partial<Record<'customer' | 'customerPhone' | 'customerEmail', string>>>({})

    const validateField = (field: 'customer' | 'customerPhone' | 'customerEmail', value: string): string | undefined => {
        switch (field) {
            case 'customer':
                if (!value || value.trim().length === 0) return 'Name is required'
                return undefined
            case 'customerPhone':
                if (!value || value.trim().length === 0) return 'Phone number is required'
                // Basic phone validation (allows digits and common symbols)
                if (!/^[0-9()+\-\s]{7,}$/.test(value.trim())) return 'Enter a valid phone number'
                return undefined
            case 'customerEmail':
                if (!value) return undefined // optional
                if (!/^\S+@\S+\.[\w]{2,}$/.test(value.trim())) return 'Enter a valid email address'
                return undefined
            default:
                return undefined
        }
    }

    const handleBlur = (field: 'customer' | 'customerPhone' | 'customerEmail', value: string) => {
        const error = validateField(field, value)
        if (error) setErrors(prev => ({ ...prev, [field]: error }))
    }

    const isFormValid = () => {
        const nameErr = validateField('customer', customerName)
        const phoneErr = validateField('customerPhone', customerPhone)
        const emailErr = validateField('customerEmail', customerEmail)
        return !nameErr && !phoneErr && !emailErr
    }

    // Handle customer selection from dropdown
    const handleCustomerSelect = (selectedCustomerId: string, customerData?: any) => {
        if (selectedCustomerId === "new") {
            // "Add New Customer" - clear all fields
            onFieldChange('customer', '')
            onFieldChange('customerEmail', '')
            onFieldChange('customerPhone', '')
            onFieldChange('customerAddress', '')
            onCustomerChange?.("new")
            setErrors({})
        } else if (customerData) {
            // Existing customer - populate data
            onFieldChange('customer', customerData.name || '')
            onFieldChange('customerEmail', customerData.email || '')
            onFieldChange('customerPhone', customerData.phone || '')
            onFieldChange('customerAddress', customerData.address || '')
            onCustomerChange?.(selectedCustomerId)
            setErrors({})
        }
    }

    // Handle saving new customer
    const handleSaveCustomer = async () => {
        if (!shopId) {
            toast.error('Shop ID is required')
            return
        }

        const nameErr = validateField('customer', customerName)
        const phoneErr = validateField('customerPhone', customerPhone)
        const emailErr = validateField('customerEmail', customerEmail)
        setErrors(prev => ({ ...prev, customer: nameErr, customerPhone: phoneErr, customerEmail: emailErr }))
        if (nameErr || phoneErr || emailErr) return

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
            <h3 className="text-lg font-medium text-foreground dark:text-white">Customer Information</h3>
            <div className="bg-slate-50 dark:bg-[#1A1A1A] rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-[#b22222] text-white text-xl">
                            {customerName ? getInitials(customerName) : ''}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        {/* Customer Selection - Tabs for Search by Customer or Vehicle */}
                        {isCreating && isEditing && shopId && (
                            <Tabs defaultValue="customer" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="customer">Search by Customer</TabsTrigger>
                                    <TabsTrigger value="vehicle">Search by Vehicle</TabsTrigger>
                                </TabsList>
                                <TabsContent value="customer" className="mt-3">
                                    <CustomerSearchBar
                                        onSelect={(customer) => {
                                            // Handle customer selection from search bar
                                            onFieldChange('customer', customer.customer_name || '')
                                            onFieldChange('customerEmail', customer.customer_email || '')
                                            onFieldChange('customerPhone', customer.customer_phone || '')
                                            onFieldChange('customerAddress', customer.customer_address || '')
                                            onCustomerChange?.(customer.id)
                                        }}
                                        onCreateNew={() => {
                                            // Clear all fields for new customer
                                            onFieldChange('customer', '')
                                            onFieldChange('customerEmail', '')
                                            onFieldChange('customerPhone', '')
                                            onFieldChange('customerAddress', '')
                                            onCustomerChange?.("new")
                                        }}
                                        placeholder="Search customers..."
                                        className="w-full"
                                    />
                                </TabsContent>
                                <TabsContent value="vehicle" className="mt-3">
                                    <VehicleSearchForCustomer
                                        shopId={shopId}
                                        onCustomerSelect={(customer) => {
                                            // Handle customer selection from vehicle search
                                            onFieldChange('customer', customer.customer_name || '')
                                            onFieldChange('customerEmail', customer.customer_email || '')
                                            onFieldChange('customerPhone', customer.customer_phone || '')
                                            onFieldChange('customerAddress', customer.customer_address || '')
                                            onCustomerChange?.(customer.id)
                                        }}
                                        placeholder="Search by license plate..."
                                        className="w-full"
                                    />
                                </TabsContent>
                            </Tabs>
                        )}

                        {/* Customer Information Fields */}
                        <div className="space-y-2 mt-2 p-3 border border-border dark:border-[#2a2a2a] rounded-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {/* First row */}
                                <div>
                                    <Label htmlFor="customer_name" className="text-muted-foreground dark:text-gray-400">Name *</Label>
                                    <Input
                                        id="customer_name"
                                        className={`bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white text-sm border-border dark:border-[#2a2a2a] focus:ring-gray-500 w-full ${errors.customer ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="Customer Name"
                                        value={customerName || ''}
                                        onChange={(e) => {
                                            if (!isEditing) return
                                            onFieldChange('customer', e.target.value)
                                            if (errors.customer) setErrors(prev => ({ ...prev, customer: undefined }))
                                        }}
                                        onBlur={() => handleBlur('customer', customerName)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                        required={isCreating && customerId === "new"}
                                    />
                                    {errors.customer && (
                                        <div className="mt-1 text-red-500 dark:text-red-400 text-xs flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7h2v6h-2zm0 8h2v2h-2z"/></svg>
                                            {errors.customer}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="customer_phone" className="text-muted-foreground dark:text-gray-400">Phone *</Label>
                                    <Input
                                        id="customer_phone"
                                        className={`bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white text-sm border-border dark:border-[#2a2a2a] focus:ring-gray-500 w-full ${errors.customerPhone ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="Phone Number"
                                        value={customerPhone ? formatPhoneNumber(customerPhone) : ''}
                                        onChange={(e) => {
                                            if (!isEditing) return
                                            onFieldChange('customerPhone', e.target.value)
                                            if (errors.customerPhone) setErrors(prev => ({ ...prev, customerPhone: undefined }))
                                        }}
                                        onBlur={() => handleBlur('customerPhone', customerPhone)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                        required={isCreating && customerId === "new"}
                                        inputMode="numeric"
                                    />
                                    {errors.customerPhone && (
                                        <div className="mt-1 text-red-500 dark:text-red-400 text-xs flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7h2v6h-2zm0 8h2v2h-2z"/></svg>
                                            {errors.customerPhone}
                                        </div>
                                    )}
                                </div>

                                {/* Second row */}
                                <div>
                                    <Label htmlFor="customer_email" className="text-muted-foreground dark:text-gray-400">Email</Label>
                                    <Input
                                        id="customer_email"
                                        className={`bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white text-sm border-border dark:border-[#2a2a2a] focus:ring-gray-500 w-full ${errors.customerEmail ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="Email Address"
                                        type="email"
                                        value={customerEmail == 'NULL' ? '' : customerEmail || ''}
                                        onChange={(e) => {
                                            if (!isEditing) return
                                            onFieldChange('customerEmail', e.target.value)
                                            if (errors.customerEmail) setErrors(prev => ({ ...prev, customerEmail: undefined }))
                                        }}
                                        onBlur={() => handleBlur('customerEmail', customerEmail)}
                                        disabled={!isEditing || (isCreating && customerId !== "new")}
                                    />
                                    {errors.customerEmail && (
                                        <div className="mt-1 text-red-500 dark:text-red-400 text-xs flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7h2v6h-2zm0 8h2v2h-2z"/></svg>
                                            {errors.customerEmail}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="customer_address" className="text-muted-foreground dark:text-gray-400">Address</Label>
                                    <Input
                                        id="customer_address"
                                        className="bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white text-sm border-border dark:border-[#2a2a2a] focus:ring-gray-500 w-full"
                                        placeholder="Address"
                                        value={customerAddress == 'NULL' ? '' : customerAddress || ''}
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
                                        disabled={isSaving || !isFormValid()}
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
