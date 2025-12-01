'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Calendar, Car, Users } from 'lucide-react'
import { formatDate, formatCurrency, getWorkOrderStatusVariant, formatVehicleInfo, formatEmployeeName } from './utils'
import type { WorkOrder } from './types'

interface WorkOrdersListProps {
    workOrders: WorkOrder[]
}

export const WorkOrdersList: React.FC<WorkOrdersListProps> = ({ workOrders }) => {
    if (!workOrders || workOrders.length === 0) {
        return (
            <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                No work orders found
            </p>
        )
    }

    return (
        <ScrollArea className="h-[400px]">
            <div className="space-y-3">
                {workOrders.map((workOrder) => (
                    <div key={workOrder.id} className="p-4 bg-card dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a]">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium text-foreground dark:text-white">
                                        #{workOrder.work_order_number}
                                    </h4>
                                    <Badge
                                        variant={getWorkOrderStatusVariant(workOrder.status)}
                                        className="capitalize"
                                    >
                                        {workOrder.status}
                                    </Badge>
                                </div>
                                {workOrder.title && (
                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mb-2">
                                        {workOrder.title}
                                    </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(workOrder.created_at)}
                                    </div>
                                    {workOrder.customer_vehicles && (
                                        <div className="flex items-center gap-1">
                                            <Car className="h-3 w-3" />
                                            {formatVehicleInfo(workOrder.customer_vehicles)}
                                        </div>
                                    )}
                                    {workOrder.employees && (
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {formatEmployeeName(workOrder.employees)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {workOrder.total_amount && (
                                <div className="text-right">
                                    <p className="font-semibold text-foreground dark:text-white">
                                        {formatCurrency(workOrder.total_amount)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
