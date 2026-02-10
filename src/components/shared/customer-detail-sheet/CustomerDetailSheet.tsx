'use client'

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Loader2, ArrowUpRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    CustomerHeader,
    CustomerContactInfo,
    CustomerStats,
    CustomerHistoryTabs,
    CustomerNotes,
} from '@/app/(features)/admin/components/shared/customer-detail'
import { CustomerVehiclesSection } from '@/app/customers/components/customer-vehicles-section'
import { EmailDialog } from '@/app/customers/components/email-dialog'
import { updateCustomer, deleteCustomer } from '@/app/customers/api/customer-utils'

export interface Customer {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone?: string
    customer_address?: string
    license_plate?: string | null
    shop_id: string
    created_at: string
    updated_at?: string
    notes?: string
    shops?: {
        shop_name: string
        shop_email?: string
    }
}

export interface CustomerHistory {
    workOrders: Array<{
        id: string
        work_order_number: string
        status: string
        created_at: string
        total_amount?: number
        vehicle_info?: string
    }>
    appointments: Array<{
        id: string
        appointment_date: string
        start_time?: string
        end_time?: string
        service_type: string
        status?: string
        notes?: string
        created_at: string
        confirmation_code?: string
    }>
    invoices: Array<{
        id: string
        invoice_number: string
        status: string
        total_amount: number
        issue_date: string
        created_at: string
        due_date?: string
        paid_date?: string
    }>
    totalSpent: number
    lastVisit?: string
    stats?: {
        totalWorkOrders: number
        totalAppointments: number
        totalInvoices: number
        completedWorkOrders: number
        paidInvoices: number
    }
}

export interface Vehicle {
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

export interface CustomerDetailSheetProps {
    customer: Customer | null
    customerHistory?: CustomerHistory | null
    vehicles?: Vehicle[]
    isOpen: boolean
    onClose: () => void
    loading?: boolean
    vehiclesLoading?: boolean
    error?: string | null
    onCustomerUpdated?: () => void
    /** Show link to full customer profile page */
    showProfileLink?: boolean
    /** Allow deleting the customer */
    allowDelete?: boolean
    /** Show email button to send emails */
    showEmailButton?: boolean
}

/**
 * Shared Customer detail sheet component
 * Displays comprehensive customer information and history using modular components
 * Supports editing customer contact information
 * Used by both /customers and /admin pages
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
    onCustomerUpdated,
    showProfileLink = false,
    allowDelete = false,
    showEmailButton = false
}) => {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showEmailDialog, setShowEmailDialog] = useState(false)
    const [editData, setEditData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        license_plate: ''
    })

    // Initialize edit data when customer changes
    useEffect(() => {
        if (customer) {
            setEditData({
                customer_name: customer.customer_name || '',
                customer_email: customer.customer_email === 'NULL' ? '' : (customer.customer_email || ''),
                customer_phone: customer.customer_phone === 'NULL' ? '' : (customer.customer_phone || ''),
                customer_address: customer.customer_address === 'NULL' ? '' : (customer.customer_address || ''),
                license_plate: customer.license_plate || ''
            })
        }
    }, [customer])

    // Reset states when sheet closes
    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false)
            setShowDeleteDialog(false)
            setShowEmailDialog(false)
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
                customer_address: customer.customer_address === 'NULL' ? '' : (customer.customer_address || ''),
                license_plate: customer.license_plate || ''
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
                customerAddress: editData.customer_address.trim() || null,
                licensePlate: editData.license_plate.trim() || null
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

    const handleDeleteCustomer = useCallback(async () => {
        if (!customer?.id || !customer?.shop_id) {
            toast.error('Invalid customer or shop ID')
            setShowDeleteDialog(false)
            return
        }

        setIsDeleting(true)
        try {
            await deleteCustomer(customer.id, customer.shop_id)
            toast.success('Customer removed successfully')
            setShowDeleteDialog(false)
            onClose()
            onCustomerUpdated?.()
        } catch (error: any) {
            console.error('Error deleting customer:', error)
            toast.error(error.message || 'Failed to remove customer')
        } finally {
            setIsDeleting(false)
        }
    }, [customer, onClose, onCustomerUpdated])

    const handleViewProfile = useCallback(() => {
        if (customer?.id) {
            router.push(`/customers/${customer.id}`)
            onClose()
        }
    }, [customer?.id, router, onClose])

    const handleSendEmail = useCallback(() => {
        if (!customer?.customer_email) {
            toast.error('No email address available')
            return
        }
        setShowEmailDialog(true)
    }, [customer?.customer_email])

    // Extract unique license plates from vehicles for dropdown
    const availableLicensePlates = useMemo(() => {
        if (!vehicles || vehicles.length === 0) return []
        return vehicles
            .map(v => v.license_plate)
            .filter((plate): plate is string => Boolean(plate))
            .filter((plate, idx, arr) => arr.indexOf(plate) === idx) // Deduplicate
            .sort()
    }, [vehicles])

    if (!customer) return null

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-[600px] sm:w-[700px] bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border dark:border-[#222222] overflow-y-auto flex flex-col">
                    <CustomerHeader 
                        customer={customer}
                        isEditing={isEditing}
                        isSaving={isSaving}
                        onEditClick={handleEditClick}
                        onCancelClick={handleCancelClick}
                        onSaveClick={handleSaveClick}
                        showEmailButton={showEmailButton}
                        onEmailClick={handleSendEmail}
                    />

                    <div className="space-y-6 pt-6 flex-1 overflow-y-auto">
                        {/* View Full Profile Link */}
                        {showProfileLink && !isEditing && (
                            <Button
                                variant="outline"
                                className="w-full border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={handleViewProfile}
                            >
                                View Full Customer Profile
                                <ArrowUpRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}

                        <CustomerContactInfo 
                            customer={customer}
                            isEditing={isEditing}
                            editData={editData}
                            onFieldChange={handleFieldChange}
                            availableLicensePlates={availableLicensePlates}
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

                    {/* Footer with Delete Button */}
                    {allowDelete && !isEditing && (
                        <SheetFooter className="pt-4 border-t border-border dark:border-[#2a2a2a]">
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                                className="w-full sm:w-auto"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Customer
                            </Button>
                        </SheetFooter>
                    )}
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-popover dark:bg-[#1a1a1a] text-foreground border border-border dark:border-[#2a2a2a]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Customer?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This will remove the customer from your shop. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            disabled={isDeleting}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={handleDeleteCustomer}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                'Remove'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Email Dialog */}
            {showEmailButton && customer && (
                <EmailDialog
                    isOpen={showEmailDialog}
                    onOpenChange={setShowEmailDialog}
                    emailToSend={customer.customer_email || ''}
                    recipient_name={customer.customer_name}
                />
            )}
        </>
    )
})

CustomerDetailSheet.displayName = 'CustomerDetailSheet'
