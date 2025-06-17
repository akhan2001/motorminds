'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, User, Car, Wrench, DollarSign, Phone, Mail } from 'lucide-react'
import { type WorkOrder } from '@/hooks/useWorkOrders'
import { Button } from '@/components/ui/button'

interface WorkOrderCardViewProps {
  order: WorkOrder
  statusColors: Record<string, string>
  priorityColors: Record<string, string>
  onClick: () => void
  onWorkOrderClick?: (workOrder: WorkOrder) => void
}

export function WorkOrderCardView({ 
  order, 
  statusColors, 
  priorityColors, 
  onClick,
  onWorkOrderClick
}: WorkOrderCardViewProps) {
  return (
    <div 
      className="bg-[#1A1A1A] rounded-lg p-6 cursor-pointer hover:bg-[#222222] transition-colors"
      onClick={onClick}
    >
      {/* Header with Status and Priority */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-2">
          <Badge className={statusColors[order.status]}>
            {order.status}
          </Badge>
          <Badge className={priorityColors[order.repair_order_details[0]?.task_priority || 'Medium']}>
            {order.repair_order_details[0]?.task_priority || 'Medium'} Priority
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[#9d9d9d] text-sm">
          <Calendar className="h-4 w-4" />
          <span>{new Date(order.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Left Section - Vehicle & Customer Info */}
        <div className="flex-1 space-y-6">
          {/* Vehicle Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#9d9d9d]">
              <Car className="h-4 w-4" />
              <span className="text-sm">Vehicle Information</span>
            </div>
            <div className="bg-[#222222] rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#9d9d9d] text-sm">Year</p>
                  <p className="text-white">{order.customers.customer_vehicles[0]?.year || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#9d9d9d] text-sm">Make</p>
                  <p className="text-white">{order.customers.customer_vehicles[0]?.make || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#9d9d9d] text-sm">Model</p>
                  <p className="text-white">{order.customers.customer_vehicles[0]?.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#9d9d9d] text-sm">VIN</p>
                  <p className="text-white">{order.customers.customer_vehicles[0]?.vin || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#9d9d9d]">
              <User className="h-4 w-4" />
              <span className="text-sm">Customer Information</span>
            </div>
            <div className="bg-[#222222] rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-[#9d9d9d] text-sm">Name</p>
                  <p className="text-white">{order.customers.customer_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#9d9d9d]" />
                  <p className="text-white">{order.customers.customer_phone || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#9d9d9d]" />
                  <p className="text-white">{order.customers.customer_email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Service Details */}
        <div className="flex-1 space-y-6">
          {/* Service Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#9d9d9d]">
              <Wrench className="h-4 w-4" />
              <span className="text-sm">Service Details</span>
            </div>
            <div className="bg-[#222222] rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <p className="text-[#9d9d9d] text-sm">Description</p>
                  <p className="text-white">{order.repair_order_details[0]?.description || 'No description provided'}</p>
                </div>
                <div>
                  <p className="text-[#9d9d9d] text-sm">Labour</p>
                  <p className="text-white">{order.repair_order_details[0]?.labour || 'No labour details'}</p>
                </div>
                <div>
                  <p className="text-[#9d9d9d] text-sm">Parts</p>
                  <p className="text-white">{order.repair_order_details[0]?.parts || 'No parts listed'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost and Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#9d9d9d]">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Cost and Time</span>
            </div>
            <div className="bg-[#222222] rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#9d9d9d] text-sm">Labour Cost</p>
                  <p className="text-white">${order.repair_order_details[0]?.labour_cost || '0.00'}</p>
                </div>
                <div>
                  <p className="text-[#9d9d9d] text-sm">Parts Cost</p>
                  <p className="text-white">${order.repair_order_details[0]?.parts_cost || '0.00'}</p>
                </div>
                <div>
                  <p className="text-[#9d9d9d] text-sm">Total Cost</p>
                  <p className="text-white">${order.repair_order_details[0]?.cost || '0.00'}</p>
                </div>
                <div>
                  <p className="text-[#9d9d9d] text-sm">Created</p>
                  <p className="text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Status and Actions */}
        <div className="w-48 space-y-6">
          {/* Status Badges */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#9d9d9d]">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Status</span>
            </div>
            <div className="bg-[#222222] rounded-lg p-4">
              <div className="space-y-3">
                <Badge className={statusColors[order.status]}>
                  {order.status}
                </Badge>
                <Badge className={priorityColors[order.repair_order_details[0]?.task_priority || 'Medium']}>
                  {order.repair_order_details[0]?.task_priority || 'Medium'} Priority
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#9d9d9d]">
              <span className="text-sm">Actions</span>
            </div>
            <div className="bg-[#222222] rounded-lg p-4">
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-white border-[#333333] hover:bg-[#333333]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWorkOrderClick?.(order);
                  }}
                >
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-white border-[#333333] hover:bg-[#333333]"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle assign technician
                  }}
                >
                  Assign Technician
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-white border-[#333333] hover:bg-[#333333]"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle update status
                  }}
                >
                  Update Status
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 