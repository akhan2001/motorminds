'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Archive } from 'lucide-react'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { stripNullTokens } from '@/lib/utils/text'

interface ArchivedWorkOrderCardProps {
    workOrder: WorkOrderWithDetails
    isSelected?: boolean
    onClick?: () => void
}

export const ArchivedWorkOrderCard: React.FC<ArchivedWorkOrderCardProps> = ({ workOrder, isSelected = false, onClick }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20'
            case 'invoiced': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20'
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }
    }

    const titleClean = stripNullTokens(workOrder.title)
    const customerNameClean = stripNullTokens(workOrder.customer?.customer_name)
    const customerEmailClean = stripNullTokens(workOrder.customer?.customer_email)
    const vehicleLineClean = workOrder.vehicle
        ? stripNullTokens(`${workOrder.vehicle.year ?? ''} ${workOrder.vehicle.make ?? ''} ${workOrder.vehicle.model ?? ''}`)
        : ''
    const licensePlateClean = stripNullTokens(workOrder.vehicle?.license_plate)
    const archivedByEmailClean = stripNullTokens(workOrder.archived_by_user?.email)

    return (
        <Card
            className={cn(
                "bg-white dark:bg-[#131313] border-border dark:border-[#2a2a2a] p-4 transition-all hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:shadow-lg",
                isSelected && "border-zinc-500 dark:border-zinc-500 ring-1 ring-red-500/20",
                onClick && "cursor-pointer"
            )}
            onClick={onClick}
        >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <Archive className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-500" />
                    <div>
                        <h3 className="text-sm font-medium text-foreground dark:text-white">
                            {titleClean || 'Untitled Work Order'}
                        </h3>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">#{workOrder.work_order_number}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full border", getStatusColor(workOrder.status))}>
                        {workOrder.status.toUpperCase().replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Separator */}
            <div className="border-t border-border dark:border-gray-800 my-2"></div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Customer Info */}
                <div>
                    <p className="text-xs uppercase mb-0.5 text-muted-foreground dark:text-gray-400">CUSTOMER</p>
                    <p className="text-xs font-medium text-foreground dark:text-white">{customerNameClean || 'Unknown'}</p>
                    {customerEmailClean && (
                        <p className="text-xs text-muted-foreground dark:text-gray-400">{customerEmailClean}</p>
                    )}
                </div>

                {/* Vehicle Info */}
                {vehicleLineClean && (
                    <div>
                        <p className="text-xs uppercase mb-0.5 text-muted-foreground dark:text-gray-400">VEHICLE</p>
                        <p className="text-xs font-medium text-foreground dark:text-white">
                            {vehicleLineClean}
                        </p>
                        {licensePlateClean && (
                            <p className="text-xs text-muted-foreground dark:text-gray-400">Plate: {licensePlateClean}</p>
                        )}
                    </div>
                )}

                {/* Archived Info */}
                <div className="text-right">
                    <p className="text-xs text-muted-foreground dark:text-gray-400 uppercase mb-0.5">
                        ARCHIVED DATE
                    </p>
                    <p className="text-sm font-medium text-foreground dark:text-white">
                        {workOrder.archived_at ? format(new Date(workOrder.archived_at), 'MMM dd, yyyy') : 'Unknown'}
                    </p>
                    {archivedByEmailClean && (
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">by {archivedByEmailClean}</p>
                    )}
                </div>
            </div>

            {/* Footer Row */}
            <div className="flex items-center justify-between pt-1.5 border-t border-border dark:border-gray-800 mt-2">
                <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="bg-gray-700/50 dark:bg-gray-700/50 text-muted-foreground dark:text-gray-400 text-xs px-1 py-0.5">
                        Archived
                    </Badge>
                </div>

                <span className="text-xs text-muted-foreground dark:text-gray-500 capitalize">
                    {workOrder.priority} Priority
                </span>
            </div>
        </Card>
    )
}
