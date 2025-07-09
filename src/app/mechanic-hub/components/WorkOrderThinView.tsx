'use client'

import { Badge } from '@/components/ui/badge'
import { User, Car, DollarSign } from 'lucide-react'
import { type WorkOrder } from '@/hooks/use-work-orders'

interface WorkOrderThinViewProps {
    order: WorkOrder
    statusColors: Record<string, string>
    priorityColors: Record<string, string>
    onClick: () => void
}

export function WorkOrderThinView({ order, statusColors, priorityColors, onClick }: WorkOrderThinViewProps) {
    const detail = order.repair_order_details[0]
    const vehicle = order.vehicle_id && order.customers?.customer_vehicles
        ? order.customers.customer_vehicles.find(v => v.id === order.vehicle_id)
        : order.customers?.customer_vehicles?.[0]

    return (
        <div
            className="bg-[#222222] rounded-lg overflow-hidden border border-[#333333] hover:border-[#444444] transition-all duration-200 hover:bg-[#252525] cursor-pointer"
            onClick={onClick}
        >
            <div className="p-3 flex items-center justify-between gap-4">
                {/* Status & Priority */}
                <div className="flex items-center gap-2 min-w-[180px]">
                    <Badge className={statusColors[order.status]}>
                        {order.status}
                    </Badge>
                    {detail?.task_priority && (
                        <Badge className={priorityColors[detail.task_priority]}>
                            {detail.task_priority}
                        </Badge>
                    )}
                </div>

                {/* Vehicle Info */}
                <div className="flex items-center gap-2 text-[#9d9d9d] min-w-[200px]">
                    <Car className="h-4 w-4" />
                    <span className="text-white truncate">
                        {vehicle?.year} {vehicle?.make} {vehicle?.model}
                    </span>
                </div>

                {/* Customer Info with Notes and Labor */}
                <div className="flex items-center gap-2 text-[#9d9d9d] flex-1">
                    <User className="h-4 w-4" />
                    <div className="flex flex-col">
                        <span className="text-white truncate">{order.customers.customer_name}</span>
                        <div className="flex gap-4 text-xs">
                            {detail?.notes && (
                                <span className="text-[#9d9d9d] truncate max-w-[200px]">
                                    Notes: {detail.notes}
                                </span>
                            )}
                            {detail?.labour && (
                                <span className="text-[#9d9d9d] truncate max-w-[200px]">
                                    Labor: {detail.labour}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cost */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[#9d9d9d]">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-white">${detail?.cost || '0'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
} 