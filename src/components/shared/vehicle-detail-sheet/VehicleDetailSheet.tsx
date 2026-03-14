'use client'

import React, { memo } from 'react'
import { useRouter } from 'next/navigation'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Loader2, Car, User, ArrowUpRight } from 'lucide-react'
import { CustomerStats, CustomerHistoryTabs } from '@/app/(features)/admin/components/shared/customer-detail'
import type { CustomerHistory } from '@/app/(features)/admin/components/shared/customer-detail/types'

export interface VehicleWithContext {
    id: string
    year?: number
    make?: string
    model?: string
    vin?: string
    license_plate?: string
    color?: string
    engine_type?: string
    mileage?: number
    customer_id: string
    customer_name?: string
    shopName?: string | null
    /** Whether this vehicle's customer belongs to the user's current shop */
    isFromCurrentShop?: boolean
}

export interface VehicleDetailSheetProps {
    vehicle: VehicleWithContext | null
    vehicleHistory?: CustomerHistory | null
    isOpen: boolean
    onClose: () => void
    loading?: boolean
    error?: string | null
    onVehicleUpdated?: () => void
}

function formatVehicleDisplay(vehicle: VehicleWithContext): string {
    const parts = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean)
    return parts.join(' ') || 'Unknown Vehicle'
}

export const VehicleDetailSheet = memo<VehicleDetailSheetProps>(({
    vehicle,
    vehicleHistory,
    isOpen,
    onClose,
    loading = false,
    error = null,
    onVehicleUpdated,
}) => {
    const router = useRouter()

    const handleViewCustomer = () => {
        if (vehicle?.customer_id) {
            router.push(`/customers?customer=${vehicle.customer_id}`)
            onClose()
        }
    }

    if (!vehicle) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[600px] sm:w-[700px] bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border dark:border-[#222222] overflow-y-auto flex flex-col">
                <SheetHeader className="pb-4 border-b border-border dark:border-[#222222]">
                    <SheetDescription className="sr-only">
                        Vehicle details for {formatVehicleDisplay(vehicle)}
                    </SheetDescription>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/10">
                            <Car className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-foreground dark:text-white text-xl font-bold">
                                {formatVehicleDisplay(vehicle)}
                            </SheetTitle>
                            {vehicle.license_plate && (
                                <p className="text-sm text-muted-foreground dark:text-gray-400 mt-0.5">
                                    {vehicle.license_plate}
                                    {vehicle.vin && ` • VIN: ${vehicle.vin}`}
                                </p>
                            )}
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-6 pt-6 flex-1 overflow-y-auto">
                    {/* Vehicle details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {vehicle.color && (
                            <div>
                                <span className="text-muted-foreground dark:text-gray-400">Color</span>
                                <p className="font-medium text-foreground dark:text-white">{vehicle.color}</p>
                            </div>
                        )}
                        {vehicle.mileage != null && (
                            <div>
                                <span className="text-muted-foreground dark:text-gray-400">Mileage</span>
                                <p className="font-medium text-foreground dark:text-white">
                                    {vehicle.mileage.toLocaleString()} mi
                                </p>
                            </div>
                        )}
                        {vehicle.engine_type && (
                            <div>
                                <span className="text-muted-foreground dark:text-gray-400">Engine</span>
                                <p className="font-medium text-foreground dark:text-white">{vehicle.engine_type}</p>
                            </div>
                        )}
                    </div>

                    {/* Owner */}
                    {vehicle.customer_name && (
                        <div className="flex items-center justify-between p-4 rounded-lg bg-card dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                                <div>
                                    <p className="text-sm text-muted-foreground dark:text-gray-400">Owner</p>
                                    <p className="font-medium text-foreground dark:text-white">
                                        {vehicle.customer_name}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleViewCustomer}
                                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                View Customer
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}

                    {/* Stats and History */}
                    {vehicleHistory && (
                        <>
                            <CustomerStats customerHistory={vehicleHistory} />
                            <CustomerHistoryTabs
                                customerHistory={vehicleHistory}
                                loading={loading}
                                error={error}
                            />
                        </>
                    )}

                    {/* Loading - only when no history yet */}
                    {loading && !vehicleHistory && (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="animate-pulse text-muted-foreground dark:text-gray-400">
                                    Loading vehicle history...
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-red-500 dark:text-red-400 text-sm">
                                Failed to load vehicle history: {error}
                            </div>
                        </div>
                    )}

                    {/* No history yet (not loading, no error) */}
                    {!vehicleHistory && !loading && !error && (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-muted-foreground dark:text-gray-400 text-sm">
                                No history data available
                            </p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
})

VehicleDetailSheet.displayName = 'VehicleDetailSheet'
