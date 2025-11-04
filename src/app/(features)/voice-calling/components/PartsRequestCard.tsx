'use client'

import React, { useState, useCallback, useMemo, memo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
    Phone, 
    RefreshCw, 
    Package, 
    Car,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle2
} from 'lucide-react'
import { formatDate } from '@/lib/utils/formatting'
import { toast } from 'sonner'
import { useSupplierCalls } from '../hooks'
import { VehicleInfoSection } from './PartsRequestCard/VehicleInfoSection'
import { PartsSummarySection } from './PartsRequestCard/PartsSummarySection'
import { SupplierCallsSection } from './PartsRequestCard/SupplierCallsSection'
import { QuickStatsSection } from './PartsRequestCard/QuickStatsSection'
import { REFRESH_COOLDOWN } from '../constants'
import type { PartsRequest, StatusAction } from '../types'

interface PartsRequestCardProps {
    request: PartsRequest
    onAction: (partsRequestId: string, action: StatusAction) => void
    onRefresh: (partsRequestId: string) => void
    onCallSuppliers: (partsRequestId: string) => void
    onRecallSupplier: (partsRequestId: string, supplierId: string, supplierName: string, phoneNumber: string) => void
    processing: boolean
    refreshing: boolean
}

const PartsRequestCard = memo(function PartsRequestCard({ 
    request, 
    onAction, 
    onRefresh,
    onCallSuppliers,
    onRecallSupplier, 
    processing, 
    refreshing 
}: PartsRequestCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(0)
    
    // Fetch supplier calls using custom hook
    const { calls: supplierCalls, loading: callsLoading } = useSupplierCalls(request.id, refreshing)

    // Memoized computations
    const statusConfig = useMemo(() => {
        // Inline status config to avoid circular imports
        const configs: Record<string, { label: string; color: string; bgColor: string }> = {
            pending: { label: 'Pending', color: 'text-gray-400', bgColor: 'bg-gray-800' },
            processing: { label: 'Processing', color: 'text-blue-400', bgColor: 'bg-blue-900' },
            quote_requested: { label: 'Quote Requested', color: 'text-blue-400', bgColor: 'bg-blue-900' },
            quote_received: { label: 'Quote Received', color: 'text-green-400', bgColor: 'bg-green-900' },
            ready_to_order: { label: 'Ready to Order', color: 'text-yellow-400', bgColor: 'bg-yellow-900' },
            quoted: { label: 'Quoted', color: 'text-green-400', bgColor: 'bg-green-900' },
            ordered: { label: 'Ordered', color: 'text-purple-400', bgColor: 'bg-purple-900' },
            order_placed: { label: 'Order Placed', color: 'text-purple-400', bgColor: 'bg-purple-900' },
            received: { label: 'Received', color: 'text-green-500', bgColor: 'bg-green-800' },
            completed: { label: 'Completed', color: 'text-green-500', bgColor: 'bg-green-800' },
            cancelled: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-900' }
        }
        return configs[request.status] || configs.pending
    }, [request.status])

    const supplierStats = useMemo(() => {
        const supplierInfo = request.supplier_info || {}
        
        // Count unique suppliers from calls
        const uniqueSuppliers = new Set(supplierCalls.map(call => call.supplier_name || 'Unknown')).size
        const totalCalls = supplierCalls.length
        
        // Use unique count if calls exist, otherwise fall back to supplier_info
        const totalSuppliers = totalCalls > 0 ? uniqueSuppliers : (supplierInfo.total_suppliers || 1)
        const completedSuppliers = supplierInfo.completed_suppliers || 0
        const failedSuppliers = supplierInfo.failed_suppliers || 0
        const inProgressCalls = supplierCalls.filter(c => ['connecting', 'in_progress'].includes(c.status)).length

        return {
            totalSuppliers,
            totalCalls,
            completedSuppliers,
            failedSuppliers,
            inProgressCalls
        }
    }, [request.supplier_info, supplierCalls])

    // Memoized callbacks
    const handleToggleExpand = useCallback(() => {
        setIsExpanded(prev => !prev)
    }, [])

    const handleRefreshClick = useCallback(() => {
        const now = Date.now()
        if (now - lastRefresh < REFRESH_COOLDOWN) {
            toast.info('Please wait before refreshing again')
            return
        }
        setLastRefresh(now)
        onRefresh(request.id)
    }, [lastRefresh, onRefresh, request.id])

    const handleCallSuppliersClick = useCallback(() => {
        onCallSuppliers(request.id)
    }, [onCallSuppliers, request.id])

    const handleActionClick = useCallback((action: StatusAction) => {
        onAction(request.id, action)
    }, [onAction, request.id])

    const handleRecallSupplier = useCallback((supplierId: string, supplierName: string, phoneNumber: string) => {
        onRecallSupplier(request.id, supplierId, supplierName, phoneNumber)
    }, [onRecallSupplier, request.id])

    return (
        <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] hover:border-accent dark:hover:border-[#3a3a3a] transition-all">
            <CardHeader className="pb-3">
                {/* Top Section: Status, Vehicle, Actions */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Badge 
                            className={`${statusConfig.color} ${statusConfig.bgColor} shrink-0`}
                            variant="secondary"
                        >
                            {statusConfig.label}
                        </Badge>
                        
                        <div className="flex-1 min-w-0">
                            {/* Vehicle Info */}
                            <div className="flex items-center gap-2 mb-1">
                                <Car className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
                                <h3 className="font-semibold text-foreground dark:text-white text-lg truncate">
                                    {request.vehicle_info?.year} {request.vehicle_info?.make} {request.vehicle_info?.model}
                                </h3>
                            </div>
                            
                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    <span>{request.parts_requested?.length || 0} part{request.parts_requested?.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>
                                        {supplierStats.totalSuppliers} supplier{supplierStats.totalSuppliers !== 1 ? 's' : ''}
                                        {supplierStats.totalCalls > supplierStats.totalSuppliers && (
                                            <span className="text-muted-foreground dark:text-gray-500"> ({supplierStats.totalCalls} call{supplierStats.totalCalls !== 1 ? 's' : ''})</span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(request.created_at)}</span>
                                </div>
                                {request.vehicle_info?.vin && (
                                    <div className="flex items-center gap-1">
                                        <span className="font-mono text-muted-foreground dark:text-gray-500">VIN: {request.vehicle_info.vin.slice(-8)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Progress Indicator for Multi-Supplier */}
                    {supplierStats.totalSuppliers > 1 && (
                        <div className="text-right shrink-0">
                            <div className="text-xs text-muted-foreground dark:text-gray-400 mb-1">
                                Progress
                            </div>
                            <div className="text-sm font-semibold text-foreground dark:text-gray-300 mb-1">
                                {supplierStats.completedSuppliers}/{supplierStats.totalSuppliers}
                            </div>
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 dark:bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ 
                                        width: `${(supplierStats.completedSuppliers / supplierStats.totalSuppliers) * 100}%` 
                                    }}
                                />
                            </div>
                            {supplierStats.inProgressCalls > 0 && (
                                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3 animate-pulse" />
                                    {supplierStats.inProgressCalls} calling...
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border dark:border-[#2a2a2a]">
                    {/* Show "Call Suppliers" button if no calls exist yet */}
                    {supplierCalls.length === 0 && (
                        <Button
                            size="sm"
                            onClick={handleCallSuppliersClick}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {processing ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                                <Phone className="h-3 w-3 mr-1" />
                            )}
                            Call {supplierStats.totalSuppliers} Supplier{supplierStats.totalSuppliers > 1 ? 's' : ''}
                        </Button>
                    )}
                    
                    {/* Show refresh button if calls exist */}
                    {supplierCalls.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRefreshClick}
                                        disabled={refreshing}
                                        className="border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#2a2a2a]"
                                    >
                                        <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                                        {refreshing ? 'Refreshing...' : 'Refresh'}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Refresh often to get the latest call status updates</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    
                    {request.availableActions?.map((action: StatusAction) => (
                        <Button
                            key={action.action}
                            size="sm"
                            variant={action.variant || 'default'}
                            onClick={() => handleActionClick(action)}
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {processing ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                                <Phone className="h-3 w-3 mr-1" />
                            )}
                            {action.label}
                        </Button>
                    ))}

                    <div className="flex-1" />

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleToggleExpand}
                        className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#2a2a2a]"
                    >
                        {isExpanded ? 'Show Less' : 'Show More'}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Quick Stats Row */}
                <QuickStatsSection calls={supplierCalls} />

                {/* Parts Summary */}
                <PartsSummarySection parts={request.parts_requested || []} />

                {/* Selected Suppliers - Show if no calls made yet */}
                {supplierCalls.length === 0 && request.supplier_info?.selected_suppliers && (
                    <>
                        <Separator className="my-3 bg-border dark:bg-[#2a2a2a]" />
                        <div className="mb-3">
                            <h4 className="text-xs font-medium mb-2 text-muted-foreground dark:text-gray-400 uppercase tracking-wide">
                                Selected Suppliers ({request.supplier_info.selected_suppliers.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {request.supplier_info.selected_suppliers.map((supplier: any, index: number) => (
                                    <div
                                        key={`${request.id}-supplier-${supplier.id}-${index}`}
                                        className="bg-slate-50 dark:bg-[#0d0d0d] border border-border dark:border-[#2a2a2a] rounded-lg p-3"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-foreground dark:text-gray-200 text-sm truncate">
                                                    {supplier.name}
                                                </div>
                                                {supplier.phone_number && (
                                                    <div className="text-xs text-muted-foreground dark:text-gray-400 mt-1 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {supplier.phone_number}
                                                    </div>
                                                )}
                                                {supplier.contact_person && (
                                                    <div className="text-xs text-muted-foreground dark:text-gray-500 mt-0.5">
                                                        Contact: {supplier.contact_person}
                                                    </div>
                                                )}
                                            </div>
                                            <Badge 
                                                variant="outline" 
                                                className="text-xs border-blue-800/30 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 bg-blue-900/20 ml-2 shrink-0"
                                            >
                                                Ready
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Supplier Status Grid - Show after calls are made */}
                {supplierCalls.length > 0 && (
                    <>
                        <Separator className="my-3 bg-border dark:bg-[#2a2a2a]" />
                        <SupplierCallsSection
                            partsRequestId={request.id}
                            refreshTrigger={refreshing}
                            onRecall={handleRecallSupplier}
                            onRetryCall={() => toast.info('Retry functionality coming soon')}
                            onPlaceOrder={() => toast.info('Order placement functionality coming soon')}
                        />
                    </>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                    <>
                        <Separator className="my-3 bg-border dark:bg-[#2a2a2a]" />
                        
                        {/* Vehicle Details */}
                        <div className="mb-3">
                            <h4 className="text-xs font-medium mb-2 text-muted-foreground dark:text-gray-400 uppercase tracking-wide">Vehicle Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {request.vehicle_info?.engine && (
                                    <div>
                                        <span className="text-muted-foreground dark:text-gray-500">Engine:</span>
                                        <span className="ml-2 text-foreground dark:text-gray-300">{request.vehicle_info.engine}</span>
                                    </div>
                                )}
                                {request.vehicle_info?.mileage && (
                                    <div>
                                        <span className="text-muted-foreground dark:text-gray-500">Mileage:</span>
                                        <span className="ml-2 text-foreground dark:text-gray-300">{request.vehicle_info.mileage}</span>
                                    </div>
                                )}
                                {request.vehicle_info?.transmission && (
                                    <div>
                                        <span className="text-muted-foreground dark:text-gray-500">Transmission:</span>
                                        <span className="ml-2 text-foreground dark:text-gray-300">{request.vehicle_info.transmission}</span>
                                    </div>
                                )}
                                {request.vehicle_info?.color && (
                                    <div>
                                        <span className="text-muted-foreground dark:text-gray-500">Color:</span>
                                        <span className="ml-2 text-foreground dark:text-gray-300">{request.vehicle_info.color}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        {(request.notes || request.admin_notes) && (
                            <div className="mb-3">
                                <h4 className="text-xs font-medium mb-2 text-muted-foreground dark:text-gray-400 uppercase tracking-wide">Notes</h4>
                                {request.notes && (
                                    <p className="text-xs text-foreground dark:text-gray-300 mb-1 bg-slate-50 dark:bg-[#0d0d0d] p-2 rounded border border-border dark:border-[#2a2a2a]">
                                        {request.notes}
                                    </p>
                                )}
                                {request.admin_notes && (
                                    <p className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-900/20 dark:bg-yellow-900/20 p-2 rounded border border-yellow-800/30 dark:border-yellow-800/30">
                                        <span className="font-semibold">Admin:</span> {request.admin_notes}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Quote Info */}
                        {request.quote_provided && (
                            <div className="bg-green-900/20 dark:bg-green-900/20 border border-green-800/30 dark:border-green-800/30 p-3 rounded-lg">
                                <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Quote Available
                                </h4>
                                <p className="text-xs text-green-700 dark:text-green-300">
                                    Quote received and ready for review
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State */}
                {supplierCalls.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground dark:text-gray-500 text-sm">
                        <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No supplier calls yet</p>
                        <p className="text-xs mt-1">Click an action button above to initiate calls</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
})

export default PartsRequestCard
