'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, FileText, Building2, DollarSign, Calendar, CheckCircle } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'
import { PartsRequest } from '@/app/(features)/parts/types/parts'
import { toast } from 'sonner'

export default function PartsQuotePage() {
    const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'quoted' | 'ordered'>('all')

    useEffect(() => {
        fetchPartsRequests()
    }, [])

    const fetchPartsRequests = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/parts/requests')
            const data = await response.json()
            if (response.ok) {
                setPartsRequests(data.partsRequests || [])
            } else {
                toast.error(data.error || 'Failed to fetch parts requests')
            }
        } catch (error) {
            console.error('Error fetching parts requests:', error)
            toast.error('Failed to fetch parts requests')
        } finally {
            setLoading(false)
        }
    }

    const handleOrderParts = async (requestId: string) => {
        try {
            const response = await fetch(`/api/parts/requests/${requestId}/order`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ordered' })
            })

            if (response.ok) {
                toast.success('Parts order placed successfully!')
                fetchPartsRequests() // Refresh the list
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to place order')
            }
        } catch (error) {
            console.error('Error placing order:', error)
            toast.error('Failed to place order')
        }
    }

    const getStatusColor = (status: PartsRequest['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-600'
            case 'processing': return 'bg-blue-600'
            case 'quoted': return 'bg-purple-600'
            case 'approved': return 'bg-green-600'
            case 'ordered': return 'bg-emerald-600'
            case 'received': return 'bg-green-800'
            case 'cancelled': return 'bg-red-600'
            default: return 'bg-gray-600'
        }
    }

    const getPriorityColor = (priority: PartsRequest['priority']) => {
        switch (priority) {
            case 'low': return 'bg-gray-600'
            case 'normal': return 'bg-blue-600'
            case 'high': return 'bg-orange-600'
            case 'urgent': return 'bg-red-600'
            default: return 'bg-gray-600'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD'
        }).format(amount)
    }

    const filteredRequests = partsRequests.filter(request => {
        if (filter === 'all') return true
        return request.status === filter
    })

    const renderQuoteDetails = (quote: any) => {
        if (!quote) return null

        return (
            <div className="mt-4 p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Quote Details
                </h4>
                <div className="space-y-3">
                    {/* Parts Information - handle different data structures */}
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

                    {/* Raw Quote Data (for debugging)
                    {process.env.NODE_ENV === 'development' && (
                        <details className="text-xs">
                            <summary className="text-gray-500 cursor-pointer">Raw Quote Data (Dev Only)</summary>
                            <pre className="mt-2 p-2 bg-[#1a1a1a] rounded text-gray-400 text-xs overflow-auto">
                                {JSON.stringify(quote, null, 2)}
                            </pre>
                        </details>
                    )} */}
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-6xl mx-auto w-full">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb className="mb-6">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/dashboard" className="text-gray-400 hover:text-gray-300">
                                            Home
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="h-4 w-4" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/parts" className="text-gray-400 hover:text-gray-300">
                                            Parts
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="h-4 w-4" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">
                                        Quotes & Orders
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    Parts Quotes & Orders
                                </h1>
                                <p className="text-gray-400">
                                    Review quotes from suppliers and place orders
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                                >
                                    <Link href="/parts">
                                        <Package className="h-4 w-4 mr-2" />
                                        Back to Parts
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2 mb-6">
                            {(['all', 'pending', 'quoted', 'ordered'] as const).map((status) => (
                                <Button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    variant={filter === status ? 'default' : 'outline'}
                                    className={
                                        filter === status
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]'
                                    }
                                    size="sm"
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Button>
                            ))}
                        </div>

                        {/* Parts Requests List */}
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="text-gray-400">Loading parts requests...</div>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="text-center py-8">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-2">
                                        No {filter === 'all' ? '' : filter} parts requests found
                                    </h3>
                                    <p className="text-gray-400 mb-4">
                                        {filter === 'all' 
                                            ? 'No parts requests available'
                                            : `No ${filter} parts requests at this time`
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {filteredRequests.map((request) => (
                                    <Card key={request.id} className="bg-[#111111] border-[#2a2a2a]">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-white flex items-center gap-2">
                                                    <Package className="h-5 w-5" />
                                                    {request.parts_requested[0]?.part_name || 'Unknown Part'}
                                                </CardTitle>
                                                <div className="flex gap-2">
                                                    <Badge className={getStatusColor(request.status)}>
                                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                    </Badge>
                                                    <Badge variant="outline" className={`${getPriorityColor(request.priority)} border-0`}>
                                                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Basic Part Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="text-sm text-gray-400">Part Details</div>
                                                    <div className="space-y-1">
                                                        <div className="text-sm text-gray-300">
                                                            <strong>Part #:</strong> {request.parts_requested[0]?.part_number || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-300">
                                                            <strong>Quantity:</strong> {request.parts_requested[0]?.quantity || 0}
                                                        </div>
                                                        {request.parts_requested[0]?.description && (
                                                            <div className="text-sm text-gray-400">
                                                                {request.parts_requested[0].description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="text-sm text-gray-400">Vehicle Info</div>
                                                    {request.vehicle_info && (request.vehicle_info.year || request.vehicle_info.make || request.vehicle_info.model) ? (
                                                        <div className="text-sm text-gray-300">
                                                            {request.vehicle_info.year} {request.vehicle_info.make} {request.vehicle_info.model}
                                                            {request.vehicle_info.engine && ` - ${request.vehicle_info.engine}`}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-400">No vehicle info</div>
                                                    )}
                                                    {request.vehicle_info?.customer_name && (
                                                        <div className="text-sm text-gray-300">
                                                            <strong>Customer:</strong> {request.vehicle_info.customer_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Supplier Info */}
                                            {request.supplier_info?.supplier_name && (
                                                <div>
                                                    <div className="text-sm text-gray-400 mb-1">Supplier</div>
                                                    <div className="flex items-center gap-2 text-gray-300">
                                                        <Building2 className="h-4 w-4" />
                                                        <span className="text-sm">{request.supplier_info.supplier_name}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Quote Information */}
                                            {request.quote_provided && renderQuoteDetails(request.quote_provided)}

                                            {/* Pricing */}
                                            {request.total_estimated_price && request.total_estimated_price > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-green-400" />
                                                    <span className="text-lg font-medium text-green-400">
                                                        Total: {formatCurrency(request.total_estimated_price)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {(request.notes || request.customer_notes || request.admin_notes) && (
                                                <div className="space-y-2">
                                                    {request.notes && (
                                                        <div className="text-xs text-gray-400 bg-[#0a0a0a] p-2 rounded">
                                                            <span className="text-gray-500 font-medium">Notes:</span> {request.notes}
                                                        </div>
                                                    )}
                                                    {request.customer_notes && (
                                                        <div className="text-xs text-blue-400 bg-[#0a0a0a] p-2 rounded">
                                                            <span className="text-blue-500 font-medium">Customer:</span> {request.customer_notes}
                                                        </div>
                                                    )}
                                                    {request.admin_notes && (
                                                        <div className="text-xs text-orange-400 bg-[#0a0a0a] p-2 rounded">
                                                            <span className="text-orange-500 font-medium">Admin:</span> {request.admin_notes}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Dates */}
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Created {formatDate(request.created_at)}
                                                </div>
                                                {request.estimated_delivery && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Est. delivery: {formatDate(request.estimated_delivery)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {request.status === 'quoted' && request.quote_provided && (
                                                <div className="flex gap-2 pt-2 border-t border-[#2a2a2a]">
                                                    <Button
                                                        onClick={() => handleOrderParts(request.id)}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        size="sm"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                        Place Order
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
