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
    type CustomerDetailSheetProps
} from './customer-detail'


/**
 * Customer detail sheet component following archived invoice sheet styling
 * Displays comprehensive customer information and history using modular components
 */
export const CustomerDetailSheet = memo<CustomerDetailSheetProps>(({
    customer,
    customerHistory,
    isOpen,
    onClose,
    loading = false
}) => {
    if (!customer) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[600px] sm:w-[700px] bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border dark:border-[#222222] overflow-y-auto">
                <CustomerHeader customer={customer} />

                <div className="space-y-6 pt-6">
                    <CustomerContactInfo customer={customer} />

                    {/* {customerHistory && (
                        <CustomerStats customerHistory={customerHistory} />
                    )} */}

                    <CustomerHistoryTabs 
                        customerHistory={customerHistory} 
                        loading={loading} 
                    />

                    <CustomerNotes customer={customer} />

                    {/* Loading State */}
                    {loading && (
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
