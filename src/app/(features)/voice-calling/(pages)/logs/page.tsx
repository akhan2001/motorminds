'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, Clock, CheckCircle, XCircle, Loader2, ArrowLeft, Calendar, User, Package, RefreshCw } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { formatDate } from '@/lib/utils/formatting'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

interface VoiceCallLog {
    id: string
    created_at: string
    updated_at: string
    supplier_id: string
    supplier_name?: string
    phone_number: string
    purpose: string
    status: string
    vapi_call_id?: string
    started_at?: string
    ended_at?: string
    duration_seconds?: number
    call_summary?: string
    parts_discussed?: any[]
    actions_taken?: any[]
    parts_request_id?: string
    order_created?: boolean
    quote_received?: any
    sequence_number?: number
}

export default function VoiceCallLogsPage() {
    const { user, shopId, isLoading: authLoading } = useAuth()
    const [logs, setLogs] = useState<VoiceCallLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (shopId) {
            fetchLogs()
        }
    }, [shopId])

    const fetchLogs = async () => {
        if (!shopId) return

        try {
            setLoading(true)
            setError(null)
            
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data, error: fetchError } = await supabase
                .from('voice_calls')
                .select('*')
                .eq('shop_id', shopId)
                .order('created_at', { ascending: false })
                .limit(100)

            if (fetchError) throw fetchError
            setLogs(data || [])
        } catch (err) {
            console.error('Error fetching call logs:', err)
            setError(err instanceof Error ? err.message : 'Failed to load call logs')
        } finally {
            setLoading(false)
        }
    }

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
            pending: { label: 'Pending', color: 'text-gray-400', bgColor: 'bg-gray-800', icon: Clock },
            connecting: { label: 'Connecting', color: 'text-blue-400', bgColor: 'bg-blue-900', icon: Phone },
            in_progress: { label: 'In Progress', color: 'text-yellow-400', bgColor: 'bg-yellow-900', icon: Loader2 },
            completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-900', icon: CheckCircle },
            failed: { label: 'Failed', color: 'text-red-400', bgColor: 'bg-red-900', icon: XCircle },
            cancelled: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-800', icon: XCircle }
        }
        return configs[status] || configs.pending
    }

    const getPurposeLabel = (purpose: string) => {
        const labels: Record<string, string> = {
            quote_request: 'Quote Request',
            order_followup: 'Order Follow-up',
            parts_ordering: 'Parts Ordering',
            general_inquiry: 'General Inquiry',
            other: 'Other'
        }
        return labels[purpose] || purpose
    }

    const formatDuration = (seconds?: number) => {
        if (!seconds) return 'N/A'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}m ${secs}s`
    }

    if (authLoading || loading) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 overflow-y-auto">
                <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/voice-calling" className="text-gray-400 hover:text-white">
                                    Voice Calling
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-white">
                                    Call Logs
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Voice Call Logs</h1>
                            <p className="text-gray-400 mt-1">Complete history of all AI-powered supplier calls</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                            >
                                <Link href="/voice-calling">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                            <Button
                                onClick={fetchLogs}
                                variant="outline"
                                size="sm"
                                className="border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-400">Total Calls</div>
                                <div className="text-2xl font-bold text-white mt-1">{logs.length}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-400">Completed</div>
                                <div className="text-2xl font-bold text-green-400 mt-1">
                                    {logs.filter(l => l.status === 'completed').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-400">Failed</div>
                                <div className="text-2xl font-bold text-red-400 mt-1">
                                    {logs.filter(l => l.status === 'failed').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-400">In Progress</div>
                                <div className="text-2xl font-bold text-yellow-400 mt-1">
                                    {logs.filter(l => ['connecting', 'in_progress'].includes(l.status)).length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Logs Table */}
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-[#2a2a2a]">
                                        <tr className="text-left text-sm text-gray-400">
                                            <th className="p-4 font-medium">Date & Time</th>
                                            <th className="p-4 font-medium">Supplier</th>
                                            <th className="p-4 font-medium">Purpose</th>
                                            <th className="p-4 font-medium">Status</th>
                                            <th className="p-4 font-medium">Duration</th>
                                            <th className="p-4 font-medium">Call #</th>
                                            <th className="p-4 font-medium">Quote</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => {
                                            const statusConfig = getStatusConfig(log.status)
                                            const StatusIcon = statusConfig.icon

                                            return (
                                                <tr 
                                                    key={log.id} 
                                                    className="border-b border-[#2a2a2a] hover:bg-[#131313] transition-colors"
                                                >
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="w-4 h-4 text-gray-500" />
                                                            <span className="text-gray-300">
                                                                {formatDate(log.created_at)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-medium text-sm">
                                                                {log.supplier_name || 'Unknown'}
                                                            </span>
                                                            <span className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                                                                <Phone className="w-3 h-3" />
                                                                {log.phone_number}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant="outline" className="text-xs border-[#2a2a2a] text-gray-300">
                                                            {getPurposeLabel(log.purpose)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge className={`${statusConfig.color} ${statusConfig.bgColor} text-xs`}>
                                                            <StatusIcon className={`w-3 h-3 mr-1 ${log.status === 'in_progress' ? 'animate-spin' : ''}`} />
                                                            {statusConfig.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-gray-300 text-sm">
                                                            {formatDuration(log.duration_seconds)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-gray-400 text-sm">
                                                            #{log.sequence_number || 1}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {log.quote_received && (() => {
                                                            const quoteData = log.quote_received
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
                                                                <span className="text-green-400 text-sm font-medium">
                                                                    ${formattedPrice}
                                                                </span>
                                                            )
                                                        })()}
                                                        {!log.quote_received && (
                                                            <span className="text-gray-500 text-sm">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>

                                {logs.length === 0 && (
                                    <div className="p-12 text-center text-gray-500">
                                        <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg">No call logs yet</p>
                                        <p className="text-sm mt-1">Call logs will appear here once you start making calls</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

