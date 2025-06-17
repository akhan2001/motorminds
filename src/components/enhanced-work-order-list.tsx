'use client'

import React, { useState } from 'react'
import { Search, Filter, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkOrders, useFilteredWorkOrders, type WorkOrder } from '@/hooks/useWorkOrders'
import { WorkOrderCardView } from '@/app/mechanic-hub/components/WorkOrderCardView'
import { TaskDetailsModal, type DetailedRepairOrder } from '@/components/task-details-modal'
import { WorkOrderThinView } from '@/app/mechanic-hub/components/WorkOrderThinView'

interface EnhancedWorkOrderListProps {
  shopId: string
  onWorkOrderClick?: (workOrder: WorkOrder) => void
}

const statusColors = {
  'Pending': 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  'In Progress': 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  'Waiting on Customer': 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
  'Completed': 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  'Cancelled': 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
}

const priorityColors = {
  'High': 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  'Medium': 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  'Low': 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
}

// Add status order constant
const STATUS_ORDER = ['Pending', 'In Progress', 'Completed', 'Waiting on Customer', 'Cancelled'];

export function EnhancedWorkOrderList({ shopId, onWorkOrderClick }: EnhancedWorkOrderListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Pending': true,
    'In Progress': true,
    'Completed': false,
    'Waiting on Customer': false,
    'Cancelled': false
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<DetailedRepairOrder | null>(null)

  const { data: workOrders, isLoading } = useWorkOrders(shopId)
  const filteredWorkOrders = useFilteredWorkOrders(
    workOrders,
    searchQuery,
    statusFilter,
    'all', // removed technician filter
    'all'  // removed date range filter
  )

  const toggleGroup = (status: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }

  const handleWorkOrderClick = (order: WorkOrder) => {
    // Find the matching vehicle using vehicle_id
    const matchingVehicle = order.vehicle_id && order.customers?.customer_vehicles 
      ? order.customers.customer_vehicles.find(v => v.id === order.vehicle_id)
      : null;
    // Fallback to first vehicle if no matching vehicle found
    const vehicleToUse = matchingVehicle || order.customers?.customer_vehicles?.[0];

    // Convert WorkOrder to DetailedRepairOrder format
    const detailedOrder: DetailedRepairOrder = {
      id: order.id, // This is the repair_order_id
      created_at: order.created_at,
      status: order.status,
      vehicle_id: order.vehicle_id,
      repair_order_details: order.repair_order_details.map(detail => ({
        id: detail.id,
        repair_order_id: order.id, // Add the repair_order_id to link back to the main order
        mechanic_id: detail.mechanic_id || undefined,
        labour: detail.labour || undefined,
        parts: detail.parts || undefined,
        notes: detail.notes || undefined,
        cost: detail.cost?.toString() || undefined,
        mileage: detail.mileage || undefined,
        task_priority: detail.task_priority || undefined,
        description: detail.description || undefined,
        labour_cost: detail.labour_cost?.toString() || undefined,
        parts_cost: detail.parts_cost?.toString() || undefined,
        completed_at: detail.completed_at || undefined,
        Assigned_to: detail.Assigned_to || undefined
      })),
      customers: order.customers ? {
        id: order.customers.id,
        customer_name: order.customers.customer_name || undefined,
        customer_email: order.customers.customer_email || undefined,
        customer_phone: order.customers.customer_phone || undefined,
        customer_vehicles: order.customers.customer_vehicles?.map(vehicle => ({
          id: vehicle.id,
          year: vehicle.year?.toString() || undefined,
          make: vehicle.make || undefined,
          model: vehicle.model || undefined,
          vin: vehicle.vin || undefined
        }))
      } : undefined
    }
    setSelectedWorkOrder(detailedOrder)
  }

  const handleWorkOrderSave = (updated: DetailedRepairOrder) => {
    // Here you would typically update the work order in your database
    // For now, we'll just close the modal
    setSelectedWorkOrder(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b22222]"></div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full bg-[#1A1A1A]">
        {/* Header */}
        <div className="p-4 border-b border-[#222222]">
          <div className="flex flex-col gap-4">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9d9d9d]" />
                <Input
                  placeholder="Search by VIN, Customer, or Vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#222222] border-[#333333] text-white placeholder:text-[#9d9d9d]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-[#222222] border-[#333333] text-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Waiting on Customer">Waiting on Customer</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 border border-[#333333] rounded-md p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-3 ${viewMode === 'card' ? 'bg-[#333333] text-white' : 'text-[#9d9d9d]'}`}
                  onClick={() => setViewMode('card')}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Cards
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-3 ${viewMode === 'list' ? 'bg-[#333333] text-white' : 'text-[#9d9d9d]'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Work Orders List */}
        <div className="flex-1 overflow-auto">
          {STATUS_ORDER.map((status) => {
            const orders = filteredWorkOrders[status] || [];
            if (orders.length === 0) return null;
            
            return (
              <div key={status} className="border-b border-[#222222] last:border-b-0">
                {/* Group Header */}
                <div 
                  className="sticky top-0 bg-[#1A1A1A] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#222222]"
                  onClick={() => toggleGroup(status)}
                >
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[status as keyof typeof statusColors]}>
                      {status}
                    </Badge>
                    <span className="text-sm text-[#9d9d9d]">({orders.length})</span>
                  </div>
                  {expandedGroups[status] ? (
                    <ChevronUp className="h-4 w-4 text-[#9d9d9d]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#9d9d9d]" />
                  )}
                </div>

                {/* Group Content */}
                <AnimatePresence>
                  {expandedGroups[status] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`grid gap-4 p-4 ${viewMode === 'card' ? 'grid-cols-1' : 'grid-cols-1'}`}>
                        {orders.map((order) => (
                          viewMode === 'card' ? (
                            <WorkOrderCardView
                              key={order.id}
                              order={order}
                              statusColors={statusColors}
                              priorityColors={priorityColors}
                              onClick={() => handleWorkOrderClick(order)}
                              onWorkOrderClick={onWorkOrderClick}
                            />
                          ) : (
                            <WorkOrderThinView
                              key={order.id}
                              order={order}
                              statusColors={statusColors}
                              priorityColors={priorityColors}
                              onClick={() => handleWorkOrderClick(order)}
                            />
                          )
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedWorkOrder && (
        <TaskDetailsModal
          task={selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
          onSave={handleWorkOrderSave}
          shopId={shopId}
        />
      )}
    </>
  )
} 