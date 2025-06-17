'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, Calendar } from 'lucide-react'
import { type WorkOrder } from '@/hooks/useWorkOrders'

interface WorkOrderNormalViewProps {
  order: WorkOrder
  statusColors: Record<string, string>
  priorityColors: Record<string, string>
  onClick: (order: WorkOrder) => void
  isExpanded: boolean
  onToggleExpand: (orderId: string) => void
  onWorkOrderClick?: (order: WorkOrder) => void
}

export function WorkOrderNormalView({ 
  order, 
  statusColors, 
  priorityColors, 
  onClick,
  isExpanded,
  onToggleExpand,
  onWorkOrderClick
}: WorkOrderNormalViewProps) {
  const vehicle = order.customers.customer_vehicles[0]
  const detail = order.repair_order_details[0]

  return (
    <div
      className="px-4 py-3 cursor-pointer"
      onClick={() => onToggleExpand(order.id)}
    >
      <div className="flex items-center justify-between">
        {/* Vehicle Info */}
        <div className="flex-1">
          <div className="font-medium text-white">
            {vehicle?.year} {vehicle?.make} {vehicle?.model}
          </div>
          <div className="text-sm text-[#9d9d9d]">
            {order.customers.customer_name}
          </div>
        </div>

        {/* Service Types */}
        <div className="flex-1 mr-4">
          <div className="flex flex-wrap gap-1">
            {detail?.labour && (
              <Badge variant="secondary" className="bg-[#222222] text-[#9d9d9d]">
                {detail.labour}
              </Badge>
            )}
            {detail?.parts && (
              <Badge variant="secondary" className="bg-[#222222] text-[#9d9d9d]">
                {detail.parts}
              </Badge>
            )}
          </div>
        </div>

        {/* Duration & Time */}
        <div className="flex items-center gap-4 mr-4">
          <div className="flex items-center gap-1 text-sm text-[#9d9d9d]">
            <Clock className="h-4 w-4" />
            {detail?.labour_cost ? `$${detail.labour_cost}` : '--'}
          </div>
          <div className="flex items-center gap-1 text-sm text-[#9d9d9d]">
            <Calendar className="h-4 w-4" />
            {new Date(order.created_at).toLocaleTimeString()}
          </div>
        </div>

        {/* Status & Priority */}
        <div className="flex items-center gap-2">
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

      {/* Quick Actions (visible when expanded) */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-[#222222]">
          <div className="flex items-center gap-2">
            <button 
              className="text-sm text-[#9d9d9d] hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                onWorkOrderClick?.(order)
              }}
            >
              View Details
            </button>
            <button 
              className="text-sm text-[#9d9d9d] hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                // Handle assign tech
              }}
            >
              Assign Tech
            </button>
            <button 
              className="text-sm text-[#9d9d9d] hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                // Handle update status
              }}
            >
              Update Status
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 