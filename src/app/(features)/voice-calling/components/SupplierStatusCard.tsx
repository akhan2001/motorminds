'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Phone, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Package, DollarSign, Truck, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatting'
import { Separator } from '@/components/ui/separator'

interface SupplierStatusCardProps {
    call: {
        id: string
        supplier_id: string
        supplier_name?: string
        phone_number?: string
        status: string
        sequence_number: number
        created_at: string
        quote_received?: any
        duration_seconds?: number
    }
    onRecall?: (supplierId: string, supplierName: string, phoneNumber: string) => void
    onRetry?: () => void
    onPlaceOrder?: () => void
}

export function SupplierStatusCard({ call, onRecall, onRetry, onPlaceOrder }: SupplierStatusCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const statusConfig = {
        pending: {
            color: 'text-gray-400',
            bgColor: 'bg-gray-800',
            icon: Clock,
            text: 'Pending'
        },
        connecting: {
            color: 'text-blue-400',
            bgColor: 'bg-blue-900',
            icon: Phone,
            text: 'Calling...'
        },
        in_progress: {
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-900',
            icon: Loader2,
            text: 'In Progress'
        },
        completed: {
            color: 'text-green-400',
            bgColor: 'bg-green-900',
            icon: CheckCircle,
            text: 'Quote Received'
        },
        failed: {
            color: 'text-red-400',
            bgColor: 'bg-red-900',
            icon: XCircle,
            text: 'Failed'
        },
        cancelled: {
            color: 'text-gray-400',
            bgColor: 'bg-gray-800',
            icon: XCircle,
            text: 'Cancelled'
        }
    }

    const config = statusConfig[call.status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    const handleRecall = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onRecall && call.supplier_id && call.supplier_name && call.phone_number) {
            onRecall(call.supplier_id, call.supplier_name, call.phone_number)
        }
    }

    return (
        <div 
            className="border border-[#2a2a2a] rounded-lg p-3 bg-[#131313] hover:border-[#3a3a3a] transition-all"
        >
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white text-sm truncate flex-1">
                    {call.supplier_name || 'Unknown Supplier'}
                </h4>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                    <button
                        onClick={handleRecall}
                        className="p-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
                        title="Recall this supplier"
                    >
                        <Phone className="w-3.5 h-3.5" />
                    </button>
                    <Badge className={`${config.color} ${config.bgColor} text-xs`}>
                        <Icon className={`w-3 h-3 mr-1 ${call.status === 'in_progress' ? 'animate-spin' : ''}`} />
                        {config.text}
                    </Badge>
                </div>
            </div>

            <div className="text-xs text-gray-400 mb-2">
                Call #{call.sequence_number} • {formatDate(call.created_at)}
            </div>

            {call.quote_received && call.status === 'completed' && (() => {
                // Check if data is in structuredData or at root level
                const quoteData = call.quote_received
                const actualData = quoteData.structuredData || quoteData
                
                // Try to sum up parts_info array first
                let price = 0
                if (actualData.parts_info && Array.isArray(actualData.parts_info)) {
                    price = actualData.parts_info.reduce((sum: number, part: any) => {
                        const partPrice = part.total_price || part.unit_price || 0
                        return sum + (typeof partPrice === 'number' ? partPrice : parseFloat(partPrice) || 0)
                    }, 0)
                }
                
                // Fallback to other price fields if no price from parts_info
                if (price === 0) {
                    price = 
                        actualData.quote_details?.total_cost || 
                        actualData.quote_details?.subtotal ||
                        actualData.total_cost ||
                        actualData.subtotal ||
                        actualData.price ||
                        0
                }
                
                const formattedPrice = price > 0 ? (typeof price === 'number' ? price.toFixed(2) : String(price)) : 'N/A'
                
                return (
                    <div className="text-xs text-green-400 font-medium">
                        Quote: ${formattedPrice}
                    </div>
                )
            })()}

            {/* Duration for completed calls */}
            {call.duration_seconds && call.status === 'completed' && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(call.duration_seconds / 60)}:{String(call.duration_seconds % 60).padStart(2, '0')}
                </div>
            )}

            {/* Expand/Collapse Button */}
            {call.quote_received && (
                <>
                    <Separator className="my-2 bg-[#2a2a2a]" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full text-xs text-gray-400 hover:text-white hover:bg-[#1a1a1a] h-7"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                Hide Details
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                View Call Analysis
                            </>
                        )}
                    </Button>
                </>
            )}

            {/* Expanded Call Analysis */}
            {isExpanded && call.quote_received && (() => {
                const quoteData = call.quote_received
                const actualData = quoteData.structuredData || quoteData
                const summary = quoteData.summary || actualData.summary

                return (
                    <div className="mt-3 space-y-3 text-xs">
                        <Separator className="bg-[#2a2a2a]" />
                        
                        {/* Summary */}
                        {summary && (
                            <div className="bg-[#0d0d0d] rounded-md p-3 border border-[#2a2a2a]">
                                <h5 className="font-medium text-gray-300 mb-2 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Call Summary
                                </h5>
                                <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-wrap">
                                    {summary}
                                </p>
                            </div>
                        )}

                        {/* Parts Info */}
                        {actualData.parts_info && Array.isArray(actualData.parts_info) && actualData.parts_info.length > 0 && (
                            <div className="bg-[#0d0d0d] rounded-md p-3 border border-[#2a2a2a]">
                                <h5 className="font-medium text-gray-300 mb-2 flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    Parts Details
                                </h5>
                                <div className="space-y-2">
                                    {actualData.parts_info.map((part: any, index: number) => (
                                        <div key={index} className="bg-[#1a1a1a] rounded p-2 space-y-1">
                                            <div className="flex items-start justify-between">
                                                <span className="font-medium text-white text-xs">
                                                    {part.part_name || 'Unknown Part'}
                                                </span>
                                                <span className="text-green-400 font-medium text-xs">
                                                    ${typeof part.total_price === 'number' ? part.total_price.toFixed(2) : part.total_price || 'N/A'}
                                                </span>
                                            </div>
                                            {part.part_number && (
                                                <div className="text-gray-500 text-xs">
                                                    Part #: {part.part_number}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                {part.quantity && (
                                                    <span>Qty: {part.quantity}</span>
                                                )}
                                                {part.unit_price && (
                                                    <span>Unit: ${typeof part.unit_price === 'number' ? part.unit_price.toFixed(2) : part.unit_price}</span>
                                                )}
                                            </div>
                                            {part.availability && (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Badge 
                                                        variant="secondary" 
                                                        className={`text-xs ${
                                                            part.availability === 'in_stock' 
                                                                ? 'bg-green-900 text-green-400' 
                                                                : 'bg-yellow-900 text-yellow-400'
                                                        }`}
                                                    >
                                                        {part.availability.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            )}
                                            {part.delivery_method && (
                                                <div className="flex items-center gap-1 text-gray-500 text-xs">
                                                    <Truck className="w-3 h-3" />
                                                    {part.delivery_method}
                                                </div>
                                            )}
                                            {part.vehicle_application && (
                                                <div className="text-gray-500 text-xs mt-1 italic">
                                                    {part.vehicle_application}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quote Details */}
                        {actualData.quote_details && (
                            <div className="bg-[#0d0d0d] rounded-md p-3 border border-[#2a2a2a]">
                                <h5 className="font-medium text-gray-300 mb-2 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    Quote Breakdown
                                </h5>
                                <div className="space-y-1">
                                    {actualData.quote_details.subtotal && (
                                        <div className="flex justify-between text-gray-400">
                                            <span>Subtotal:</span>
                                            <span>${typeof actualData.quote_details.subtotal === 'number' ? actualData.quote_details.subtotal.toFixed(2) : actualData.quote_details.subtotal}</span>
                                        </div>
                                    )}
                                    {actualData.quote_details.tax && (
                                        <div className="flex justify-between text-gray-400">
                                            <span>Tax:</span>
                                            <span>${typeof actualData.quote_details.tax === 'number' ? actualData.quote_details.tax.toFixed(2) : actualData.quote_details.tax}</span>
                                        </div>
                                    )}
                                    {actualData.quote_details.total_cost && (
                                        <div className="flex justify-between text-white font-medium pt-1 border-t border-[#2a2a2a]">
                                            <span>Total:</span>
                                            <span>${typeof actualData.quote_details.total_cost === 'number' ? actualData.quote_details.total_cost.toFixed(2) : actualData.quote_details.total_cost}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Next Steps */}
                        {actualData.next_steps && (
                            <div className="bg-[#0d0d0d] rounded-md p-3 border border-[#2a2a2a]">
                                <h5 className="font-medium text-gray-300 mb-2 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Next Steps
                                </h5>
                                <div className="space-y-1 text-gray-400">
                                    {actualData.next_steps.order_ready !== undefined && (
                                        <div className="flex items-center gap-2">
                                            <Badge variant={actualData.next_steps.order_ready ? "default" : "secondary"} className="text-xs">
                                                {actualData.next_steps.order_ready ? 'Ready to Order' : 'Not Ready'}
                                            </Badge>
                                        </div>
                                    )}
                                    {actualData.next_steps.follow_up_needed && (
                                        <p className="text-xs text-yellow-400">⚠️ Follow-up needed</p>
                                    )}
                                    {actualData.next_steps.special_instructions && (
                                        <p className="text-xs italic">{actualData.next_steps.special_instructions}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })()}
        </div>
    )
}

export default SupplierStatusCard
