'use client'

import React, { memo } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Loader2 } from 'lucide-react'
import {
    CustomerHeader,
    CustomerContactInfo,
    CustomerStats,
    CustomerHistoryTabs,
    CustomerNotes,
} from '@/app/(features)/admin/components/shared/customer-detail'
import { CustomerVehiclesSection } from './customer-vehicles-section'

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
}

/**
 * Customer detail sheet component for main customers page
 * Uses the same modular components as the admin version for consistency
 */
export const CustomerDetailSheet = memo<CustomerDetailSheetProps>(({
    customer,
    customerHistory,
    vehicles = [],
    isOpen,
    onClose,
    loading = false,
    vehiclesLoading = false,
    error = null
}) => {
    if (!customer) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[600px] sm:w-[700px] bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border dark:border-[#222222] overflow-y-auto">
                <CustomerHeader customer={customer} />

                <div className="space-y-6 pt-6">
                    <CustomerContactInfo customer={customer} />

                    {/* Customer Vehicles Section */}
                    <CustomerVehiclesSection 
                        vehicles={vehicles}
                        loading={vehiclesLoading}
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

                    {/* Loading State */}
                    {loading && (
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
                    {error && !loading && (
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
