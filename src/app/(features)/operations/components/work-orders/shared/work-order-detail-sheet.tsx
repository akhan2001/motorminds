'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Wrench, Calendar, DollarSign, User, Car, Package, Clock, MapPin, Tag, FileText, Archive } from 'lucide-react'
import { format } from 'date-fns'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import { useWorkOrderItems } from '../../../hooks/use-work-order-items'
import { calculateInvoiceTotals } from '../../../../financials/lib/invoice-calculations'
import { formatCurrency } from '@/lib/utils/currency'

interface WorkOrderDetailSheetProps {
    workOrder: WorkOrderWithDetails | null
    isOpen: boolean
    onClose: () => void
}

export const WorkOrderDetailSheet: React.FC<WorkOrderDetailSheetProps> = ({
    workOrder,
    isOpen,
    onClose
}) => {
    // Fetch work order items (only when work order ID is available)
    const { data: workOrderItems = [], isLoading: itemsLoading } = useWorkOrderItems(workOrder?.id || '')

    if (!workOrder) return null

    const getStatusBadge = (status: string | null | undefined) => {
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

    const getPriorityBadge = (priority: string | null | undefined) => {
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

    // Calculate financial summary from work order items
    const calculations = workOrderItems.length > 0 ? calculateInvoiceTotals(workOrderItems) : null
    const TAX_RATE = 0.13

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[600px] sm:w-[700px] bg-white dark:bg-[#0a0a0a] border-border dark:border-[#222222] overflow-y-auto">
                <SheetHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Wrench className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                            <SheetTitle className="text-foreground dark:text-white text-lg">
                                {workOrder.work_order_number}
                            </SheetTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            {getStatusBadge(workOrder.status)}
                            {getPriorityBadge(workOrder.priority)}
                        </div>
                    </div>
                    {workOrder.title ? (
                        <SheetDescription className="text-muted-foreground dark:text-gray-400 text-sm mt-1">
                            {workOrder.title}
                        </SheetDescription>
                    ) : (
                        <SheetDescription className="sr-only">
                            Work order details
                        </SheetDescription>
                    )}
                </SheetHeader>

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
                                        Mileage: {workOrder.vehicle.mileage.toLocaleString()} miles
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
                                        Mileage: {Number(workOrder.walk_in_vehicle_info.mileage).toLocaleString()} miles
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
                                {calculations.packagesTotal > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Packages:</span>
                                        <span className="text-foreground dark:text-white">{formatCurrency(calculations.packagesTotal)}</span>
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
                                {calculations.rejectedItems.length > 0 && (
                                    <div className="text-xs text-red-600 dark:text-red-400 pt-1">
                                        {calculations.rejectedItems.length} rejected item(s) excluded from total
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                                {workOrderItems.map((item: any, index: number) => {
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
                                                                {item.category && (
                                                                    <div>
                                                                        <span className="font-medium">Category:</span> {item.category}
                                                                    </div>
                                                                )}
                                                                {item.warranty_period && (
                                                                    <div>
                                                                        <span className="font-medium">Warranty:</span> {item.warranty_period}
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
                                            {item.notes && (
                                                <div className="text-muted-foreground dark:text-gray-400 text-xs mt-1">
                                                    <span className="font-medium">Notes:</span> {item.notes}
                                                </div>
                                            )}
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
                            {workOrder.archived_by_user?.email && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground dark:text-gray-400">Archived By:</span>
                                    <span className="text-foreground dark:text-white">{workOrder.archived_by_user.email}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Updated:</span>
                                <span className="text-foreground dark:text-white">{formatDateTime(workOrder.updated_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {workOrder.description && (
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <h3 className="text-foreground dark:text-white font-medium mb-2">Description</h3>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm whitespace-pre-wrap">{workOrder.description}</p>
                        </div>
                    )}

                    {/* Notes */}
                    {workOrder.notes && (
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <h3 className="text-foreground dark:text-white font-medium mb-2">Notes</h3>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm whitespace-pre-wrap">{workOrder.notes}</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

