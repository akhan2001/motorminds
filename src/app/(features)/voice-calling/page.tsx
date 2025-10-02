'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../operations/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Phone, Clock, CheckCircle, AlertCircle, Plus, RefreshCw, Loader2 } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { EmptyState } from '@/components/common/feedback/empty-states'
import { PartsService } from '@/app/(features)/parts/lib/partsService'
import { VoiceCallService } from './lib/voiceCallService'
import CallForm from './components/CallForm'
import { PartsRequestStatus, getStatusConfig, StatusAction } from './types/status'
import { formatDate } from '@/lib/utils/formatting'
import { toast } from 'sonner'
import Link from 'next/link'

interface PartsRequestWithActions {
    id: string
    status: string // Original database status
    mappedStatus?: PartsRequestStatus // Mapped status for UI logic
    parts_requested?: any[]
    vehicle_info?: any
    supplier_info?: any
    created_at: string
    updated_at: string
    quote_provided?: any
    availableActions: StatusAction[]
    callHistory: any[]
    [key: string]: any // Allow additional properties from database
}

// Map database status to our unified status system
const mapDatabaseStatus = (dbStatus: string): PartsRequestStatus => {
    const statusMap: Record<string, PartsRequestStatus> = {
        'pending': 'pending',
        'processing': 'quote_requested',
        'quoted': 'quote_received',
        'approved': 'ready_to_order',
        'ordered': 'order_placed',
        'received': 'completed',
        'cancelled': 'cancelled'
    }
    return statusMap[dbStatus] || 'pending'
}

