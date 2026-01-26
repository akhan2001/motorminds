'use client'

import React, { memo, useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { updateCustomer } from '@/app/customers/api/customer-utils'
import {
    CustomerHeader,
    CustomerContactInfo,
    CustomerStats,
    CustomerHistoryTabs,
    CustomerNotes,
    type CustomerDetailSheetProps,
    type Customer
} from './customer-detail'
import { CustomerVehiclesSection } from '@/app/customers/components/customer-vehicles-section'


/**
 * Customer detail sheet component following archived invoice sheet styling
 * Displays comprehensive customer information and history using modular components
 * Supports editing customer contact information
 */
export const CustomerDetailSheet = memo<CustomerDetailSheetProps & { onCustomerUpdated?: () => void }>(({
    customer,
    customerHistory,
    vehicles = [],
    isOpen,
    onClose,
    loading = false,
    vehiclesLoading = false,
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

    // Initialize edit data when customer changes or editing starts
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
                                customerId={customer?.id}
                                onVehiclesUpdated={onCustomerUpdated}
                            />

                            {customerHistory && (
                                <CustomerStats customerHistory={customerHistory} />
                            )}

                            <CustomerHistoryTabs 
                                customerHistory={customerHistory} 
                                loading={loading} 
                            />

                            <CustomerNotes customer={customer} />
                        </>
                    )}

                    {/* Loading State */}
                    {loading && !isEditing && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-pulse text-muted-foreground dark:text-gray-400">
                                Loading customer history...
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
})

CustomerDetailSheet.displayName = 'CustomerDetailSheet'
