'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../operations/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, Clock, CheckCircle, AlertCircle, Plus, RefreshCw, Loader2 } from 'lucide-react'
import { AlertTriangle, Info } from 'lucide-react'
// import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { EmptyState } from '@/components/common/feedback/empty-states'
import { PartsService } from '@/app/(features)/parts/lib/partsService'
import { VoiceCallService } from './lib/voiceCallService'
import CallForm from './components/CallForm'
import PartsRequestCard from './components/PartsRequestCard'
import { PartsRequestStatus, getStatusConfig, StatusAction } from './types/status'
import { formatDate } from '@/lib/utils/formatting'
import { toast } from 'sonner'
import Link from 'next/link'

interface PartsRequestWithActions {
    id: string
    shop_id: string
    status: string // Original database status
    mappedStatus?: PartsRequestStatus // Mapped status for UI logic
    priority: 'low' | 'normal' | 'high' | 'urgent'
    parts_requested: any[]
    vehicle_info: any
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
    const [processingAction, setProcessingAction] = useState<string | null>(null)
    const [refreshingRequest, setRefreshingRequest] = useState<string | null>(null)

    // Ref to control CallForm
    const callFormRef = useRef<{ openForm: () => void }>(null)

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

    const handleRefresh = async (partsRequestId: string) => {
        try {
            setRefreshingRequest(partsRequestId)
            toast.info('Refreshing supplier call statuses...')

            const result = await VoiceCallService.refreshPartsRequest(partsRequestId)

            if (result.success) {
                // Refresh the parts requests list to show updated data
                await fetchPartsRequests()
            }
        } catch (error) {
            console.error('Error refreshing request:', error)
            toast.error('Failed to refresh request')
        } finally {
            setRefreshingRequest(null)
        }
    }

