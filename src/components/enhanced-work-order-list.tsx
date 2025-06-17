'use client'

import React, { useState } from 'react'
import { Search, Filter, ChevronDown, ChevronUp, LayoutGrid, List, LayoutList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkOrders, useFilteredWorkOrders, type WorkOrder } from '@/hooks/useWorkOrders'
import { WorkOrderThinView } from '@/app/mechanic-hub/components/WorkOrderThinView'
import { WorkOrderNormalView } from '@/app/mechanic-hub/components/WorkOrderNormalView'
import { WorkOrderCardView } from '@/app/mechanic-hub/components/WorkOrderCardView'
import { TaskDetailsModal, type DetailedRepairOrder } from '@/components/task-details-modal'

interface EnhancedWorkOrderListProps {
  shopId: string
  onWorkOrderClick?: (workOrder: WorkOrder) => void
}

const statusColors = {
  'Pending': 'bg-[#b22222]',
  'In Progress': 'bg-[#d6cd24]',
  'Waiting on Customer': 'bg-[#9d9d9d]',
  'Completed': 'bg-[#1eb386]',
  'Cancelled': 'bg-[#e23232]'
}

const priorityColors = {
  'High': 'bg-[#b22222]',
  'Medium': 'bg-[#d6cd24]',
  'Low': 'bg-[#1eb386]'
}

type ViewType = 'thin' | 'normal' | 'card'

export function EnhancedWorkOrderList({ shopId, onWorkOrderClick }: EnhancedWorkOrderListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Pending': true,
    'In Progress': true,
    'Waiting on Customer': true,
    'Completed': true,
    'Cancelled': true
  })
  const [expandedWorkOrder, setExpandedWorkOrder] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [technicianFilter, setTechnicianFilter] = useState<string>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all')
  const [viewType, setViewType] = useState<ViewType>('normal')
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<DetailedRepairOrder | null>(null)

  const { data: workOrders, isLoading } = useWorkOrders(shopId)
  const filteredWorkOrders = useFilteredWorkOrders(
    workOrders,
    searchQuery,
    statusFilter,
    technicianFilter,
    dateRangeFilter
  )

  const toggleGroup = (status: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }

  const toggleWorkOrder = (workOrderId: string) => {
    setExpandedWorkOrder(expandedWorkOrder === workOrderId ? null : workOrderId)
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

  const renderWorkOrder = (order: WorkOrder) => {
    const props = {
      order,
      statusColors,
      priorityColors,
      onClick: () => handleWorkOrderClick(order),
      onWorkOrderClick
    }

    switch (viewType) {
      case 'thin':
        return <WorkOrderThinView key={order.id} {...props} />
      case 'card':
        return <WorkOrderCardView key={order.id} {...props} />
      default:
        return (
          <WorkOrderNormalView
            key={order.id}
            {...props}
            isExpanded={expandedWorkOrder === order.id}
            onToggleExpand={toggleWorkOrder}
          />
        )
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-[#1A1A1A] rounded-lg">
        {/* Header with search, filters, and view options */}
        <div className="p-4 border-b border-[#222222]">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9d9d9d] h-4 w-4" />
              <Input
                placeholder="Search by VIN, Customer, or Vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#222222] border-[#333333] text-white placeholder-[#9d9d9d]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-[#222222] border-[#333333] text-white">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#222222] border-[#333333]">
                <SelectItem value="all" className="text-white">All Statuses</SelectItem>
                {Object.keys(statusColors).map(status => (
                  <SelectItem key={status} value={status} className="text-white">{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
              <SelectTrigger className="w-[180px] bg-[#222222] border-[#333333] text-white">
                <SelectValue placeholder="Filter by Technician" />
              </SelectTrigger>
              <SelectContent className="bg-[#222222] border-[#333333]">
                <SelectItem value="all" className="text-white">All Technicians</SelectItem>
                {Array.from(new Set<string>(workOrders?.flatMap((order: WorkOrder) => 
                  order.repair_order_details
                    .map((detail) => detail.Assigned_to)
                    .filter((tech): tech is string => tech !== null)
                ) || [])).map((tech) => (
                  <SelectItem key={tech} value={tech} className="text-white">{tech}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-[180px] bg-[#222222] border-[#333333] text-white">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-[#222222] border-[#333333]">
                <SelectItem value="all" className="text-white">All Time</SelectItem>
                <SelectItem value="today" className="text-white">Today</SelectItem>
                <SelectItem value="week" className="text-white">This Week</SelectItem>
                <SelectItem value="month" className="text-white">This Month</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={viewType === 'thin' ? 'bg-[#222222]' : ''}
                onClick={() => setViewType('thin')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={viewType === 'normal' ? 'bg-[#222222]' : ''}
                onClick={() => setViewType('normal')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={viewType === 'card' ? 'bg-[#222222]' : ''}
                onClick={() => setViewType('card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Work Orders List */}
        <div className="flex-1 overflow-auto">
          {Object.entries(filteredWorkOrders).map(([status, orders]) => (
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
                    {viewType === 'card' ? (
                      <div className="grid grid-cols-1 gap-4 p-4">
                        {orders.map((order) => renderWorkOrder(order))}
                      </div>
                    ) : (
                      <div className="divide-y divide-[#222222]">
                        {orders.map((order) => renderWorkOrder(order))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
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