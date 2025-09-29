'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/layout/page-layout'
import { LoadingCard } from '@/components/ui/loading-card'
import { ErrorCard } from '@/components/ui/error-card'
import { Phone, Building2, Package, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { VoiceCall } from '../../types/voice-call'
import { formatDate, formatDuration, getStatusColor, getPurposeColor, formatStatusLabel } from '@/lib/utils/formatting'
import CallForm from '../../components/CallForm'

export default function CallLogPage() {
    const params = useParams()
    const callId = params?.callId as string
    
    const [call, setCall] = useState<VoiceCall | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (callId) {
            fetchCallDetails()
        }
    }, [callId])

    const fetchCallDetails = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/voice-calling/requests/${callId}`)
            const data = await response.json()
            
            if (response.ok) {
                setCall(data.call)
            } else {
                setError(data.error || 'Failed to fetch call details')
                toast.error(data.error || 'Failed to fetch call details')
            }
        } catch (error) {
            console.error('Error fetching call details:', error)
            setError('Failed to fetch call details')
            toast.error('Failed to fetch call details')
        } finally {
            setLoading(false)
        }
    }


    if (loading) {
        return (
            <PageLayout>
                <div className="flex items-center justify-center">
                    <LoadingCard 
                        title="Loading Call Details" 
                        description="Fetching call information..." 
                    />
                </div>
            </PageLayout>
        )
    }

    if (error || !call) {
        return (
            <PageLayout>
                <div className="flex items-center justify-center">
                    <ErrorCard 
                        title="Error Loading Call Details" 
                        description={error || 'Call not found'} 
                    />
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout
            breadcrumbs={[
                { label: 'Home', href: '/dashboard' },
                { label: 'Voice Call Logs', href: '/voice-calling/requests' },
                { label: `Call #${callId.slice(0, 8)}...` }
            ]}
            title={`Call to ${call.phone_number}`}
            description="Call details and analysis"
            actions={
                <div className="flex gap-3">
                    <Badge className={getStatusColor(call.status)}>
                        {formatStatusLabel(call.status)}
                    </Badge>
                    <Badge className={getPurposeColor(call.purpose)}>
                        {formatStatusLabel(call.purpose)}
                    </Badge>
                </div>
            }
        >

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Call Information */}
                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Phone className="h-5 w-5" />
                                        Call Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Phone Number:</span>
                                            <span className="text-white">{call.phone_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Duration:</span>
                                            <span className="text-white">{formatDuration(call.duration_seconds)}</span>
                                        </div>
                                        {call.vapi_call_id && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Call ID:</span>
                                                <span className="text-white font-mono text-sm">{call.vapi_call_id}</span>
                                            </div>
                                        )}
                                        {call.started_at && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Started:</span>
                                                <span className="text-white">{formatDate(call.started_at)}</span>
                                            </div>
                                        )}
                                        {call.ended_at && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Ended:</span>
                                                <span className="text-white">{formatDate(call.ended_at)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Created:</span>
                                            <span className="text-white">{formatDate(call.created_at)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Supplier Information */}
                            {call.supplier && (
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <Building2 className="h-5 w-5" />
                                            Supplier Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Name:</span>
                                                <span className="text-white">{call.supplier.name}</span>
                                            </div>
                                            {call.supplier.contact_person && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Contact:</span>
                                                    <span className="text-white">{call.supplier.contact_person}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Parts Requested */}
                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Parts Requested
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {call.parts_request?.parts_requested && call.parts_request.parts_requested.length > 0 ? (
                                        <div className="space-y-2">
                                            {call.parts_request.parts_requested.map((part, index) => (
                                                <div key={index} className="flex justify-between items-center p-2 bg-[#1a1a1a] rounded">
                                                    <span className="text-white">{part.name || part.part_name || 'Unknown'} ({part.quantity || 1}x)</span>
                                                    {part.price && (
                                                        <span className="text-green-400">${part.price}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No parts specified</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Call Summary */}
                            {call.call_summary && (
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Call Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-300">{call.call_summary}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Quote Information */}
                            {call.quote_received && (
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5" />
                                            Quote Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {call.quote_received.structuredData?.quote_details?.total_cost && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Total Cost:</span>
                                                    <span className="text-green-400 text-lg font-bold">
                                                        ${call.quote_received.structuredData.quote_details.total_cost}
                                                    </span>
                                                </div>
                                            )}
                                            {call.quote_received.structuredData?.parts_info && (
                                                <div className="space-y-2">
                                                    <p className="text-gray-400 text-sm">Parts Discussed:</p>
                                                    {call.quote_received.structuredData.parts_info.map((part: any, index: number) => (
                                                        <div key={index} className="flex justify-between items-center p-2 bg-[#1a1a1a] rounded">
                                                            <span className="text-white text-sm">
                                                                {part.part_name || part.name || 'Unknown'} ({part.quantity || 1}x)
                                                            </span>
                                                            {part.unit_price && (
                                                                <span className="text-green-400 text-sm">${part.unit_price}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Error Details */}
                            {call.error_details && (
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" />
                                            Error Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-red-900/20 border border-red-500/20 rounded p-3">
                                            <pre className="text-red-400 text-sm whitespace-pre-wrap">
                                                {JSON.stringify(call.error_details, null, 2)}
                                            </pre>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Actions */}
                        <Card className="bg-[#111111] border-[#2a2a2a] mt-6">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-3">
                                    {call.parts_request_id && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                                        >
                                            <Link href={`/parts/parts-quote/${call.parts_request_id}`}>
                                                <Package className="h-4 w-4 mr-2" />
                                                View Parts Request
                                            </Link>
                                        </Button>
                                    )}
                                    <CallForm
                                        trigger={
                                            <Button
                                                variant="outline"
                                                className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                                            >
                                                <Phone className="h-4 w-4 mr-2" />
                                                Make New Call
                                            </Button>
                                        }
                                        prefillData={{
                                            phone: call.phone_number,
                                            supplier: call.supplier_id
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
        </PageLayout>
    )
}