    const handleCallSuppliers = async (partsRequestId: string) => {
        if (!shopId) return

        try {
            setProcessingAction(partsRequestId)

            const partsRequest = partsRequests.find(pr => pr.id === partsRequestId)
            if (!partsRequest) return

            const selectedSuppliers = partsRequest.supplier_info?.selected_suppliers || []

            if (selectedSuppliers.length === 0) {
                toast.error('No suppliers found for this request')
                return
            }

            toast.info(`Initiating calls to ${selectedSuppliers.length} supplier(s)...`)

            // Use multi-supplier call service
            const result = await VoiceCallService.startMultiSupplierCalls({
                partsRequestId,
                suppliers: selectedSuppliers.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    phone_number: s.phone_number || '',
                    contact_person: s.contact_person
                })),
                purpose: 'quote_request',
                vehicleInfo: partsRequest.vehicle_info,
                partsInfo: partsRequest.parts_requested,
                priority: partsRequest.priority || 'normal',
                notes: partsRequest.notes || '',
                shopId
            })

            if (result.results?.some(r => r.success)) {
                // Refresh the data to show updated status
                await fetchPartsRequests()
            }

        } catch (error) {
            console.error('Error calling suppliers:', error)
            toast.error('Failed to initiate calls')
        } finally {
            setProcessingAction(null)
        }
    }

    const handleRecallSupplier = async (partsRequestId: string, supplierId: string, supplierName: string, phoneNumber: string) => {
        if (!shopId) return

        try {
            setProcessingAction(partsRequestId)

            const partsRequest = partsRequests.find(pr => pr.id === partsRequestId)
            if (!partsRequest) return

            toast.info(`Initiating recall to ${supplierName}...`)

            // Start a new call to this specific supplier
            const result = await VoiceCallService.startMultiSupplierCalls({
                partsRequestId,
                suppliers: [{
                    id: supplierId,
                    name: supplierName,
                    phone_number: phoneNumber,
                    contact_person: ''
                }],
                purpose: 'quote_request',
                vehicleInfo: partsRequest.vehicle_info,
                partsInfo: partsRequest.parts_requested,
                priority: partsRequest.priority || 'normal',
                notes: `Recall to ${supplierName}`,
                shopId
            })

            if (result.results?.some(r => r.success)) {
                toast.success(`Recall to ${supplierName} initiated successfully`)
                // Refresh the data to show updated status
                await fetchPartsRequests()
            }

        } catch (error) {
            console.error('Error recalling supplier:', error)
            toast.error('Failed to initiate recall')
        } finally {
            setProcessingAction(null)
        }
    }

    const handleOpenCallForm = () => {
        callFormRef.current?.openForm()
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

    const getStatusCounts = () => {
        const counts = {
            total: partsRequests.length,
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

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                {/* <Nav /> */}
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                        <CardContent className="flex items-center space-x-4 p-6">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <div>
                                <p className="text-foreground dark:text-white font-medium">Loading Voice Calling Dashboard</p>
                                <p className="text-muted-foreground dark:text-gray-400 text-sm">Fetching parts requests and call data...</p>
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
            <div className="h-screen flex flex-col bg-background">
                {/* <Nav /> */}
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                        <CardContent className="flex items-center space-x-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-500" />
                            <div>
                                <p className="text-foreground dark:text-white font-medium">Failed to Load Voice Calling Dashboard</p>
                                <p className="text-muted-foreground dark:text-gray-400 text-sm mb-3">
                                    {typeof error === 'string' ? error : 'Unknown error occurred'}
                                </p>
                                <button
                                    onClick={() => fetchPartsRequests()}
                                    className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm underline"
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
        <div className="h-screen flex flex-col bg-background">
            {/* <Nav /> */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1">
                    <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-foreground dark:text-white">
                                        Voice Calling Dashboard
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Work in Progress Banner */}
                        {/* <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-yellow-600 dark:text-yellow-400 font-semibold text-sm mb-1">Work in Progress</h4>
                                    <p className="text-yellow-700 dark:text-yellow-200/80 text-xs">
                                        The MIA AI voice calling feature is currently under active development.
                                        Some functionality may be limited or unavailable. We're working hard to improve this feature.
                                    </p>
                                </div>
                            </div>
                        </div> */}

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground dark:text-white">Voice Calling Dashboard</h1>
                                <p className="text-muted-foreground dark:text-gray-400 mt-1">Manage your AI-powered parts ordering calls</p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => window.location.href = '/suppliers'}
                                    variant="outline"
                                    size="sm"
                                    className="border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#1a1a1a]"
                                >
                                    Manage Suppliers
                                </Button>
                                <Button
                                    onClick={fetchPartsRequests}
                                    variant="outline"
                                    size="sm"
                                    className="border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#1a1a1a]"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                                <CallForm
                                    ref={callFormRef}
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
                            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-foreground dark:text-gray-300">Active Requests</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground dark:text-white">{statusCounts.active}</div>
                                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                                        In progress or pending
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-foreground dark:text-gray-300">Completed</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground dark:text-white">{statusCounts.completed}</div>
                                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                                        Successfully completed
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-foreground dark:text-gray-300">Need Attention</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground dark:text-white">{statusCounts.failed}</div>
                                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                                        Failed or cancelled
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-foreground dark:text-white">
                                    All Parts Requests ({statusCounts.total})
                                </h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#1a1a1a]"
                                >
                                    <Link href="/voice-calling/logs">
                                        View Call Logs
                                    </Link>
                                </Button>
                            </div>

                            <div className="grid gap-4">
                                {partsRequests.map((request) => (
                                    <PartsRequestCard
                                        key={request.id}
                                        request={request as any}
                                        onAction={handleAction}
                                        onRefresh={handleRefresh}
                                        onCallSuppliers={handleCallSuppliers}
                                        onRecallSupplier={handleRecallSupplier}
                                        processing={processingAction === request.id}
                                        refreshing={refreshingRequest === request.id}
                                    />
                                ))}

                                {partsRequests.length === 0 && (
                                    <EmptyState
                                        title="No parts requests"
                                        description="Create a new parts request to get started"
                                        action={{
                                            label: 'New Request',
                                            onClick: handleOpenCallForm
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
