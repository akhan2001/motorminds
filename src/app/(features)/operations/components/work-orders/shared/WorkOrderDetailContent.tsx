'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Wrench, Calendar, DollarSign, User, Car, Package, Clock, MapPin, Tag, FileText, Archive, Receipt, Undo2 } from 'lucide-react'
import { format } from 'date-fns'
import type { WorkOrderWithDetails, WorkOrderItem } from '../../../types/work-order'
import { calculateInvoiceTotals } from '../../../../financials/lib/invoice-calculations'
import { formatCurrency } from '@/lib/utils/currency'
import { useExpensesByWorkOrder } from '@/app/(features)/expenses/hooks/use-expenses'
import { ExpenseSummaryCard } from '@/app/(features)/expenses/components/ExpenseSummaryCard'

interface WorkOrderDetailContentProps {
    workOrder: WorkOrderWithDetails
    workOrderItems: WorkOrderItem[]
    itemsLoading?: boolean
}

// Badge helper functions
export const getWorkOrderStatusBadge = (status: string | null | undefined) => {
    if (!status) {
        return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20">N/A</Badge>
    }
    const statusLower = status.toLowerCase()
    if (statusLower === 'completed') {
        return <Badge className="bg-green-500/10 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-500/20">Completed</Badge>
    } else if (statusLower === 'invoiced') {
        return <Badge className="bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20">Invoiced</Badge>
    } else if (statusLower === 'cancelled') {
        return <Badge className="bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/20">Cancelled</Badge>
    } else if (statusLower === 'in_progress' || statusLower === 'in-progress' || statusLower === 'in progress') {
        return <Badge className="bg-yellow-500/10 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-500/20">In Progress</Badge>
    } else if (statusLower === 'ready') {
        return <Badge className="bg-purple-500/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/20">Ready</Badge>
    } else if (statusLower === 'pending') {
        return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20">Pending</Badge>
    } else if (statusLower === 'approved') {
        return <Badge className="bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20">Approved</Badge>
    } else if (statusLower === 'waiting_parts' || statusLower === 'waiting-parts' || statusLower === 'waiting parts') {
        return <Badge className="bg-orange-500/10 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/20">Waiting Parts</Badge>
    } else if (statusLower === 'waiting_customer' || statusLower === 'waiting-customer' || statusLower === 'waiting customer') {
        return <Badge className="bg-orange-500/10 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/20">Waiting Customer</Badge>
    } else if (statusLower === 'on_hold' || statusLower === 'on-hold' || statusLower === 'on hold') {
        return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20">On Hold</Badge>
    }
    return <Badge className="bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20">{status}</Badge>
}

export const getWorkOrderPriorityBadge = (priority: string | null | undefined) => {
    if (!priority) {
        return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20">Medium</Badge>
    }
    const priorityLower = priority.toLowerCase()
    if (priorityLower === 'urgent') {
        return <Badge className="bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/20">Urgent</Badge>
    } else if (priorityLower === 'high') {
        return <Badge className="bg-orange-500/10 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/20">High</Badge>
    } else if (priorityLower === 'low') {
        return <Badge className="bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20">Low</Badge>
    }
    return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20">Medium</Badge>
}

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'MMM d, yyyy')
}

const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'MMM d, yyyy h:mm a')
}

