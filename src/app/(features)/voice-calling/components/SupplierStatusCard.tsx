'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Phone, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatting'

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
    }
    onRecall?: (supplierId: string, supplierName: string, phoneNumber: string) => void
    onRetry?: () => void
    onPlaceOrder?: () => void
}

export function SupplierStatusCard({ call, onRecall, onRetry, onPlaceOrder }: SupplierStatusCardProps) {
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
                    <div className="text-xs text-green-400">
                        Quote: ${formattedPrice}
                    </div>
                )
            })()}
        </div>
    )
}

export default SupplierStatusCard
