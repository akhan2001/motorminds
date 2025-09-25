'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Package, 
  Building2, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Edit, 
  Search,
  Filter,
  RefreshCw,
  FileText,
  User,
  Phone,
  Mail
} from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'
import { PartsRequest } from '@/app/(features)/parts/types/parts'
import { toast } from 'sonner'
import AdminNav from '../components/AdminNav'

interface QuoteFormData {
  parts_info: Array<{
    part_name: string
    quantity: number
    unit_price: number
    availability: string
  }>
  quote_details: {
    total_cost: number
    currency: string
    availability: string
    delivery_eta: string
    delivery_days: number
  }
  supplier_info: {
    supplier_name: string
    contact_person?: string
    phone_number?: string
  }
  call_outcome: {
    notes: string
    quote_provided: boolean
    quote_accepted: boolean
    follow_up_needed: boolean
  }
}

export default function AdminPartsRequestsPage() {
  const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'quoted' | 'ordered'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<PartsRequest | null>(null)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
    parts_info: [],
    quote_details: {
      total_cost: 0,
      currency: 'CAD',
      availability: '',
      delivery_eta: '',
      delivery_days: 1
    },
    supplier_info: {
      supplier_name: ''
    },
    call_outcome: {
      notes: '',
      quote_provided: true,
      quote_accepted: false,
      follow_up_needed: false
    }
  })
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)

  useEffect(() => {
    fetchPartsRequests()
  }, [])

  const fetchPartsRequests = async () => {
    try {
      setLoading(true)
      console.log('Fetching admin parts requests...')
      
      // Admin endpoint to get all parts requests across all shops
      const response = await fetch('/api/admin/parts-requests')
      console.log('Response status:', response.status)
      
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok) {
        setPartsRequests(data.partsRequests || [])
        console.log('Loaded parts requests:', data.partsRequests?.length || 0)
      } else {
        console.error('API error:', data)
        toast.error(data.error || 'Failed to fetch parts requests')
      }
    } catch (error) {
      console.error('Error fetching parts requests:', error)
      toast.error(`Failed to fetch parts requests: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, status: PartsRequest['status'], adminNotes?: string) => {
    try {
      const response = await fetch(`/api/admin/parts-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: adminNotes })
      })

      if (response.ok) {
        toast.success(`Status updated to ${status}`)
        fetchPartsRequests() // Refresh the list
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const openQuoteModal = (request: PartsRequest) => {
    setSelectedRequest(request)
    
    // Pre-populate form with request data
    const partsInfo = request.parts_requested.map(part => ({
      part_name: part.part_name,
      quantity: part.quantity,
      unit_price: part.estimated_price || 0,
      availability: 'In Stock'
    }))

    setQuoteForm({
      parts_info: partsInfo,
      quote_details: {
        total_cost: partsInfo.reduce((sum, part) => sum + (part.unit_price * part.quantity), 0),
        currency: 'CAD',
        availability: 'In Stock',
        delivery_eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        delivery_days: 1
      },
      supplier_info: {
        supplier_name: request.supplier_info?.supplier_name || '',
        contact_person: request.supplier_info?.contact_person || '',
        phone_number: request.supplier_info?.phone_number || ''
      },
      call_outcome: {
        notes: '',
        quote_provided: true,
        quote_accepted: false,
        follow_up_needed: false
      }
    })
    
    setIsQuoteModalOpen(true)
  }

  const submitQuote = async () => {
    if (!selectedRequest) return

    try {
      setIsSubmittingQuote(true)
      
      const response = await fetch(`/api/admin/parts-requests/${selectedRequest.id}/quote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_provided: quoteForm,
          actual_cost: quoteForm.quote_details.total_cost,
          status: 'quoted'
        })
      })

      if (response.ok) {
        toast.success('Quote submitted successfully')
        setIsQuoteModalOpen(false)
        setSelectedRequest(null)
        fetchPartsRequests() // Refresh the list
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to submit quote')
      }
    } catch (error) {
      console.error('Error submitting quote:', error)
      toast.error('Failed to submit quote')
    } finally {
      setIsSubmittingQuote(false)
    }
  }

  const updatePartPrice = (index: number, price: number) => {
    const updatedParts = [...quoteForm.parts_info]
    updatedParts[index].unit_price = price
    
    const totalCost = updatedParts.reduce((sum, part) => sum + (part.unit_price * part.quantity), 0)
    
    setQuoteForm(prev => ({
      ...prev,
      parts_info: updatedParts,
      quote_details: {
        ...prev.quote_details,
        total_cost: totalCost
      }
    }))
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  const filteredRequests = partsRequests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter
    const matchesSearch = searchTerm === '' || 
      request.parts_requested.some(part => 
        part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      request.supplier_info?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vehicle_info?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d]">
      <Nav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto w-full">
            {/* Breadcrumb Navigation */}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/admin" className="text-gray-400 hover:text-gray-300">
                      Admin
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

            {/* Admin Navigation */}
            <AdminNav />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Parts Requests Management
                </h1>
                <p className="text-gray-400">
                  Review and process parts requests from all shops
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={fetchPartsRequests}
                  variant="outline"
                  className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search parts, suppliers, customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {(['all', 'pending', 'processing', 'quoted', 'ordered'] as const).map((status) => (
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
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {(['pending', 'processing', 'quoted', 'ordered', 'received'] as const).map((status) => {
                const count = partsRequests.filter(req => req.status === status).length
                return (
                  <Card key={status} className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-400" />
                        <div>
                          <div className="text-sm text-gray-400 capitalize">{status}</div>
                          <div className="text-xl font-bold text-white">{count}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
                  <p className="text-gray-400">
                    {searchTerm ? 'Try adjusting your search terms' : 'No requests available at this time'}
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
                      {/* Shop Information */}
                      <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#2a2a2a]">
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Shop Information
                        </h4>
                        <div className="text-sm text-gray-300">
                          <div><strong>Shop ID:</strong> {request.shop_id}</div>
                          {request.user_id && <div><strong>User ID:</strong> {request.user_id}</div>}
                        </div>
                      </div>

                      {/* Parts & Vehicle Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-2">Part Details</div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-300">
                              <strong>Part #:</strong> {request.parts_requested[0]?.part_number || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-300">
                              <strong>Quantity:</strong> {request.parts_requested[0]?.quantity || 0}
                            </div>
                            {request.parts_requested[0]?.estimated_price && (
                              <div className="text-sm text-gray-300">
                                <strong>Est. Price:</strong> {formatCurrency(request.parts_requested[0].estimated_price)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-400 mb-2">Vehicle & Customer</div>
                          {request.vehicle_info?.customer_name && (
                            <div className="text-sm text-gray-300 mb-1">
                              <strong>Customer:</strong> {request.vehicle_info.customer_name}
                            </div>
                          )}
                          {(request.vehicle_info?.year || request.vehicle_info?.make || request.vehicle_info?.model) && (
                            <div className="text-sm text-gray-300">
                              <strong>Vehicle:</strong> {request.vehicle_info.year} {request.vehicle_info.make} {request.vehicle_info.model}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Supplier Information */}
                      {request.supplier_info?.supplier_name && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Preferred Supplier</div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Building2 className="h-4 w-4" />
                            <span className="text-sm">{request.supplier_info.supplier_name}</span>
                            {request.supplier_info.contact_person && (
                              <span className="text-xs text-gray-400">({request.supplier_info.contact_person})</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {(request.notes || request.customer_notes) && (
                        <div className="space-y-2">
                          {request.notes && (
                            <div className="text-xs text-gray-400 bg-[#0a0a0a] p-2 rounded">
                              <span className="text-gray-500 font-medium">Shop Notes:</span> {request.notes}
                            </div>
                          )}
                          {request.customer_notes && (
                            <div className="text-xs text-blue-400 bg-[#0a0a0a] p-2 rounded">
                              <span className="text-blue-500 font-medium">Customer Notes:</span> {request.customer_notes}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Current Quote */}
                      {request.quote_provided && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-green-400 mb-2">Current Quote</h4>
                          <div className="text-sm text-gray-300">
                            {request.total_estimated_price && (
                              <div><strong>Total:</strong> {formatCurrency(request.total_estimated_price)}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {formatDate(request.created_at)}
                        </div>
                        {request.updated_at !== request.created_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Updated {formatDate(request.updated_at)}
                          </div>
                        )}
                      </div>

                      {/* Admin Actions */}
                      <div className="flex gap-2 pt-2 border-t border-[#2a2a2a]">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => updateRequestStatus(request.id, 'processing')}
                              size="sm"
                              variant="outline"
                              className="border-blue-500 text-blue-400 hover:bg-blue-900/20"
                            >
                              Start Processing
                            </Button>
                            <Button
                              onClick={() => openQuoteModal(request)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Create Quote
                            </Button>
                          </>
                        )}
                        {request.status === 'processing' && (
                          <Button
                            onClick={() => openQuoteModal(request)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Create Quote
                          </Button>
                        )}
                        {request.status === 'quoted' && (
                          <Button
                            onClick={() => openQuoteModal(request)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Quote
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0d0d0d] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {selectedRequest?.quote_provided ? 'Edit Quote' : 'Create Quote'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6 mt-4">
              {/* Request Summary */}
              <div className="bg-[#1a1a1a] p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Request Summary</h3>
                <div className="text-sm text-gray-300">
                  <div><strong>Part:</strong> {selectedRequest.parts_requested[0]?.part_name}</div>
                  <div><strong>Part #:</strong> {selectedRequest.parts_requested[0]?.part_number}</div>
                  <div><strong>Quantity:</strong> {selectedRequest.parts_requested[0]?.quantity}</div>
                  <div><strong>Customer:</strong> {selectedRequest.vehicle_info?.customer_name || 'N/A'}</div>
                </div>
              </div>

              {/* Parts Pricing */}
              <div className="space-y-4">
                <h3 className="text-white font-medium">Parts Pricing</h3>
                {quoteForm.parts_info.map((part, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#1a1a1a] rounded-lg">
                    <div>
                      <Label className="text-gray-300 text-sm">Part Name</Label>
                      <Input
                        value={part.part_name}
                        onChange={(e) => {
                          const updatedParts = [...quoteForm.parts_info]
                          updatedParts[index].part_name = e.target.value
                          setQuoteForm(prev => ({ ...prev, parts_info: updatedParts }))
                        }}
                        className="bg-[#0d0d0d] border-[#2a2a2a] text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Quantity</Label>
                      <Input
                        type="number"
                        value={part.quantity}
                        onChange={(e) => {
                          const updatedParts = [...quoteForm.parts_info]
                          updatedParts[index].quantity = parseInt(e.target.value) || 0
                          setQuoteForm(prev => ({ ...prev, parts_info: updatedParts }))
                        }}
                        className="bg-[#0d0d0d] border-[#2a2a2a] text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Unit Price (CAD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={part.unit_price}
                        onChange={(e) => updatePartPrice(index, parseFloat(e.target.value) || 0)}
                        className="bg-[#0d0d0d] border-[#2a2a2a] text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Availability</Label>
                      <Select
                        value={part.availability}
                        onValueChange={(value) => {
                          const updatedParts = [...quoteForm.parts_info]
                          updatedParts[index].availability = value
                          setQuoteForm(prev => ({ ...prev, parts_info: updatedParts }))
                        }}
                      >
                        <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="In Stock">In Stock</SelectItem>
                          <SelectItem value="1-2 Days">1-2 Days</SelectItem>
                          <SelectItem value="3-5 Days">3-5 Days</SelectItem>
                          <SelectItem value="1-2 Weeks">1-2 Weeks</SelectItem>
                          <SelectItem value="Back Order">Back Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quote Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Delivery ETA</Label>
                  <Input
                    type="date"
                    value={quoteForm.quote_details.delivery_eta}
                    onChange={(e) => setQuoteForm(prev => ({
                      ...prev,
                      quote_details: { ...prev.quote_details, delivery_eta: e.target.value }
                    }))}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Total Cost (CAD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quoteForm.quote_details.total_cost}
                    onChange={(e) => setQuoteForm(prev => ({
                      ...prev,
                      quote_details: { ...prev.quote_details, total_cost: parseFloat(e.target.value) || 0 }
                    }))}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-gray-300">Admin Notes</Label>
                <Textarea
                  value={quoteForm.call_outcome.notes}
                  onChange={(e) => setQuoteForm(prev => ({
                    ...prev,
                    call_outcome: { ...prev.call_outcome, notes: e.target.value }
                  }))}
                  placeholder="Add any notes about this quote..."
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[100px]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                <Button
                  onClick={() => setIsQuoteModalOpen(false)}
                  variant="outline"
                  className="flex-1 border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitQuote}
                  disabled={isSubmittingQuote}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmittingQuote ? 'Submitting...' : 'Submit Quote'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
