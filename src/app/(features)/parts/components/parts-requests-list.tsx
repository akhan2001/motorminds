'use client'

import React from 'react'
import PartsRequestCard from './parts-request-card'
import { usePartsRequests } from '@/app/(features)/parts/hooks/use-parts-requests'

interface PartsRequestsListProps {
    onRecall?: (request: any) => void
    limit?: number
}

export default function PartsRequestsList({ onRecall, limit }: PartsRequestsListProps) {
    const { data, loading, error } = usePartsRequests({ limit })

    if (loading) {
        return <div className="text-gray-400 text-sm">Loading previous requests...</div>
    }
    if (error) {
        return <div className="text-red-400 text-sm">{error}</div>
    }
    if (!data || data.length === 0) {
        return <div className="text-gray-400 text-sm">No previous requests found.</div>
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            {data.map((req: any) => (
                <PartsRequestCard key={req.id} request={req} onRecall={onRecall} />
            ))}
        </div>
    )
}


