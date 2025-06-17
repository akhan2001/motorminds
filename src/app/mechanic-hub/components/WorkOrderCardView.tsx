'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, User, Car, Wrench, DollarSign, Phone, Mail, ChevronDown, ChevronUp, FileText, AlertCircle } from 'lucide-react'
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

export function WorkOrderCardView({ order, statusColors, priorityColors, onClick }: WorkOrderCardViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const detail = order.repair_order_details[0]
  const vehicle = order.vehicle_id && order.customers?.customer_vehicles 
    ? order.customers.customer_vehicles.find(v => v.id === order.vehicle_id)
    : order.customers?.customer_vehicles?.[0]

  const handleClick = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="bg-[#222222] rounded-lg overflow-hidden border border-[#333333] hover:border-[#444444] transition-all duration-200 hover:bg-[#252525]">
      <div className="p-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={statusColors[order.status]}>
                {order.status}
              </Badge>
              {detail?.task_priority && (
                <Badge className={priorityColors[detail.task_priority]}>
                  {detail.task_priority}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">
              {vehicle?.year} {vehicle?.make} {vehicle?.model}
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-[#9d9d9d] hover:text-white border-[#444444] hover:bg-zinc-800 shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            View Details
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
          {/* Customer Info */}
          <div className="col-span-2 md:col-span-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#9d9d9d]">
                <User className="h-4 w-4" />
                <span className="font-medium text-white">{order.customers.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-[#9d9d9d]">
                <Phone className="h-4 w-4" />
                <span>{order.customers.customer_phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-[#9d9d9d]">
                <Mail className="h-4 w-4" />
                <span className="truncate">{order.customers.customer_email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="col-span-2 md:col-span-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#9d9d9d]">
                <Car className="h-4 w-4" />
                <span className="font-medium text-white">Vehicle Details</span>
              </div>
              <div className="flex items-center gap-2 text-[#9d9d9d]">
                <span className="text-sm">VIN: {vehicle?.vin || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-[#9d9d9d]">
                <span className="text-sm">Assigned: {detail?.Assigned_to || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div className="col-span-2 md:col-span-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#9d9d9d]">
                <Wrench className="h-4 w-4" />
                <span className="font-medium text-white">Service Details</span>
              </div>
              <div className="flex items-center gap-2 text-[#9d9d9d]">
                <DollarSign className="h-4 w-4" />
                <span>Total: ${detail?.cost || '0'}</span>
              </div>
              <div className="flex items-center gap-2 text-[#9d9d9d]">
                <Clock className="h-4 w-4" />
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-4 bg-[#1A1A1A] rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[#9d9d9d]">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium text-white">Description</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#9d9d9d] hover:text-white hover:bg-zinc-800 h-8 w-8 p-0"
              onClick={handleClick}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-white/80 line-clamp-2">{detail?.description || 'No description'}</p>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-[#333333]"
              >
                {/* Additional Service Details */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 text-[#9d9d9d] mb-2">
                      <Wrench className="h-4 w-4" />
                      <span className="font-medium text-white">Labour Details</span>
                    </div>
                    <p className="text-[#9d9d9d]">{detail?.labour || 'No labour details'}</p>
                  </div>
                  
                  {detail?.completed_at && (
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 text-[#9d9d9d]">
                        <Calendar className="h-4 w-4" />
                        <span>Completed: {new Date(detail.completed_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                {detail?.notes && (
                  <div className="bg-[#161616] rounded-md p-3 mt-2">
                    <div className="flex items-center gap-2 text-[#9d9d9d] mb-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium text-white">Notes</span>
                    </div>
                    <p className="text-sm text-white/80 whitespace-pre-wrap">{detail.notes}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 