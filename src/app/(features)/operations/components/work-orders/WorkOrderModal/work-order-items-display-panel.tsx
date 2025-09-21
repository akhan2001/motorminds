'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Package, Wrench, DollarSign, Star, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { useWorkOrderItems, useWorkOrderItemsByShop } from '../../../hooks/use-work-order-items'
import type { WorkOrderItem } from '../../../types/work-order-items'

export interface WorkOrderItemsDisplayPanelProps {
    workOrderId: string
    shopId?: string
    className?: string
}

export const WorkOrderItemsDisplayPanel: React.FC<WorkOrderItemsDisplayPanelProps> = ({
    workOrderId,
    shopId,
    className = ""
}) => {
    // For new work orders, fetch all items by shop ID, otherwise fetch by work order ID
    const shouldFetchByShop = workOrderId === "new" && shopId
    
    // Use different hooks based on whether we're fetching by shop or work order
    const workOrderItemsQuery = useWorkOrderItems(shouldFetchByShop ? "" : workOrderId)
    const shopItemsQuery = useWorkOrderItemsByShop(shouldFetchByShop ? shopId! : "")
    
    // Use the appropriate query result
    const { data: items = [], isLoading, error } = shouldFetchByShop ? shopItemsQuery : workOrderItemsQuery

    // Calculate total for all items
    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'labor':
                return <Wrench className="h-4 w-4" />
            case 'part':
                return <Package className="h-4 w-4" />
            case 'service':
                return <Star className="h-4 w-4" />
            case 'fee':
                return <DollarSign className="h-4 w-4" />
            default:
                return <Package className="h-4 w-4" />
        }
    }

    const getItemTypeColor = (type: string) => {
        switch (type) {
            case 'labor':
                return 'bg-blue-500'
            case 'part':
                return 'bg-green-500'
            case 'service':
                return 'bg-purple-500'
            case 'fee':
                return 'bg-orange-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getItemTypeLabel = (type: string) => {
        switch (type) {
            case 'labor':
                return 'Labor'
            case 'part':
                return 'Part'
            case 'service':
                return 'Service'
            case 'fee':
                return 'Fee'
            default:
                return 'Item'
        }
    }

    if (isLoading) {
        return (
            <div className={`w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
                {/* Header */}
                <div className="p-4 border-b border-[#222222] flex-shrink-0">
                    <div>
                        <h3 className="text-white font-medium text-sm">Work Order Items</h3>
                        <p className="text-gray-400 text-xs mt-1">Parts, labor, and services</p>
                    </div>
                </div>

                {/* Loading State */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-400 text-sm">Loading items...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
                {/* Header */}
                <div className="p-4 border-b border-[#222222] flex-shrink-0">
                    <div>
                        <h3 className="text-white font-medium text-sm">Work Order Items</h3>
                        <p className="text-gray-400 text-xs mt-1">Parts, labor, and services</p>
                    </div>
                </div>

                {/* Error State */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Package className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-red-400 text-sm">Failed to load items</p>
                        <p className="text-gray-500 text-xs mt-1">{error.message}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-[#222222] flex-shrink-0">
                <div>
                    <h3 className="text-white font-medium text-sm">
                        {shouldFetchByShop ? 'Recent Work Order Items' : 'Work Order Items'}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                        {shouldFetchByShop ? 'Recent items from all work orders' : 'Parts, labor, and services'}
                    </p>
                </div>
            </div>

            {/* Content Area - Scrollable */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-4">
                    {/* Items List */}
                    {items.length > 0 ? (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
                                    <div className="flex items-start gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getItemTypeColor(item.item_type)} mt-1.5 flex-shrink-0`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getItemIcon(item.item_type)}
                                                <Badge 
                                                    variant="secondary" 
                                                    className="text-xs bg-[#2a2a2a] text-gray-400"
                                                >
                                                    {getItemTypeLabel(item.item_type)}
                                                </Badge>
                                                {item.completed_at && (
                                                    <Badge 
                                                        variant="secondary" 
                                                        className="text-xs bg-green-500/20 text-green-400 border-green-500/20"
                                                    >
                                                        Completed
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-white text-sm font-medium line-clamp-2">
                                                {item.description}
                                            </p>
                                            
                                            {/* Item-specific details */}
                                            {item.part_number && (
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Part: {item.part_number}
                                                </p>
                                            )}
                                            
                                            {item.supplier && (
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Supplier: {item.supplier}
                                                </p>
                                            )}

                                            {item.labor_hours && (
                                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {item.labor_hours} hours
                                                </div>
                                            )}

                                            {/* Pricing Information */}
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                                    {item.item_type === 'labor' ? (
                                                        <span>
                                                            {item.labor_hours || 0} hrs × {formatCurrency(item.unit_price)}/hr
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {item.quantity} × {formatCurrency(item.unit_price)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-white font-medium text-sm">
                                                    {formatCurrency(item.total_price)}
                                                </span>
                                            </div>

                                            {/* Notes */}
                                            {item.notes && (
                                                <p className="text-gray-500 text-xs mt-2 line-clamp-2">
                                                    {item.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">
                                {shouldFetchByShop ? 'No work order items found' : 'No items added yet'}
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                                {shouldFetchByShop ? 'Items will appear here when work orders are created' : 'Items will appear here when added'}
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer - Total */}
            {items.length > 0 && (
                <div className="p-4 border-t border-[#222222] flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Total Items:</span>
                        <span className="text-white font-bold text-lg">
                            {formatCurrency(totalAmount)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-500 text-xs">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

// Default export for easy importing  
export default WorkOrderItemsDisplayPanel
