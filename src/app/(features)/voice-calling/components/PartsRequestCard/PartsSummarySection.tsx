'use client'

import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import { memo, useState, useCallback } from 'react'
import { PARTS_PREVIEW_LIMIT } from '../../constants'

interface PartItem {
    part_name?: string
    partName?: string
    part_number?: string
    partNumber?: string
    quantity?: number
}

interface PartsSummarySectionProps {
    parts: PartItem[]
}

export const PartsSummarySection = memo(function PartsSummarySection({ parts }: PartsSummarySectionProps) {
    const [expanded, setExpanded] = useState(false)

    const handleToggle = useCallback(() => {
        setExpanded(prev => !prev)
    }, [])

    const displayedParts = expanded ? parts : parts.slice(0, PARTS_PREVIEW_LIMIT)
    const hasMore = parts.length > PARTS_PREVIEW_LIMIT

    return (
        <div className="flex items-start gap-3 text-sm">
            <Package className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-200 mb-2">
                    Parts Requested ({parts.length})
                </div>
                <div className="space-y-1.5">
                    {displayedParts.map((part, index) => {
                        const name = part.part_name || part.partName || 'Unknown Part'
                        const number = part.part_number || part.partNumber
                        const qty = part.quantity || 1

                        return (
                            <div key={index} className="text-gray-300 text-xs">
                                <span className="font-medium">{name}</span>
                                {number && <span className="text-gray-500"> ({number})</span>}
                                {qty > 1 && <span className="text-gray-400"> × {qty}</span>}
                            </div>
                        )
                    })}
                </div>
                {hasMore && (
                    <button
                        onClick={handleToggle}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                Show less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3" />
                                Show {parts.length - PARTS_PREVIEW_LIMIT} more
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
})

