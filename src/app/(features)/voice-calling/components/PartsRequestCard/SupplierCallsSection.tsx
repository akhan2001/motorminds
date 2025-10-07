'use client'

import { Phone, Loader2 } from 'lucide-react'
import { memo } from 'react'
import { SupplierStatusCard } from '../SupplierStatusCard'
import { useSupplierCalls } from '../../hooks'

interface SupplierCallsSectionProps {
    partsRequestId: string
    refreshTrigger?: boolean
    onRecall?: (supplierId: string, supplierName: string, phoneNumber: string) => void
    onRetryCall?: (callId: string) => void
    onPlaceOrder?: (callId: string) => void
}

export const SupplierCallsSection = memo(function SupplierCallsSection({
    partsRequestId,
    refreshTrigger,
    onRecall,
    onRetryCall,
    onPlaceOrder
}: SupplierCallsSectionProps) {
    const { calls, loading } = useSupplierCalls(partsRequestId, refreshTrigger)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!calls.length) {
        return null
    }

    // Count unique suppliers
    const uniqueSuppliers = new Set(calls.map(call => call.supplier_name || 'Unknown')).size
    const totalCalls = calls.length
    
    return (
        <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-400" />
                <span className="font-medium text-gray-200">
                    Supplier Calls ({totalCalls})
                    {uniqueSuppliers < totalCalls && (
                        <span className="text-gray-400 text-xs ml-1">• {uniqueSuppliers} unique supplier{uniqueSuppliers !== 1 ? 's' : ''}</span>
                    )}
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {calls.map((call) => (
                    <SupplierStatusCard
                        key={call.id}
                        call={call}
                        onRecall={onRecall}
                        onRetryCall={onRetryCall}
                        onPlaceOrder={onPlaceOrder}
                    />
                ))}
            </div>
        </div>
    )
})

