'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Archive } from 'lucide-react'
import { useAuth } from '../../../hooks/use-auth'
import { useArchivedWorkOrders, useUnarchiveWorkOrder } from '../../../hooks/use-archived-work-orders'
import { ArchivedWorkOrderCard } from './ArchivedWorkOrderCard'
import { SearchBar } from '@/app/(features)/admin/components/shared/SearchBar'
import { useState } from 'react'
import { WorkOrderDetailSheet } from '../shared/work-order-detail-sheet'
import { useWorkOrderWithDetails } from '../../../hooks/use-work-orders'

export function ArchivedWorkOrdersList() {
    const { shopId } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const {
        data: workOrders = [],
        isLoading,
        error
    } = useArchivedWorkOrders(shopId || '')

    const { mutate: unarchive } = useUnarchiveWorkOrder(shopId || '')

    // Fetch full work order details when sheet is open
    const { data: selectedWorkOrder } = useWorkOrderWithDetails(selectedWorkOrderId || '')

    const handleWorkOrderClick = (workOrderId: string) => {
        setSelectedWorkOrderId(workOrderId)
        setIsSheetOpen(true)
    }

    const handleCloseSheet = () => {
        setIsSheetOpen(false)
        setSelectedWorkOrderId(null)
    }

    const handleUnarchive = () => {
        if (!selectedWorkOrderId) return
        unarchive(selectedWorkOrderId, {
            onSuccess: () => {
                setIsSheetOpen(false)
                setSelectedWorkOrderId(null)
            }
        })
    }

    // Client-side filtering since the hook returns all
    const filteredWorkOrders = workOrders.filter((wo) => {
        if (!searchTerm.trim()) return true
        const q = searchTerm.toLowerCase().trim()
        const matches = (val: string | number | undefined | null) =>
            val != null && String(val).toLowerCase().includes(q)
        if (matches(wo.work_order_number) || matches(wo.title) || matches(wo.description))
            return true
        if (wo.customer && (matches(wo.customer.customer_name) || matches(wo.customer.customer_phone)))
            return true
        if (wo.vehicle) {
            if (
                matches(wo.vehicle.make) ||
                matches(wo.vehicle.model) ||
                matches(wo.vehicle.year) ||
                matches(wo.vehicle.license_plate)
            )
                return true
        }
        if (wo.walk_in_vehicle_info) {
            const w = wo.walk_in_vehicle_info
            if (
                matches(w.make) ||
                matches(w.model) ||
                matches(w.year) ||
                matches(w.license_plate)
            )
                return true
        }
        if (wo.technician) {
            const t = wo.technician
            if (matches(t.first_name) || matches(t.last_name)) return true
        }
        return false
    })

    if (error) {
        return (
            <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">Error Loading Archived Work Orders</h3>
                    <p className="text-red-500 dark:text-red-400">
                        {error instanceof Error ? error.message : 'Failed to load archived work orders'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground dark:text-white flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Archived Work Orders
                        {filteredWorkOrders.length > 0 && (
                            <span className="bg-secondary dark:bg-[#2a2a2a] text-muted-foreground dark:text-gray-300 text-sm px-2 py-1 rounded ml-2">
                                {filteredWorkOrders.length.toLocaleString()}
                            </span>
                        )}
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent>
                {/* Search */}
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search by work order #, customer, vehicle, title..."
                        className="max-w-md"
                    />
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-32 w-full bg-secondary dark:bg-[#2a2a2a]" />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredWorkOrders.length === 0 && (
                    <div className="p-8 text-center">
                        <Archive className="h-12 w-12 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
                            {searchTerm ? 'No archived work orders found' : 'No archived work orders'}
                        </h3>
                        <p className="text-muted-foreground dark:text-gray-400">
                            {searchTerm
                                ? 'Try adjusting your search terms'
                                : 'Archived work orders will appear here'
                            }
                        </p>
                    </div>
                )}

                {/* Work Order List */}
                {!isLoading && filteredWorkOrders.length > 0 && (
                    <div className="space-y-3 relative">
                        {filteredWorkOrders.map((wo) => (
                            <ArchivedWorkOrderCard
                                key={wo.id}
                                workOrder={wo}
                                onClick={() => handleWorkOrderClick(wo.id)}
                            />
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Work Order Detail Sheet */}
            <WorkOrderDetailSheet
                workOrder={selectedWorkOrder || null}
                isOpen={isSheetOpen}
                onClose={handleCloseSheet}
                onUnarchive={handleUnarchive}
            />
        </Card>
    )
}