export const WorkOrderDetailContent: React.FC<WorkOrderDetailContentProps> = ({
    workOrder,
    workOrderItems,
    itemsLoading = false
}) => {
    // Calculate financial summary from work order items
    const calculations = workOrderItems.length > 0 ? calculateInvoiceTotals(workOrderItems as any) : null
    const TAX_RATE = 0.13

    // Fetch expenses from the expenses table
    const { data: expenses = [], isLoading: expensesLoading } = useExpensesByWorkOrder(workOrder.id)

    return (
        <div className="space-y-6">
            {/* Customer Information */}
            {workOrder.customer_type === 'walk_in' ? (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Customer</h3>
                        <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                            Walk-in
                        </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">
                        Walk-in customer (no customer record)
                    </div>
                </div>
            ) : workOrder.customer ? (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Customer</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="text-foreground dark:text-white">{workOrder.customer.customer_name}</div>
                        {workOrder.customer.customer_email && (
                            <div className="text-muted-foreground dark:text-gray-400">{workOrder.customer.customer_email}</div>
                        )}
                        {workOrder.customer.customer_phone && (
                            <div className="text-muted-foreground dark:text-gray-400">{workOrder.customer.customer_phone}</div>
                        )}
                        {workOrder.customer.customer_address && (
                            <div className="text-muted-foreground dark:text-gray-400 flex items-start gap-1">
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {workOrder.customer.customer_address}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Vehicle Information */}
            {workOrder.vehicle ? (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Vehicle</h3>
                    </div>
                    <div className="text-sm space-y-1">
                        <div className="text-foreground dark:text-white">
                            {workOrder.vehicle.year} {workOrder.vehicle.make} {workOrder.vehicle.model}
                        </div>
                        {workOrder.vehicle.license_plate && (
                            <div className="text-muted-foreground dark:text-gray-400">
                                License: {workOrder.vehicle.license_plate}
                            </div>
                        )}
                        {workOrder.vehicle.vin && (
                            <div className="text-muted-foreground dark:text-gray-400">
                                VIN: {workOrder.vehicle.vin}
                            </div>
                        )}
                        {workOrder.vehicle.color && (
                            <div className="text-muted-foreground dark:text-gray-400">
                                Color: {workOrder.vehicle.color}
                            </div>
                        )}
                        {workOrder.vehicle.mileage && (
                            <div className="text-muted-foreground dark:text-gray-400">
                                Mileage: {workOrder.vehicle.mileage.toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>
            ) : workOrder.walk_in_vehicle_info ? (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Vehicle</h3>
                    </div>
                    <div className="text-sm space-y-1">
                        <div className="text-foreground dark:text-white">
                            {workOrder.walk_in_vehicle_info.year} {workOrder.walk_in_vehicle_info.make} {workOrder.walk_in_vehicle_info.model}
                        </div>
                        {workOrder.walk_in_vehicle_info.license_plate && (
                            <div className="text-muted-foreground dark:text-gray-400">
                                License: {workOrder.walk_in_vehicle_info.license_plate}
                            </div>
                        )}
                        {workOrder.walk_in_vehicle_info.vin && (
                            <div className="text-muted-foreground dark:text-gray-400">
                                VIN: {workOrder.walk_in_vehicle_info.vin}
                            </div>
                        )}
                        {workOrder.walk_in_vehicle_info.color && (
                            <div className="text-muted-foreground dark:text-gray-400">
                                Color: {workOrder.walk_in_vehicle_info.color}
                            </div>
                        )}
                        {workOrder.walk_in_vehicle_info.mileage && (
                            <div className="text-muted-foreground dark:text-gray-400">
                                Mileage: {Number(workOrder.walk_in_vehicle_info.mileage).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Technician Information */}
            {workOrder.technician && (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Assigned Technician</h3>
                    </div>
                    <div className="text-sm text-foreground dark:text-white">
                        {workOrder.technician.first_name} {workOrder.technician.last_name}
                    </div>
                </div>
            )}

            {/* Financial Summary */}
            {calculations && workOrderItems.length > 0 && (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Financial Summary</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        {calculations.labourTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Labor:</span>
                                <span className="text-foreground dark:text-white">{formatCurrency(calculations.labourTotal)}</span>
                            </div>
                        )}
                        {calculations.partsTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Parts:</span>
                                <span className="text-foreground dark:text-white">{formatCurrency(calculations.partsTotal)}</span>
                            </div>
                        )}
                        {calculations.servicesTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Services:</span>
                                <span className="text-foreground dark:text-white">{formatCurrency(calculations.servicesTotal)}</span>
                            </div>
                        )}
                        {calculations.feesTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Fees:</span>
                                <span className="text-foreground dark:text-white">{formatCurrency(calculations.feesTotal)}</span>
                            </div>
                        )}
                        {calculations.discountsTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-red-600 dark:text-red-400">Discounts:</span>
                                <span className="text-red-600 dark:text-red-400">-{formatCurrency(calculations.discountsTotal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground dark:text-gray-400">Subtotal:</span>
                            <span className="text-foreground dark:text-white">{formatCurrency(calculations.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground dark:text-gray-400">Tax ({Math.round(TAX_RATE * 100)}%):</span>
                            <span className="text-foreground dark:text-white">{formatCurrency(calculations.subtotal * TAX_RATE)}</span>
                        </div>
                        <Separator className="bg-border dark:bg-[#2a2a2a]" />
                        <div className="flex justify-between text-lg font-semibold">
                            <span className="text-foreground dark:text-white">Total:</span>
                            <span className="text-foreground dark:text-white">{formatCurrency(calculations.subtotal * (1 + TAX_RATE))}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Expenses Card */}
            {expensesLoading ? (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Expenses</h3>
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">Loading expenses...</div>
                </div>
            ) : expenses.length > 0 ? (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Expenses</h3>
                        <Badge variant="outline" className="text-xs">
                            {expenses.length}
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        {expenses.map((expense: any) => {
                            const isRefunded = (expense.refund_amount && expense.refund_amount > 0) || expense.resolution_type === 'returned'
                            return (
                                <div key={expense.id} className="relative">
                                    {isRefunded && (
                                        <div className="absolute top-2 right-2 z-10">
                                            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 flex items-center gap-1">
                                                <Undo2 className="h-3 w-3" />
                                                Refunded
                                            </Badge>
                                        </div>
                                    )}
                                    <div className={isRefunded ? 'opacity-60' : ''}>
                                        <ExpenseSummaryCard expense={expense} />
                                    </div>
                                    {isRefunded && expense.refund_amount > 0 && (
                                        <div className="mt-2 text-right text-xs text-green-600 dark:text-green-400">
                                            Refund: {formatCurrency(expense.refund_amount)}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        <Separator className="bg-border dark:bg-[#2a2a2a]" />
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total Expenses:</span>
                            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                {formatCurrency(
                                    expenses.reduce((sum: number, exp: any) => {
                                        const refund = exp.refund_amount || 0
                                        return sum + Math.max(0, exp.total - refund)
                                    }, 0)
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Work Order Items */}
            {itemsLoading ? (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Work Order Items</h3>
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">Loading items...</div>
                </div>
            ) : workOrderItems.length > 0 ? (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Work Order Items</h3>
                    </div>
                    <div className="space-y-3">
                        {/* Filter out expense items - they're shown in the Expenses Card above */}
                        {workOrderItems
                            .filter((item: any) => item.item_type !== 'expense')
                            .map((item: any, index: number) => {
                            const isActive = item.active !== false
                            const itemTotal = item.item_type === 'labor' 
                                ? (item.labor_hours || 0) * (item.unit_price || 0)
                                : (item.quantity || 0) * (item.unit_price || 0)
                            
                            return (
                                <div key={item.id || index} className="bg-background dark:bg-[#0f0f0f] rounded p-3 border border-border dark:border-[#2a2a2a]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs capitalize text-foreground dark:text-white">
                                                    {item.item_type}
                                                </Badge>
                                                {!isActive && (
                                                    <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                                                        Declined
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-foreground dark:text-white text-sm font-medium">{item.description}</div>
                                            <div className="text-muted-foreground dark:text-gray-400 text-xs mt-1 space-y-0.5">
                                                {item.item_type === 'labor' ? (
                                                    <div>
                                                        <span>{item.labor_hours || 0} hours @ {formatCurrency(item.unit_price || 0)}/hr</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <span>Qty: {item.quantity || 0} × {formatCurrency(item.unit_price || 0)} = {formatCurrency(itemTotal)}</span>
                                                        </div>
                                                        {item.item_type === 'part' && item.total_cost && item.total_cost > 0 && (
                                                            <div>
                                                                <span className="font-medium">Cost:</span> {formatCurrency(item.total_cost)}
                                                            </div>
                                                        )}
                                                        {item.part_number && (
                                                            <div>
                                                                <span className="font-medium">Part #:</span> {item.part_number}
                                                            </div>
                                                        )}
                                                        {item.supplier && (
                                                            <div>
                                                                <span className="font-medium">Supplier:</span> {item.supplier}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`text-sm font-medium ${!isActive ? 'text-red-600 dark:text-red-400' : 'text-foreground dark:text-white'}`}>
                                            {formatCurrency(itemTotal)}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : null}

            {/* Tags */}
            {workOrder.tags && workOrder.tags.length > 0 && (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                        <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-foreground dark:text-white font-medium">Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {workOrder.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Dates */}
            <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <h3 className="text-foreground dark:text-white font-medium">Important Dates</h3>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground dark:text-gray-400">Created:</span>
                        <span className="text-foreground dark:text-white">{formatDateTime(workOrder.created_at)}</span>
                    </div>
                    {workOrder.started_at && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground dark:text-gray-400">Started:</span>
                            <span className="text-foreground dark:text-white">{formatDateTime(workOrder.started_at)}</span>
                        </div>
                    )}
                    {workOrder.completed_at && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground dark:text-gray-400">Completed:</span>
                            <span className="text-foreground dark:text-white">{formatDateTime(workOrder.completed_at)}</span>
                        </div>
                    )}
                    {workOrder.archived_at && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground dark:text-gray-400">Archived:</span>
                            <span className="text-foreground dark:text-white">{formatDateTime(workOrder.archived_at)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground dark:text-gray-400">Updated:</span>
                        <span className="text-foreground dark:text-white">{formatDateTime(workOrder.updated_at)}</span>
                    </div>
                </div>
            </div>

            {/* Customer Requests */}
            {workOrder.description && (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <h3 className="text-foreground dark:text-white font-medium mb-2">Customer Requests</h3>
                    <p className="text-muted-foreground dark:text-gray-400 text-sm whitespace-pre-wrap">{workOrder.description}</p>
                </div>
            )}

            {/* Recommendation */}
            {workOrder.notes && (
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <h3 className="text-foreground dark:text-white font-medium mb-2">Recommendation</h3>
                    <p className="text-muted-foreground dark:text-gray-400 text-sm whitespace-pre-wrap">{workOrder.notes}</p>
                </div>
            )}
        </div>
    )
}
