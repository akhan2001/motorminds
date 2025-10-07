'use client'

import { CheckCircle2, XCircle, DollarSign } from 'lucide-react'
import { memo, useMemo } from 'react'

interface VoiceCall {
    id: string
    status: string
    quote_received?: any
}

interface QuickStatsSectionProps {
    calls: VoiceCall[]
}

export const QuickStatsSection = memo(function QuickStatsSection({ calls }: QuickStatsSectionProps) {
    const stats = useMemo(() => {
        const completed = calls.filter(c => c.status === 'completed').length
        const failed = calls.filter(c => c.status === 'failed').length
        
        const totalQuoted = calls.reduce((sum, call) => {
            if (!call.quote_received) return sum
            
            const quoteData = call.quote_received
            const actualData = quoteData.structuredData || quoteData
            
            // Try to get price from parts_info array first
            if (actualData.parts_info && Array.isArray(actualData.parts_info)) {
                const partsTotal = actualData.parts_info.reduce((pSum: number, part: any) => {
                    const partPrice = part.total_price || part.unit_price || 0
                    return pSum + (typeof partPrice === 'number' ? partPrice : parseFloat(partPrice) || 0)
                }, 0)
                if (partsTotal > 0) return sum + partsTotal
            }
            
            // Fallback to other price fields
            const price = 
                actualData.quote_details?.total_cost || 
                actualData.quote_details?.subtotal ||
                actualData.total_cost ||
                actualData.subtotal ||
                actualData.price ||
                0
                
            if (price > 0) {
                const parsedPrice = typeof price === 'string'
                    ? parseFloat(String(price).replace(/[^0-9.]/g, ''))
                    : (typeof price === 'number' ? price : 0)
                return sum + (isNaN(parsedPrice) ? 0 : parsedPrice)
            }
            
            return sum
        }, 0)

        return { completed, failed, totalQuoted }
    }, [calls])

    if (calls.length === 0) {
        return null
    }

    return (
        <div className="grid grid-cols-3 gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
            <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <div>
                    <div className="text-xs text-gray-400">Completed</div>
                    <div className="text-lg font-semibold text-green-400">{stats.completed}</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <div>
                    <div className="text-xs text-gray-400">Failed</div>
                    <div className="text-lg font-semibold text-red-400">{stats.failed}</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <div>
                    <div className="text-xs text-gray-400">Quoted</div>
                    <div className="text-lg font-semibold text-blue-400">
                        ${stats.totalQuoted.toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    )
})

