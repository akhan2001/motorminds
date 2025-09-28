'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/layout/page-layout'
import { LoadingCard } from '@/components/ui/loading-card'
import { ErrorCard } from '@/components/ui/error-card'
import { Package, Building2, DollarSign, Calendar, CheckCircle, FileText, Car, User } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils/formatting'
import { PartsService } from '@/app/(features)/parts/lib/partsService'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'

interface PartsRequest {
    id: string
    created_at: string
    updated_at: string
    status: string
    priority: string
    parts_requested: Array<{
        part_name: string
        part_number: string
        quantity: number
        description?: string
        estimated_price?: number
    }>
    vehicle_info: {
        year?: number
        make?: string
        model?: string
        engine?: string
        vin?: string
        mileage?: number
        customer_name?: string
    }
    supplier_info?: {
        supplier_name: string
        contact_person?: string
        phone_number?: string
        email?: string
    }
    quote_provided?: any
    call_analysis?: any
    actual_cost?: number
    notes?: string
    customer_notes?: string
    admin_notes?: string
    total_estimated_price?: number
    estimated_delivery?: string
}

export default function PartsRequestPage() {
    const params = useParams()
    const partsRequestId = params?.partsId as string
    
    const [partsRequest, setPartsRequest] = useState<PartsRequest | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Authentication
    const { shopId, isLoading: authLoading, error: authError } = useAuth()

    useEffect(() => {
        if (partsRequestId && shopId) {
            fetchPartsRequest()
        }
    }, [partsRequestId, shopId])

    const fetchPartsRequest = async () => {
        try {
            setLoading(true)
            const data = await PartsService.getPartsRequestById(partsRequestId, shopId!)
            
            if (data) {
                setPartsRequest(data)
            } else {
                setError('Parts request not found')
                toast.error('Parts request not found')
            }
        } catch (error) {
            console.error('Error fetching parts request:', error)
            setError('Failed to fetch parts request')
            toast.error('Failed to fetch parts request')
        } finally {
            setLoading(false)
        }
    }

    const handleOrderParts = async () => {
        if (!partsRequest || !shopId) return

        try {
            await PartsService.updatePartsRequestStatus(
                partsRequest.id,
                shopId,
                'ordered',
                'Order placed via parts request page'
            )
            
            toast.success('Parts order placed successfully!')
            fetchPartsRequest() // Refresh the data
        } catch (error) {
            console.error('Error placing order:', error)
            toast.error('Failed to place order')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD'
        }).format(amount)
    }

    const renderQuoteDetails = (quote: any) => {
        if (!quote) return null

        return (
            <div className="mt-4 p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Quote Details
                </h4>
                <div className="space-y-3">
                    {/* Parts Information */}
                    {quote.parts_info && (
                        <div>
                            <span className="text-xs font-medium text-gray-400">Parts Information:</span>
                            <div className="mt-1 text-sm text-gray-300">
                                {Array.isArray(quote.parts_info) ? (
                                    quote.parts_info.map((part: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center py-1">
                                            <span>{part.name || part.part_name || part.description || 'Unknown Part'} ({part.quantity || 1}x)</span>
                                            <span className="text-green-400">{formatCurrency(part.price || part.unit_price || 0)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between items-center py-1">
                                        <span>{quote.parts_info.name || quote.parts_info.part_name || 'Unknown Part'} ({quote.parts_info.quantity || 1}x)</span>
                                        <span className="text-green-400">{formatCurrency(quote.parts_info.price || quote.parts_info.unit_price || 0)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Quote Details */}
                    {quote.quote_details && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {quote.quote_details.availability && (
                                <div>
                                    <span className="text-xs font-medium text-gray-400">Availability:</span>
                                    <div className="text-green-400">{quote.quote_details.availability}</div>
                                </div>
                            )}
                            {quote.quote_details.delivery_eta && (
                                <div>
                                    <span className="text-xs font-medium text-gray-400">Delivery ETA:</span>
                                    <div className="text-blue-400">{quote.quote_details.delivery_eta}</div>
                                </div>
                            )}
                            {quote.quote_details.total_cost && (
                                <div>
                                    <span className="text-xs font-medium text-gray-400">Total Cost:</span>
                                    <div className="text-green-400">{formatCurrency(quote.quote_details.total_cost)}</div>
                                </div>
                            )}
                            {quote.quote_details.currency && (
                                <div>
                                    <span className="text-xs font-medium text-gray-400">Currency:</span>
                                    <div className="text-gray-300">{quote.quote_details.currency.toUpperCase()}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Supplier Information */}
                    {quote.supplier_info && (
                        <div>
                            <span className="text-xs font-medium text-gray-400">Supplier:</span>
                            <div className="text-sm text-gray-300">
                                {quote.supplier_info.supplier_name || quote.supplier_info.account_used || 'Unknown Supplier'}
                            </div>
                        </div>
                    )}

                    {/* Call Outcome Notes */}
                    {quote.call_outcome?.notes && (
                        <div>
                            <span className="text-xs font-medium text-gray-400">Notes:</span>
                            <div className="text-sm text-gray-300">{quote.call_outcome.notes}</div>
                        </div>
                    )}

                    {/* Quote Status */}
                    {quote.call_outcome && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {typeof quote.call_outcome.quote_provided !== 'undefined' && (
                                <div>
                                    <span className="text-xs font-medium text-gray-400">Quote Provided:</span>
                                    <div className={quote.call_outcome.quote_provided ? "text-green-400" : "text-red-400"}>
                                        {quote.call_outcome.quote_provided ? "Yes" : "No"}
                                    </div>
                                </div>
                            )}
                            {typeof quote.call_outcome.quote_accepted !== 'undefined' && (
                                <div>
                                    <span className="text-xs font-medium text-gray-400">Quote Accepted:</span>
                                    <div className={quote.call_outcome.quote_accepted ? "text-green-400" : "text-yellow-400"}>
                                        {quote.call_outcome.quote_accepted ? "Yes" : "Pending"}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (authLoading || loading) {
        return (
            <PageLayout>
                <div className="flex items-center justify-center">
                    <LoadingCard 
                        title="Loading Parts Request" 
                        description="Fetching request details..." 
                    />
                </div>
            </PageLayout>
        )
    }

    if (authError || error || !partsRequest) {
        return (
            <PageLayout>
                <div className="flex items-center justify-center">
                    <ErrorCard 
                        title="Error Loading Parts Request" 
                        description={authError || error || 'Parts request not found'} 
                    />
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout
            breadcrumbs={[
                { label: 'Home', href: '/dashboard' },
                { label: 'Voice Calling', href: '/voice-calling' },
                { label: 'Parts Request', href: '/voice-calling/parts' },
                { label: `${partsRequestId}` }
            ]}
            title={`Parts Request`}
            description={`Request #${partsRequestId}`}
        >
            <div className="max-w-4xl mx-auto">
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {partsRequest.parts_requested[0]?.part_name || 'Unknown Part'}
                            </CardTitle>
                            <div className="flex gap-2">
                                <Badge className={getStatusColor(partsRequest.status)}>
                                    {partsRequest.status.charAt(0).toUpperCase() + partsRequest.status.slice(1)}
                                </Badge>
                                <Badge variant="outline" className={`${getPriorityColor(partsRequest.priority)} border-0`}>
                                    {partsRequest.priority.charAt(0).toUpperCase() + partsRequest.priority.slice(1)}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Basic Part Info */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Part Details
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Part Name:</span>
                                            <span className="text-white">{partsRequest.parts_requested[0]?.part_name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Part Number:</span>
                                            <span className="text-white">{partsRequest.parts_requested[0]?.part_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Quantity:</span>
                                            <span className="text-white">{partsRequest.parts_requested[0]?.quantity || 0}</span>
                                        </div>
                                        {partsRequest.parts_requested[0]?.description && (
                                            <div className="mt-2">
                                                <span className="text-gray-400 text-sm">Description:</span>
                                                <p className="text-gray-300 text-sm mt-1">{partsRequest.parts_requested[0].description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Vehicle Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                                        <Car className="h-4 w-4" />
                                        Vehicle Information
                                    </h3>
                                    {partsRequest.vehicle_info && (partsRequest.vehicle_info.year || partsRequest.vehicle_info.make || partsRequest.vehicle_info.model) ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Vehicle:</span>
                                                <span className="text-white">
                                                    {partsRequest.vehicle_info.year} {partsRequest.vehicle_info.make} {partsRequest.vehicle_info.model}
                                                </span>
                                            </div>
                                            {partsRequest.vehicle_info.engine && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Engine:</span>
                                                    <span className="text-white">{partsRequest.vehicle_info.engine}</span>
                                                </div>
                                            )}
                                            {partsRequest.vehicle_info.vin && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">VIN:</span>
                                                    <span className="text-white font-mono text-sm">{partsRequest.vehicle_info.vin}</span>
                                                </div>
                                            )}
                                            {partsRequest.vehicle_info.mileage && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Mileage:</span>
                                                    <span className="text-white">{partsRequest.vehicle_info.mileage.toLocaleString()} km</span>
                                                </div>
                                            )}
                                            {partsRequest.vehicle_info.customer_name && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Customer:</span>
                                                    <span className="text-white">{partsRequest.vehicle_info.customer_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No vehicle information available</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Supplier Information */}
                                {partsRequest.supplier_info && (
                                    <div>
                                        <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Supplier Information
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Supplier:</span>
                                                <span className="text-white">{partsRequest.supplier_info.supplier_name}</span>
                                            </div>
                                            {partsRequest.supplier_info.contact_person && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Contact:</span>
                                                    <span className="text-white">{partsRequest.supplier_info.contact_person}</span>
                                                </div>
                                            )}
                                            {partsRequest.supplier_info.phone_number && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Phone:</span>
                                                    <span className="text-white">{partsRequest.supplier_info.phone_number}</span>
                                                </div>
                                            )}
                                            {partsRequest.supplier_info.email && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Email:</span>
                                                    <span className="text-white">{partsRequest.supplier_info.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Pricing Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Pricing
                                    </h3>
                                    <div className="space-y-2">
                                        {partsRequest.total_estimated_price && partsRequest.total_estimated_price > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Estimated Total:</span>
                                                <span className="text-green-400 text-lg font-bold">
                                                    {formatCurrency(partsRequest.total_estimated_price)}
                                                </span>
                                            </div>
                                        )}
                                        {partsRequest.actual_cost && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Actual Cost:</span>
                                                <span className="text-green-400 text-lg font-bold">
                                                    {formatCurrency(partsRequest.actual_cost)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div>
                                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Timeline
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Created:</span>
                                            <span className="text-white">{formatDate(partsRequest.created_at)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Updated:</span>
                                            <span className="text-white">{formatDate(partsRequest.updated_at)}</span>
                                        </div>
                                        {partsRequest.estimated_delivery && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Est. Delivery:</span>
                                                <span className="text-white">{formatDate(partsRequest.estimated_delivery)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quote Information */}
                        {partsRequest.quote_provided && renderQuoteDetails(partsRequest.quote_provided)}

                        {/* Notes */}
                        {(partsRequest.notes || partsRequest.customer_notes || partsRequest.admin_notes) && (
                            <div>
                                <h3 className="text-lg font-medium text-white mb-3">Notes</h3>
                                <div className="space-y-2">
                                    {partsRequest.notes && (
                                        <div className="text-sm text-gray-300 bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a]">
                                            <span className="text-gray-500 font-medium">Internal Notes:</span> {partsRequest.notes}
                                        </div>
                                    )}
                                    {partsRequest.customer_notes && (
                                        <div className="text-sm text-blue-300 bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a]">
                                            <span className="text-blue-500 font-medium">Customer Notes:</span> {partsRequest.customer_notes}
                                        </div>
                                    )}
                                    {partsRequest.admin_notes && (
                                        <div className="text-sm text-orange-300 bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a]">
                                            <span className="text-orange-500 font-medium">Admin Notes:</span> {partsRequest.admin_notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {partsRequest.status === 'quoted' && partsRequest.quote_provided && (
                            <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                                <Button
                                    onClick={handleOrderParts}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Place Order
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                                >
                                    <Link href="/voice-calling/requests">
                                        <Package className="h-4 w-4 mr-2" />
                                        Back to Call Logs
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
