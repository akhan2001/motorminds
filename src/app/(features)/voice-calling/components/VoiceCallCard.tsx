'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, FileText, Building2, RefreshCw, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { VoiceCall, VoiceCallStatus, VoiceCallPurpose, VoiceCallAnalysis } from '../types/voice-call'

interface VoiceCallCardProps {
    call: VoiceCall
    onRefreshCall: (callId: string) => Promise<void>
}

export default function VoiceCallCard({ call, onRefreshCall }: VoiceCallCardProps) {
const getStatusColor = (status: VoiceCallStatus) => {
    switch (status) {
        case 'pending': return 'bg-yellow-600'
        case 'calling': return 'bg-blue-600'
        case 'completed': return 'bg-green-600'
        case 'failed': return 'bg-red-600'
        case 'cancelled': return 'bg-gray-600'
        case 'ready_to_order': return 'bg-emerald-600'
        case 'recall_needed': return 'bg-orange-600'
        default: return 'bg-gray-600'
    }
}

    const getPurposeColor = (purpose: VoiceCallPurpose) => {
        switch (purpose) {
            case 'parts_ordering': return 'bg-blue-600'
            case 'customer_service': return 'bg-purple-600'
            case 'follow_up': return 'bg-orange-600'
            default: return 'bg-gray-600'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDuration = (seconds?: number) => {
        if (!seconds) return 'N/A'
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const renderCallAnalysis = (analysis: VoiceCallAnalysis) => {
        if (!analysis) return null

        return (
            <div className="mt-4 p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Call Analysis
                </h4>
                <div className="space-y-3">
                    {/* Parts Information */}
                    {analysis.parts_info && (
                        <div>
                            <span className="text-xs font-medium text-gray-400">Parts Discussed:</span>
                            <div className="mt-1 text-sm text-gray-300">
                                {analysis.parts_info.map((part, index: number) => (
                                    <div key={index} className="flex justify-between items-center py-1">
                                        <span>{part.part_name || part.name || 'Unknown Part'} ({part.quantity || 1}x)</span>
                                        <span className="text-green-400">${part.unit_price || part.price || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Quote Details */}
                    {analysis.quote_details && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {analysis.quote_details.total_cost && (
                                <div>
                                    <span className="text-xs font-medium text-gray-400">Total Cost:</span>
                                    <div className="text-green-400">${analysis.quote_details.total_cost}</div>
                                </div>
                            )}
                            {analysis.quote_details.availability && (
                                <div>
                                    <span className="text-xs font-medium text-gray-400">Availability:</span>
                                    <div className="text-blue-400">{analysis.quote_details.availability}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Call Outcome */}
                    {analysis.call_outcome && (
                        <div>
                            <span className="text-xs font-medium text-gray-400">Call Outcome:</span>
                            <div className="text-sm text-gray-300">
                                Status: <span className="text-green-400">{analysis.call_outcome.status || 'Unknown'}</span>
                            </div>
                            {analysis.call_outcome.notes && (
                                <div className="text-sm text-gray-300 mt-1">
                                    Notes: {analysis.call_outcome.notes}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vehicle Information */}
                    {analysis.vehicle_info && (
                        <div>
                            <span className="text-xs font-medium text-gray-400">Vehicle:</span>
                            <div className="text-sm text-gray-300">
                                {analysis.vehicle_info.year} {analysis.vehicle_info.make} {analysis.vehicle_info.model}
                                {analysis.vehicle_info.engine && ` - ${analysis.vehicle_info.engine}`}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Call to {call.phone_number}
                    </CardTitle>
                            <div className="flex gap-2">
                                <Badge className={getStatusColor(call.status)}>
                                    {call.status === 'ready_to_order' ? 'Ready to Order' :
                                     call.status === 'recall_needed' ? 'Recall Needed' :
                                     call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                                </Badge>
                        <Badge variant="outline" className={`${getPurposeColor(call.purpose)} border-0`}>
                            {call.purpose.replace('_', ' ').charAt(0).toUpperCase() + call.purpose.replace('_', ' ').slice(1)}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Call Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="text-sm text-gray-400">Call Information</div>
                        <div className="space-y-1">
                            <div className="text-sm text-gray-300">
                                <strong>Phone:</strong> {call.phone_number}
                            </div>
                            <div className="text-sm text-gray-300">
                                <strong>Duration:</strong> {formatDuration(call.duration_seconds)}
                            </div>
                            {call.vapi_call_id && (
                                <div className="text-sm text-gray-300">
                                    <strong>Call ID:</strong> {call.vapi_call_id}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm text-gray-400">Timing</div>
                        <div className="space-y-1">
                            {call.started_at && (
                                <div className="text-sm text-gray-300">
                                    <strong>Started:</strong> {formatDate(call.started_at)}
                                </div>
                            )}
                            {call.ended_at && (
                                <div className="text-sm text-gray-300">
                                    <strong>Ended:</strong> {formatDate(call.ended_at)}
                                </div>
                            )}
                            <div className="text-sm text-gray-300">
                                <strong>Created:</strong> {formatDate(call.created_at)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supplier Info */}
                {call.supplier && (
                    <div>
                        <div className="text-sm text-gray-400 mb-1">Supplier</div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <Building2 className="h-4 w-4" />
                            <span className="text-sm">{call.supplier.name}</span>
                            {call.supplier.contact_person && (
                                <span className="text-xs text-gray-400">
                                    ({call.supplier.contact_person})
                                </span>
                            )}
                        </div>
                    </div>
                )}

                        {/* Parts Requested Information */}
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Parts Requested</div>
                            <div className="text-sm text-gray-300">
                                {(() => {
                                    // First check if we have parts_request data from the call
                                    if (call.parts_request?.parts_requested && Array.isArray(call.parts_request.parts_requested)) {
                                        const parts = call.parts_request.parts_requested
                                        if (parts.length > 0) {
                                            return parts.map((part, index) => (
                                                <div key={index} className="flex justify-between items-center py-1">
                                                    <span>{part.name || part.part_name || 'Unknown Part'} ({part.quantity || 1}x)</span>
                                                    {part.price && (
                                                        <span className="text-green-400">${part.price}</span>
                                                    )}
                                                </div>
                                            ))
                                        }
                                    }
                                    
                                    // Check if we have parts information from the call analysis
                                    if (call.quote_received?.structuredData?.parts_info) {
                                        const parts = call.quote_received.structuredData.parts_info
                                        if (Array.isArray(parts) && parts.length > 0) {
                                            return parts.map((part, index) => (
                                                <div key={index} className="flex justify-between items-center py-1">
                                                    <span>{part.part_name || part.name || 'Unknown Part'} ({part.quantity || 1}x)</span>
                                                    {part.unit_price && (
                                                        <span className="text-green-400">${part.unit_price}</span>
                                                    )}
                                                </div>
                                            ))
                                        }
                                    }
                                    
                                    // Check parts_discussed field as fallback
                                    if (call.parts_discussed && Array.isArray(call.parts_discussed) && call.parts_discussed.length > 0) {
                                        return call.parts_discussed.map((part: any, index: number) => (
                                            <div key={index} className="flex justify-between items-center py-1">
                                                <span>{part.name || part.part_name || 'Unknown Part'} ({part.quantity || 1}x)</span>
                                                {part.price && (
                                                    <span className="text-green-400">${part.price}</span>
                                                )}
                                            </div>
                                        ))
                                    }
                                    
                                    return <span className="text-gray-500">No parts specified</span>
                                })()}
                            </div>
                        </div>

                        {/* Parts Request Link */}
                        {call.parts_request_id && (
                            <div>
                                <div className="text-sm text-gray-400 mb-1">Related Parts Request</div>
                                <div className="text-sm text-blue-400">
                                    <Link href={`/parts-quote`} className="hover:underline">
                                        View Parts Request #{call.parts_request_id.slice(0, 8)}...
                                    </Link>
                                </div>
                            </div>
                        )}

                {/* Call Summary */}
                {call.call_summary && (
                    <div>
                        <div className="text-sm text-gray-400 mb-1">Call Summary</div>
                        <div className="text-sm text-gray-300 bg-[#0a0a0a] p-3 rounded">
                            {call.call_summary}
                        </div>
                    </div>
                )}

                {/* Quote Information */}
                {call.quote_received && renderCallAnalysis(call.quote_received)}

                {/* Error Details */}
                {call.error_details && (
                    <div>
                        <div className="text-sm text-gray-400 mb-1">Error Details</div>
                        <div className="text-sm text-red-400 bg-[#0a0a0a] p-3 rounded">
                            {JSON.stringify(call.error_details, null, 2)}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-[#2a2a2a]">
                    {call.vapi_call_id && (
                        <Button
                            onClick={() => onRefreshCall(call.vapi_call_id!)}
                            variant="outline"
                            className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Analysis
                        </Button>
                    )}
                    {call.status === 'completed' && call.quote_received && (
                        <Button
                            asChild
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                        >
                            <Link href={`/parts-quote`}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                View Quote
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
