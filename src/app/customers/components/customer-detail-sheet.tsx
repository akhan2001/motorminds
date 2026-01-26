'use client'

import React, { memo, useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    CustomerHeader,
    CustomerContactInfo,
    CustomerStats,
    CustomerHistoryTabs,
    CustomerNotes,
} from '@/app/(features)/admin/components/shared/customer-detail'
import { CustomerVehiclesSection } from './customer-vehicles-section'
import { updateCustomer } from '../api/customer-utils'

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

interface CustomerHistory {
    workOrders: Array<{
        id: string
        work_order_number: string
        status: string
        created_at: string
        total_amount?: number
        vehicle_info?: string
    }>
    invoices: Array<{
        id: string
        invoice_number: string
        status: string
        total_amount: number
        issue_date: string
    }>
    totalSpent: number
    lastVisit?: string
}

interface Vehicle {
    id: string
    year?: number
    make?: string
    model?: string
    license_plate?: string
    vin?: string
    color?: string
    engine?: string
    created_at?: string
}

interface CustomerDetailSheetProps {
    customer: Customer | null
    customerHistory?: CustomerHistory | null
    vehicles?: Vehicle[]
    isOpen: boolean
    onClose: () => void
    loading?: boolean
    vehiclesLoading?: boolean
    error?: string | null
    onCustomerUpdated?: () => void
}

/**
 * Customer detail sheet component for main customers page
 * Uses the same modular components as the admin version for consistency
 * Supports editing customer contact information
 */
export const CustomerDetailSheet = memo<CustomerDetailSheetProps>(({
    customer,
    customerHistory,
    vehicles = [],
    isOpen,
    onClose,
    loading = false,
    vehiclesLoading = false,
    error = null,
    onCustomerUpdated
}) => {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editData, setEditData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: ''
    })

    // Initialize edit data when customer changes
    useEffect(() => {
        if (customer) {
            setEditData({
                customer_name: customer.customer_name || '',
                customer_email: customer.customer_email === 'NULL' ? '' : (customer.customer_email || ''),
                customer_phone: customer.customer_phone === 'NULL' ? '' : (customer.customer_phone || ''),
                customer_address: customer.customer_address === 'NULL' ? '' : (customer.customer_address || '')
            })
        }
    }, [customer])

    // Reset editing state when sheet closes
    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false)
        }
    }, [isOpen])

    const handleEditClick = useCallback(() => {
        setIsEditing(true)
    }, [])

    const handleCancelClick = useCallback(() => {
        // Reset edit data to original values
        if (customer) {
            setEditData({
                customer_name: customer.customer_name || '',
                customer_email: customer.customer_email === 'NULL' ? '' : (customer.customer_email || ''),
                customer_phone: customer.customer_phone === 'NULL' ? '' : (customer.customer_phone || ''),
                customer_address: customer.customer_address === 'NULL' ? '' : (customer.customer_address || '')
            })
        }
        setIsEditing(false)
    }, [customer])

    const handleFieldChange = useCallback((field: string, value: string) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }))
    }, [])

    const handleSaveClick = useCallback(async () => {
        if (!customer) return

        // Validate required fields
        if (!editData.customer_name.trim()) {
            toast.error('Customer name is required')
            return
        }

        setIsSaving(true)
        try {
            const result = await updateCustomer(customer.id, {
                customerName: editData.customer_name.trim(),
                customerEmail: editData.customer_email.trim() || null,
                customerPhone: editData.customer_phone.trim() || null,
                customerAddress: editData.customer_address.trim() || null
            })

            if (result) {
                toast.success('Customer updated successfully')
                setIsEditing(false)
                // Notify parent to refresh data
                if (onCustomerUpdated) {
                    onCustomerUpdated()
                }
            } else {
                toast.error('Failed to update customer')
            }
        } catch (error: any) {
            console.error('Error updating customer:', error)
            toast.error(error.message || 'Failed to update customer')
        } finally {
            setIsSaving(false)
        }
    }, [customer, editData, onCustomerUpdated])

    if (!customer) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[600px] sm:w-[700px] bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border dark:border-[#222222] overflow-y-auto">
                <CustomerHeader 
                    customer={customer}
                    isEditing={isEditing}
                    isSaving={isSaving}
                    onEditClick={handleEditClick}
                    onCancelClick={handleCancelClick}
                    onSaveClick={handleSaveClick}
                />

                <div className="space-y-6 pt-6">
                    <CustomerContactInfo 
                        customer={customer}
                        isEditing={isEditing}
                        editData={editData}
                        onFieldChange={handleFieldChange}
                    />

                    {/* Only show other sections when not editing */}
                    {!isEditing && (
                        <>
                            {/* Customer Vehicles Section */}
                            <CustomerVehiclesSection 
                                vehicles={vehicles}
                                loading={vehiclesLoading}
                                customerId={customer.id}
                                onVehiclesUpdated={onCustomerUpdated}
                            />

                            {customerHistory && (
                                <CustomerStats customerHistory={customerHistory} />
                            )}

                            <CustomerHistoryTabs 
                                customerHistory={customerHistory} 
                                loading={loading}
                                error={error}
                            />

                            <CustomerNotes customer={customer} />
                        </>
                    )}

                    {/* Loading State */}
                    {loading && !isEditing && (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="animate-pulse text-muted-foreground dark:text-gray-400">
                                    Loading customer history...
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && !isEditing && (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-red-500 dark:text-red-400 text-sm">
                                Failed to load customer history: {error}
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
})

CustomerDetailSheet.displayName = 'CustomerDetailSheet'
