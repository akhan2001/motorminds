'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, User, Car, Wrench, DollarSign, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { type WorkOrder } from '@/hooks/useWorkOrders'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface WorkOrderCardViewProps {
  order: WorkOrder
  statusColors: Record<string, string>
  priorityColors: Record<string, string>
  onClick: () => void
  onWorkOrderClick?: (workOrder: WorkOrder) => void
}

export function WorkOrderCardView({ order, statusColors, priorityColors, onClick, onWorkOrderClick }: WorkOrderCardViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const detail = order.repair_order_details[0]
  const vehicle = order.vehicle_id && order.customers?.customer_vehicles 
    ? order.customers.customer_vehicles.find(v => v.id === order.vehicle_id)
    : order.customers?.customer_vehicles?.[0]

  const handleClick = () => {
    setIsExpanded(!isExpanded)
  }

  const handleDoubleClick = () => {
    onClick()
  }

  return (
    <div 
      className="bg-[#1A1A1A] rounded-lg overflow-hidden border border-[#222222] hover:border-[#333333] transition-colors"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={statusColors[order.status]}>
                {order.status}
              </Badge>
              {detail?.task_priority && (
                <Badge className={priorityColors[detail.task_priority]}>
                  {detail.task_priority}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {vehicle?.year} {vehicle?.make} {vehicle?.model}
            </h3>
            <p className="text-[#9d9d9d]">{order.customers.customer_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#9d9d9d] hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                onWorkOrderClick?.(order)
              }}
            >
              View Details
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[#9d9d9d]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#9d9d9d]" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-[#9d9d9d]">
            <Car className="h-4 w-4" />
            <span>{vehicle?.vin || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-[#9d9d9d]">
            <User className="h-4 w-4" />
            <span>{detail?.Assigned_to || 'Unassigned'}</span>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-[#222222]"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-[#9d9d9d]">
                  <Phone className="h-4 w-4" />
                  <span>{order.customers.customer_phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#9d9d9d]">
                  <Mail className="h-4 w-4" />
                  <span>{order.customers.customer_email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#9d9d9d]">
                  <Wrench className="h-4 w-4" />
                  <span>{detail?.description || 'No description'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#9d9d9d]">
                  <DollarSign className="h-4 w-4" />
                  <span>${detail?.cost || '0'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#9d9d9d]">
                  <Clock className="h-4 w-4" />
                  <span>{detail?.labour || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#9d9d9d]">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 