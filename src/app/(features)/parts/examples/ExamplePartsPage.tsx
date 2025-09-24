'use client'

// Example of how to use the PartsService in a React component
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Import the service and hooks
import { usePartsService, usePartsRequestsByStatus } from '../lib'
import { PartsRequest } from '../types/parts'

export default function ExamplePartsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<PartsRequest['status'] | 'all'>('all')

  // Main hook with filtering and search
  const {
    partsRequests,
    loading,
    error,
    pagination,
    fetchPartsRequests,
    createPartsRequest,
    updateStatus,
    deletePartsRequest,
    refresh
  } = usePartsService({
    autoFetch: true,
    filters: {
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchTerm || undefined
    },
    limit: 20
  })

  // Specialized hook for pending requests
  const { 
    partsRequests: pendingRequests, 
    loading: pendingLoading 
  } = usePartsRequestsByStatus('pending')

  // Handle search
  const handleSearch = () => {
    fetchPartsRequests({
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchTerm || undefined
    })
  }

  // Handle status update
  const handleStatusUpdate = async (id: string, newStatus: PartsRequest['status']) => {
    await updateStatus(id, newStatus)
  }

  // Handle create new request
  const handleCreateRequest = async () => {
    const newRequest = await createPartsRequest({
      vehicle_info: {
        year: 2020,
        make: 'Honda',
        model: 'Civic',
        customer_name: 'John Doe'
      },
      parts_requested: [{
        part_number: 'ABC123',
        part_name: 'Brake Pad Set',
        description: 'Front brake pads',
        quantity: 1,
        estimated_price: 75.00,
        urgency: 'normal'
      }],
      supplier_info: {
        supplier_name: 'AutoParts Plus',
        contact_person: 'Jane Smith',
        phone_number: '555-1234'
      },
      priority: 'normal',
      notes: 'Customer requested ASAP'
    })

    if (newRequest) {
      console.log('Created new request:', newRequest)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Parts Requests</h1>
        <Button onClick={handleCreateRequest} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="flex gap-2">
            <Input
              placeholder="Search parts, suppliers, customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-48 bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#111111] border-[#2a2a2a]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-sm text-gray-400">Total Requests</div>
                <div className="text-xl font-bold text-white">{pagination.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#111111] border-[#2a2a2a]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-400" />
              <div>
                <div className="text-sm text-gray-400">Pending</div>
                <div className="text-xl font-bold text-white">{pendingRequests.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <div className="text-red-400">Error: {error}</div>
          <Button onClick={refresh} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-400">Loading parts requests...</div>
        </div>
      )}

      {/* Parts Requests List */}
      <div className="space-y-4">
        {partsRequests.map((request) => (
          <Card key={request.id} className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {request.parts_requested[0]?.part_name || 'Unknown Part'}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className={`status-${request.status}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                  <Badge variant="outline" className={`priority-${request.priority}`}>
                    {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Part Details</div>
                  <div className="text-sm text-gray-300">
                    <strong>Part #:</strong> {request.parts_requested[0]?.part_number || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-300">
                    <strong>Quantity:</strong> {request.parts_requested[0]?.quantity || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Supplier</div>
                  <div className="text-sm text-gray-300">
                    {request.supplier_info?.supplier_name || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-[#2a2a2a]">
                {request.status === 'pending' && (
                  <Button
                    onClick={() => handleStatusUpdate(request.id, 'processing')}
                    size="sm"
                    variant="outline"
                  >
                    Start Processing
                  </Button>
                )}
                {request.status === 'quoted' && (
                  <Button
                    onClick={() => handleStatusUpdate(request.id, 'ordered')}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Place Order
                  </Button>
                )}
                <Button
                  onClick={() => deletePartsRequest(request.id)}
                  size="sm"
                  variant="destructive"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => fetchPartsRequests(
              { status: statusFilter === 'all' ? undefined : statusFilter },
              pagination.page - 1
            )}
            disabled={pagination.page <= 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="py-2 px-4 text-white">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <Button
            onClick={() => fetchPartsRequests(
              { status: statusFilter === 'all' ? undefined : statusFilter },
              pagination.page + 1
            )}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