export default function VoiceCallingPage() {
    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()
    
    const [partsRequests, setPartsRequests] = useState<PartsRequestWithActions[]>([])
    const [loading, setLoading] = useState(true)
    const [dataError, setDataError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('active')
    const [processingAction, setProcessingAction] = useState<string | null>(null)
    
    // Combined loading state
    const isLoading = authLoading || (shopId && loading)
    // Combined error state
    const error = authError || dataError

    useEffect(() => {
        if (shopId) {
            fetchPartsRequests()
        }
    }, [shopId])

    const fetchPartsRequests = async () => {
        if (!shopId) return
        
        try {
            setLoading(true)
            setDataError(null)
            const response = await PartsService.getPartsRequests(shopId, {}, 1, 100)
            
            // Enhance each parts request with actions and call history
            const enhancedRequests = await Promise.all(
                response.partsRequests.map(async (request) => {
                    const mappedStatus = mapDatabaseStatus(request.status)
                    const actions = await VoiceCallService.getPartsRequestActions(request.id)
                    const callHistory = await VoiceCallService.getCallsForPartsRequest(request.id)
                    
                    return {
                        ...request,
                        mappedStatus, // Add mapped status for UI logic
                        availableActions: actions.availableActions,
                        callHistory
                    }
                })
            )
            
            setPartsRequests(enhancedRequests)
        } catch (error) {
            console.error('Error fetching parts requests:', error)
            setDataError(error instanceof Error ? error.message : 'Failed to load parts requests')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (partsRequestId: string, action: StatusAction) => {
        if (!shopId) return
        
        try {
            setProcessingAction(partsRequestId)
            
            const partsRequest = partsRequests.find(pr => pr.id === partsRequestId)
            if (!partsRequest) return

            // Handle "complete_order" action differently - just update status
            if (action.action === 'complete_order') {
                await PartsService.updatePartsRequestStatus(
                    partsRequestId,
                    shopId,
                    'received', // Database status for completed
                    'Order marked as completed from voice calling dashboard'
                )

                toast.success('Order marked as completed successfully')
                await fetchPartsRequests()
                return
            }

            // For all other actions, proceed with call initiation
            // Get supplier info for the call
            const supplierId = partsRequest.supplier_info?.supplier_id
            const phoneNumber = partsRequest.supplier_info?.phone_number
            
            if (!supplierId || !phoneNumber) {
                toast.error('Missing supplier information for this request')
                return
            }

            const result = await VoiceCallService.startCall({
                partsRequestId,
                supplierId,
                phoneNumber,
                purpose: action.purpose,
                vehicleInfo: partsRequest.vehicle_info,
                partsInfo: partsRequest.parts_requested,
                priority: 'normal',
                notes: `${action.description}`,
                shopId
            })

            if (result.success) {
                toast.success(`${action.label} initiated successfully`)
                // Refresh the data to show updated status
                await fetchPartsRequests()
            } else {
                toast.error(`Failed to ${action.label.toLowerCase()}`)
            }

        } catch (error) {
            console.error('Error executing action:', error)
            toast.error(`Failed to ${action.label.toLowerCase()}`)
        } finally {
            setProcessingAction(null)
        }
    }

    const handleRefreshCall = async (partsRequestId: string) => {
        if (!shopId) return
        
        try {
            setProcessingAction(`refresh-${partsRequestId}`)
            
            // Find the most recent voice call for this parts request
            const partsRequest = partsRequests.find(pr => pr.id === partsRequestId)
            if (!partsRequest || !partsRequest.callHistory?.length) {
                toast.error('No calls found for this parts request')
                return
            }

            // Get the most recent call
            const mostRecentCall = partsRequest.callHistory[0]
            
            console.log('🔄 Refreshing call analysis for:', mostRecentCall.id)
            
            // Call the refresh-analysis API
            const response = await fetch('/api/voice-calling/refresh-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    call_id: mostRecentCall.id,
                    parts_request_id: partsRequestId,
                    shop_id: shopId
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to refresh call analysis')
            }

            const result = await response.json()
            
            console.log('✅ Call analysis refreshed:', result.analysis)
            
            toast.success('Call analysis refreshed successfully')
            
            // Refresh the parts requests to show updated data
            await fetchPartsRequests()
            
        } catch (error: any) {
            console.error('Error refreshing call analysis:', error)
            toast.error(`Failed to refresh call analysis: ${error.message}`)
        } finally {
            setProcessingAction(null)
        }
    }

    const getStatusCounts = () => {
        const counts = {
            active: 0,
            completed: 0,
            failed: 0
        }

        partsRequests.forEach(request => {
            const status = request.mappedStatus || mapDatabaseStatus(request.status)
            if (['completed'].includes(status)) {
                counts.completed++
            } else if (['failed', 'cancelled'].includes(status)) {
                counts.failed++
            } else {
                counts.active++
            }
        })

        return counts
    }

    const filterRequests = (filter: string) => {
        return partsRequests.filter(request => {
            const status = request.mappedStatus || mapDatabaseStatus(request.status)
            switch (filter) {
                case 'active':
                    return !['completed', 'failed', 'cancelled'].includes(status)
                case 'completed':
                    return status === 'completed'
                case 'failed':
                    return ['failed', 'cancelled'].includes(status)
                default:
                    return true
            }
        })
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center space-x-4 p-6">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <div>
                                <p className="text-white font-medium">Loading Voice Calling Dashboard</p>
                                <p className="text-gray-400 text-sm">Fetching parts requests and call data...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center space-x-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="text-white font-medium">Failed to Load Voice Calling Dashboard</p>
                                <p className="text-gray-400 text-sm mb-3">
                                    {typeof error === 'string' ? error : 'Unknown error occurred'}
                                </p>
                                <button 
                                    onClick={() => fetchPartsRequests()}
                                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                                >
                                    Try Again
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const statusCounts = getStatusCounts()

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">
                                        Voice Calling Dashboard
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Voice Calling Dashboard</h1>
                                <p className="text-gray-400 mt-1">Manage your AI-powered parts ordering calls</p>
                                    </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => window.location.href = '/suppliers'}
                                    variant="outline"
                                    size="sm"
                                    className="border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                                >
                                    Manage Suppliers
                                </Button>
                                <Button 
                                    onClick={fetchPartsRequests}
                                    variant="outline"
                                    size="sm"
                                    className="border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                                <CallForm 
                                    trigger={
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Request
                                        </Button>
                                    }
                                    onCallComplete={fetchPartsRequests}
                                />
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-300">Active Requests</CardTitle>
                                    <Clock className="h-4 w-4 text-gray-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">{statusCounts.active}</div>
                                    <p className="text-xs text-gray-400">
                                        In progress or pending
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-300">Completed</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-gray-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">{statusCounts.completed}</div>
                                    <p className="text-xs text-gray-400">
                                        Successfully completed
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-300">Need Attention</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                    <div className="text-2xl font-bold text-white">{statusCounts.failed}</div>
                                    <p className="text-xs text-gray-400">
                                        Failed or cancelled
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="bg-[#1a1a1a] border-[#2a2a2a]">
                                <TabsTrigger value="active" className="data-[state=active]:bg-[#2a2a2a] text-gray-300">
                                    Active ({statusCounts.active})
                                </TabsTrigger>
                                <TabsTrigger value="completed" className="data-[state=active]:bg-[#2a2a2a] text-gray-300">
                                    Completed ({statusCounts.completed})
                                </TabsTrigger>
                                <TabsTrigger value="failed" className="data-[state=active]:bg-[#2a2a2a] text-gray-300">
                                    Need Attention ({statusCounts.failed})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value={activeTab} className="mt-6">
                                <div className="grid gap-4">
                                    {filterRequests(activeTab).map((request) => (
                                        <PartsRequestCard
                                            key={request.id}
                                            request={request}
                                            onAction={handleAction}
                                            processing={processingAction === request.id}
                                            onRefresh={handleRefreshCall}
                                            refreshing={processingAction === `refresh-${request.id}`}
                                        />
                                    ))}
                                    
                                    {filterRequests(activeTab).length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                                            <div className="text-center">
                                                <h3 className="text-lg font-medium text-white mb-2">
                                                    No {activeTab} requests
                                                </h3>
                                <p className="text-gray-400 mb-4">
                                                    {activeTab === 'active' 
                                                        ? 'Create a new parts request to get started'
                                                        : `No ${activeTab} requests found`
                                                    }
                                                </p>
                                                {activeTab === 'active' && (
                                                    <CallForm 
                                                        trigger={
                                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                New Request
                                                            </Button>
                                                        }
                                                        onCallComplete={(callId, partsRequestId) => {
                                                            fetchPartsRequests()
                                                        }}
                                                    />
                                                )}
                                    </div>
                                    </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface PartsRequestCardProps {
    request: PartsRequestWithActions
    onAction: (partsRequestId: string, action: StatusAction) => void
    processing: boolean
    onRefresh?: (partsRequestId: string) => void
    refreshing?: boolean
}

function PartsRequestCard({ request, onAction, processing, onRefresh, refreshing }: PartsRequestCardProps) {
    const statusConfig = getStatusConfig(request.status as PartsRequestStatus)
    
    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Badge 
                            className={`${statusConfig.color} ${statusConfig.bgColor}`}
                            variant="secondary"
                        >
                            {statusConfig.label}
                        </Badge>
                        <div>
                            <h3 className="font-semibold text-white">
                                {request.supplier_info?.supplier_name || 'Unknown Supplier'}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {request.parts_requested?.length || 0} parts • Created {formatDate(request.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {request.availableActions.map((action) => (
                            <Button
                                key={action.action}
                                size="sm"
                                variant={action.variant || 'default'}
                                onClick={() => onAction(request.id, action)}
                                disabled={processing}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {processing ? (
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                    <Phone className="h-3 w-3 mr-1" />
                                )}
                                {action.label}
                            </Button>
                        ))}
                        
                        {/* Refresh Button - only show if there are recent calls */}
                        {request.callHistory?.length > 0 && onRefresh && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onRefresh(request.id)}
                                            disabled={refreshing}
                                            className="text-gray-300 hover:text-white hover:bg-[#2a2a2a]"
                                        >
                                            {refreshing ? (
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                        <p>Refresh call analysis from Vapi</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        
                        <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="text-gray-300 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            <Link href={`/voice-calling/parts/${request.id}`}>
                                View Details
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Parts Summary */}
                    <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-300">Parts Requested:</h4>
                        <div className="flex flex-wrap gap-2">
                            {request.parts_requested?.slice(0, 3).map((part, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-[#2a2a2a] text-gray-300">
                                    {part.part_name} (Qty: {part.quantity})
                                </Badge>
                            ))}
                            {(request.parts_requested?.length || 0) > 3 && (
                                <Badge variant="outline" className="text-xs border-[#2a2a2a] text-gray-300">
                                    +{(request.parts_requested?.length || 0) - 3} more
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Call History */}
                    {request.callHistory?.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium mb-2 text-gray-300">Recent Calls:</h4>
                            <div className="space-y-1">
                                {request.callHistory.slice(0, 2).map((call) => (
                                    <div key={call.id} className="flex items-center justify-between text-xs text-gray-400">
                                        <span>{call.purpose.replace('_', ' ')} • {formatDate(call.created_at)}</span>
                                        <Badge variant="outline" className="text-xs border-[#2a2a2a] text-gray-300">
                                            {call.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quote Info */}
                    {request.quote_provided && (
                        <div className="bg-green-900/20 border border-green-800/30 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-green-400 mb-1">Quote Available</h4>
                            <p className="text-xs text-green-300">
                                Quote received and ready for review
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}