'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface PartsRequest {
    id: string
    created_at: string
    updated_at: string
    shop_id: string
    user_id: string
    vehicle_info: {
        year?: string
        make?: string
        model?: string
        engine?: {
            vehicleId?: string
            engineName?: string
            capacityLt?: string
            numberOfCylinders?: number
        }
    }
    parts_requested: Array<{
        id: string
        name: string
        partNumber: string
        supplier: string
        price: number
        availability: string
    }>
    total_estimated_price: number
    status: string
    priority: string
    notes?: string
    customer_notes?: string
    assigned_to?: string
    admin_notes?: string
    shop?: {
        shop_name: string
        shop_owner: string
        shop_phone?: string
        shop_email?: string
    }
}

interface AdminNotification {
    id: string
    created_at: string
    parts_request_id: string
    message: string
    message_type: string
    parts_request?: {
        id: string
        shop?: {
            shop_name: string
        }
    }
}

const STATUS_OPTIONS = [
    'pending',
    'processing', 
    'sourcing',
    'quoted',
    'approved',
    'ordered',
    'fulfilled',
    'cancelled'
]

const PRIORITY_OPTIONS = [
    'low',
    'normal', 
    'high',
    'urgent'
]

export default function AdminPartsRequests() {
    const [requests, setRequests] = useState<PartsRequest[]>([])
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<PartsRequest | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')
    const [showNotifications, setShowNotifications] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        fetchRequests()
        fetchNotifications()
    }, [])

    const fetchRequests = async () => {
        try {
            setLoading(true)
            setError(null)

            let query = supabase
                .from('parts_requests')
                .select(`
                    *,
                    shops!inner(shop_name, shop_owner, shop_phone, shop_email)
                `)
                .order('created_at', { ascending: false })

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter)
            }

            if (priorityFilter !== 'all') {
                query = query.eq('priority', priorityFilter)
            }

            const { data, error: fetchError } = await query

            if (fetchError) {
                throw fetchError
            }

            setRequests(data || [])
        } catch (err) {
            console.error('Error fetching requests:', err)
            setError('Failed to fetch parts requests')
        } finally {
            setLoading(false)
        }
    }

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('parts_request_messages')
                .select(`
                    *,
                    parts_requests!inner(
                        id,
                        shops!inner(shop_name)
                    )
                `)
                .eq('message_type', 'notification')
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) {
                throw error
            }

            setNotifications(data || [])
        } catch (err) {
            console.error('Error fetching notifications:', err)
        }
    }

    const markNotificationAsRead = async (notificationId: string) => {
        try {
            // Remove the notification from the list (mark as read)
            setNotifications(prev => prev.filter(n => n.id !== notificationId))
            
            // Optionally, you could add a "read" status to the database here
            // For now, we'll just remove it from the UI
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    }

    const updateRequestStatus = async (requestId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('parts_requests')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId)

            if (error) throw error

            // Refresh requests
            await fetchRequests()

            // Update selected request if it's the one being updated
            if (selectedRequest?.id === requestId) {
                setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null)
            }

        } catch (err) {
            console.error('Error updating status:', err)
            setError('Failed to update request status')
        }
    }

    const updateAdminNotes = async (requestId: string, adminNotes: string) => {
        try {
            const { error } = await supabase
                .from('parts_requests')
                .update({ 
                    admin_notes: adminNotes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId)

            if (error) throw error

            // Update selected request
            if (selectedRequest?.id === requestId) {
                setSelectedRequest(prev => prev ? { ...prev, admin_notes: adminNotes } : null)
            }

        } catch (err) {
            console.error('Error updating admin notes:', err)
            setError('Failed to update admin notes')
        }
    }

    const getStatusColor = (status: string) => {
        const colors = {
            'pending': 'bg-yellow-900/20 text-yellow-300 border-yellow-700',
            'processing': 'bg-blue-900/20 text-blue-300 border-blue-700',
            'sourcing': 'bg-purple-900/20 text-purple-300 border-purple-700',
            'quoted': 'bg-orange-900/20 text-orange-300 border-orange-700',
            'approved': 'bg-green-900/20 text-green-300 border-green-700',
            'ordered': 'bg-indigo-900/20 text-indigo-300 border-indigo-700',
            'fulfilled': 'bg-emerald-900/20 text-emerald-300 border-emerald-700',
            'cancelled': 'bg-red-900/20 text-red-300 border-red-700'
        }
        return colors[status as keyof typeof colors] || 'bg-gray-900/20 text-gray-300 border-gray-700'
    }

    const getPriorityColor = (priority: string) => {
        const colors = {
            'low': 'text-gray-400',
            'normal': 'text-blue-400',
            'high': 'text-orange-400',
            'urgent': 'text-red-400'
        }
        return colors[priority as keyof typeof colors] || 'text-gray-400'
    }

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Parts Requests Admin</h1>
                    <p className="text-[#979797]">Manage and fulfill shop parts requests</p>
                </div>

                {/* Filters */}
                <div className="mb-6 flex gap-4 flex-wrap">
                    <div>
                        <label className="block text-sm font-medium text-white mb-1">Status Filter</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded text-white text-sm"
                        >
                            <option value="all">All Statuses</option>
                            {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-1">Priority Filter</label>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded text-white text-sm"
                        >
                            <option value="all">All Priorities</option>
                            {PRIORITY_OPTIONS.map(priority => (
                                <option key={priority} value={priority}>
                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            onClick={() => {
                                fetchRequests()
                                fetchNotifications()
                            }}
                            className="px-4 py-2 bg-[#b22222] hover:bg-[#cc2222] text-white text-sm rounded transition-colors"
                        >
                            Refresh All
                        </button>
                        {!showNotifications && notifications.length > 0 && (
                            <button
                                onClick={() => setShowNotifications(true)}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            >
                                Show Notifications ({notifications.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications Section */}
                {showNotifications && notifications.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-blue-300">
                                🔔 New Notifications ({notifications.length})
                            </h2>
                            <button
                                onClick={() => setShowNotifications(false)}
                                className="text-blue-300 hover:text-blue-200 text-sm"
                            >
                                Hide
                            </button>
                        </div>
                        <div className="space-y-2">
                            {notifications.slice(0, 5).map((notification) => (
                                <div
                                    key={notification.id}
                                    className="flex items-start justify-between p-3 bg-[#1a1a1a] rounded border border-[#2a2a2a]"
                                >
                                    <div className="flex-1">
                                        <div className="text-white text-sm mb-1">
                                            {notification.message}
                                        </div>
                                        <div className="text-[#979797] text-xs">
                                            {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-3">
                                        <button
                                            onClick={() => {
                                                const request = requests.find(r => r.id === notification.parts_request_id)
                                                if (request) setSelectedRequest(request)
                                            }}
                                            className="px-2 py-1 bg-[#b22222] hover:bg-[#cc2222] text-white text-xs rounded"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => markNotificationAsRead(notification.id)}
                                            className="px-2 py-1 bg-[#666] hover:bg-[#777] text-white text-xs rounded"
                                        >
                                            ✓
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {notifications.length > 5 && (
                            <div className="text-center mt-3">
                                <span className="text-[#979797] text-sm">
                                    And {notifications.length - 5} more notifications...
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded text-red-300">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">
                        <div className="text-[#979797]">Loading parts requests...</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Requests List */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">
                                Requests ({requests.length})
                            </h2>
                            
                            {requests.length === 0 ? (
                                <div className="text-center py-8 text-[#979797]">
                                    No parts requests found
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {requests.map((request) => (
                                        <div
                                            key={request.id}
                                            onClick={() => setSelectedRequest(request)}
                                            className={`p-4 bg-[#1a1a1a] border rounded cursor-pointer transition-colors hover:bg-[#2a2a2a] ${
                                                selectedRequest?.id === request.id ? 'border-[#b22222]' : 'border-[#2a2a2a]'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-medium text-white">
                                                        {request.shop?.shop_name || 'Unknown Shop'}
                                                    </div>
                                                    <div className="text-sm text-[#979797]">
                                                        {request.vehicle_info.year} {request.vehicle_info.make} {request.vehicle_info.model}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`inline-block px-2 py-1 text-xs rounded border ${getStatusColor(request.status)}`}>
                                                        {request.status}
                                                    </div>
                                                    <div className={`text-xs mt-1 ${getPriorityColor(request.priority)}`}>
                                                        {request.priority} priority
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-sm text-[#979797]">
                                                {request.parts_requested.length} items • ${request.total_estimated_price.toFixed(2)} CAD
                                            </div>
                                            
                                            <div className="text-xs text-[#666] mt-1">
                                                {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Request Details */}
                        <div>
                            {selectedRequest ? (
                                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-6">
                                    <h2 className="text-xl font-semibold mb-4">Request Details</h2>
                                    
                                    {/* Shop Information */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium mb-2">Shop Information</h3>
                                        <div className="space-y-1 text-sm">
                                            <div><span className="text-[#979797]">Shop:</span> {selectedRequest.shop?.shop_name}</div>
                                            <div><span className="text-[#979797]">Owner:</span> {selectedRequest.shop?.shop_owner}</div>
                                            {selectedRequest.shop?.shop_phone && (
                                                <div><span className="text-[#979797]">Phone:</span> {selectedRequest.shop.shop_phone}</div>
                                            )}
                                            {selectedRequest.shop?.shop_email && (
                                                <div><span className="text-[#979797]">Email:</span> {selectedRequest.shop.shop_email}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Vehicle Information */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium mb-2">Vehicle</h3>
                                        <div className="text-sm">
                                            {selectedRequest.vehicle_info.year} {selectedRequest.vehicle_info.make} {selectedRequest.vehicle_info.model}
                                            {selectedRequest.vehicle_info.engine && (
                                                <div className="text-[#979797] mt-1">
                                                    Engine: {selectedRequest.vehicle_info.engine.engineName}
                                                    {selectedRequest.vehicle_info.engine.capacityLt && ` (${selectedRequest.vehicle_info.engine.capacityLt}L)`}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Parts Requested */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium mb-2">Parts Requested ({selectedRequest.parts_requested.length})</h3>
                                        <div className="space-y-2">
                                            {selectedRequest.parts_requested.map((part, index) => (
                                                <div key={index} className="p-3 bg-[#2a2a2a] rounded text-sm">
                                                    <div className="font-medium">{part.name}</div>
                                                    <div className="text-[#979797]">Part #: {part.partNumber}</div>
                                                    <div className="text-[#979797]">Supplier: {part.supplier}</div>
                                                    <div className="text-[#b22222] font-semibold">${part.price.toFixed(2)} CAD</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-sm font-semibold">
                                            Total Estimated: ${selectedRequest.total_estimated_price.toFixed(2)} CAD
                                        </div>
                                    </div>

                                    {/* Customer Notes */}
                                    {selectedRequest.customer_notes && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-medium mb-2">Customer Notes</h3>
                                            <div className="p-3 bg-[#2a2a2a] rounded text-sm">
                                                {selectedRequest.customer_notes}
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Management */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium mb-2">Status Management</h3>
                                        <div className="flex gap-2 flex-wrap">
                                            {STATUS_OPTIONS.map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => updateRequestStatus(selectedRequest.id, status)}
                                                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                                                        selectedRequest.status === status 
                                                            ? getStatusColor(status)
                                                            : 'bg-[#2a2a2a] text-[#979797] border-[#3a3a3a] hover:bg-[#3a3a3a]'
                                                    }`}
                                                >
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Admin Notes */}
                                    <div>
                                        <h3 className="text-lg font-medium mb-2">Admin Notes</h3>
                                        <textarea
                                            defaultValue={selectedRequest.admin_notes || ''}
                                            onBlur={(e) => updateAdminNotes(selectedRequest.id, e.target.value)}
                                            placeholder="Add internal notes, supplier contacts, pricing updates, etc..."
                                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded text-white text-sm resize-none"
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-6 text-center text-[#979797]">
                                    Select a request to view details
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
