'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Building2, Hash, Clock } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'
import PartsIntakeModal from './components/PartsOrdering/PartsIntakeModal'
import { PartsRequest } from '@/app/(features)/parts/types/parts'
import { toast } from 'sonner'

export default function PartsPage() {
    const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)

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

    const handlePartsRequestAdded = (newRequest: PartsRequest) => {
        setPartsRequests(prev => [newRequest, ...prev])
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
                                <BreadcrumbPage className="text-white">
                                    Parts Requests
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Parts Requests
                            </h1>
                            <p className="text-gray-400">
                                Manage parts requests to suppliers and track orders
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                asChild
                                variant="outline"
                                className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                            >
                                <Link href="/suppliers">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Manage Suppliers
                                </Link>
                            </Button>
                            <Button
                                onClick={() => setShowAddForm(true)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Request Parts
                            </Button>
                        </div>
                    </div>

                    {/* Parts Request Modal */}
                    <PartsIntakeModal
                        open={showAddForm}
                        onOpenChange={setShowAddForm}
                        onSuccess={handlePartsRequestAdded}
                    />

                    {/* Parts Requests List */}
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="text-gray-400">Loading parts requests...</div>
                        </div>
                    ) : partsRequests.length === 0 ? (
                        <Card className="bg-[#111111] border-[#2a2a2a]">
                            <CardContent className="text-center py-8">
                                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">No parts requests yet</h3>
                                <p className="text-gray-400 mb-4">
                                    Create your first parts request to order from suppliers
                                </p>
                                <Button
                                    onClick={() => setShowAddForm(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Request First Part
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {partsRequests.map((request) => (
                                <Card key={request.id} className="bg-[#111111] border-[#2a2a2a]">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <Package className="h-5 w-5" />
                                            {request.parts_requested[0]?.part_name || 'Unknown Part'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Hash className="h-4 w-4" />
                                                <span className="text-sm font-mono">{request.parts_requested[0]?.part_number || 'N/A'}</span>
                                            </div>

                                            {request.supplier_info?.supplier_name && (
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <Building2 className="h-4 w-4" />
                                                    <span className="text-sm">{request.supplier_info.supplier_name}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-gray-300">
                                                <span className="text-sm">Qty: {request.parts_requested[0]?.quantity || 0}</span>
                                                {request.parts_requested[0]?.estimated_price && (
                                                    <span className="text-sm">• ${request.parts_requested[0].estimated_price.toFixed(2)} CAD</span>
                                                )}
                                            </div>

                                            {request.total_estimated_price && request.total_estimated_price > 0 && (
                                                <div className="text-sm font-medium text-green-400">
                                                    Total: ${request.total_estimated_price.toFixed(2)} CAD
                                                </div>
                                            )}
                                        </div>

                                        {request.parts_requested[0]?.description && (
                                            <p className="text-xs text-gray-400 line-clamp-2">
                                                {request.parts_requested[0].description}
                                            </p>
                                        )}

                                        {request.vehicle_info && (request.vehicle_info.year || request.vehicle_info.make || request.vehicle_info.model) && (
                                            <div className="text-xs text-gray-400">
                                                Vehicle: {request.vehicle_info.year} {request.vehicle_info.make} {request.vehicle_info.model}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            <Badge
                                                className={getStatusColor(request.status)}
                                            >
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={`${getPriorityColor(request.priority)} border-0`}
                                            >
                                                {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Clock className="h-3 w-3" />
                                            Created {formatDate(request.created_at)}
                                        </div>

                                        {(request.notes || request.customer_notes) && (
                                            <div className="space-y-1">
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