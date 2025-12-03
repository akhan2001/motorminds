'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Archive } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useArchivedWorkOrders } from '../../../hooks/use-archived-work-orders'
import { ArchivedWorkOrderCard } from './ArchivedWorkOrderCard'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function ArchivedWorkOrdersList() {
    const { shopId } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')

    const {
        data: workOrders = [],
        isLoading,
        error
    } = useArchivedWorkOrders(shopId || '')

    // Client-side filtering since the hook returns all
    const filteredWorkOrders = workOrders.filter(wo => {
        if (!searchTerm) return true
        const searchLower = searchTerm.toLowerCase()
        return (
            wo.title.toLowerCase().includes(searchLower) ||
            wo.work_order_number.toLowerCase().includes(searchLower) ||
            wo.customer?.customer_name.toLowerCase().includes(searchLower) ||
            wo.vehicle?.make.toLowerCase().includes(searchLower) ||
            wo.vehicle?.model.toLowerCase().includes(searchLower)
        )
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
                    <Input
                        placeholder="Search archived work orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-background border-border"
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
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
