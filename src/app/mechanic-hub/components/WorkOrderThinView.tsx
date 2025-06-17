'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, Calendar } from 'lucide-react'
import { type WorkOrder } from '@/hooks/useWorkOrders'

interface WorkOrderThinViewProps {
  order: WorkOrder
  statusColors: Record<string, string>
  priorityColors: Record<string, string>
  onClick: (order: WorkOrder) => void
}

export function WorkOrderThinView({ order, statusColors, priorityColors, onClick }: WorkOrderThinViewProps) {
  const vehicle = order.customers.customer_vehicles[0]
  const detail = order.repair_order_details[0]

  return (
    <div
      className="px-4 py-2 cursor-pointer hover:bg-[#222222] flex items-center justify-between"
      onClick={() => onClick(order)}
    >
      {/* Vehicle Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">
          {vehicle?.year} {vehicle?.make} {vehicle?.model}
        </div>
        <div className="text-sm text-[#9d9d9d] truncate">
          {order.customers.customer_name}
        </div>
      </div>

      {/* Status & Priority */}
      <div className="flex items-center gap-2 ml-4">
        <Badge className={statusColors[order.status]}>
          {order.status}
        </Badge>
        {detail?.task_priority && (
          <Badge className={priorityColors[detail.task_priority]}>
            {detail.task_priority}
          </Badge>
        )}
      </div>
    </div>
  )
} 