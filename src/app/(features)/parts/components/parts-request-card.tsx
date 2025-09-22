'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PartsRequestCardProps {
    request: any
    onRecall?: (request: any) => void
}

export default function PartsRequestCard({ request, onRecall }: PartsRequestCardProps) {
    const vehicle = request?.vehicle_info || {}
    const firstPart = Array.isArray(request?.parts_requested) ? request.parts_requested[0] : null
    const createdAt = request?.created_at ? new Date(request.created_at) : null
    const supplierCount = request?.supplier_info?.selected_suppliers?.length || 0

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-white text-base">
                    {vehicle?.year || ''} {vehicle?.make || ''} {vehicle?.model || ''}
                </CardTitle>
                <div className="text-xs text-gray-400">
                    {createdAt ? createdAt.toLocaleString() : ''}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-gray-300">
                    <div className="mb-1">
                        <span className="text-gray-400">Request ID:</span> {request?.id}
                    </div>
                    {firstPart && (
                        <div className="mb-1">
                            <span className="text-gray-400">Part:</span> {firstPart.quantity}x {firstPart.partName} {firstPart.partNumber ? `(${firstPart.partNumber})` : ''}
                        </div>
                    )}
                    <div className="mb-3">
                        <span className="text-gray-400">Suppliers:</span> {supplierCount}
                        {request?.status ? (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300 border border-gray-700">
                                {request.status}
                            </span>
                        ) : null}
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => onRecall?.(request)} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Recall
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


