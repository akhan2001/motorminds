'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PartsRequest } from '@/app/(features)/parts/types/parts'

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

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  selectedRequest: PartsRequest | null
  quoteForm: QuoteFormData
  setQuoteForm: (form: QuoteFormData) => void
  onSubmit: () => void
  isSubmitting: boolean
  onUpdatePartPrice: (index: number, price: number) => void
}

export function QuoteModal({
  isOpen,
  onClose,
  selectedRequest,
  quoteForm,
  setQuoteForm,
  onSubmit,
  isSubmitting,
  onUpdatePartPrice
}: QuoteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                        setQuoteForm({ ...quoteForm, parts_info: updatedParts })
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
                        setQuoteForm({ ...quoteForm, parts_info: updatedParts })
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
                      onChange={(e) => onUpdatePartPrice(index, parseFloat(e.target.value) || 0)}
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
                        setQuoteForm({ ...quoteForm, parts_info: updatedParts })
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
                  onChange={(e) => setQuoteForm({
                    ...quoteForm,
                    quote_details: { ...quoteForm.quote_details, delivery_eta: e.target.value }
                  })}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Total Cost (CAD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quoteForm.quote_details.total_cost}
                  onChange={(e) => setQuoteForm({
                    ...quoteForm,
                    quote_details: { ...quoteForm.quote_details, total_cost: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-gray-300">Admin Notes</Label>
              <Textarea
                value={quoteForm.call_outcome.notes}
                onChange={(e) => setQuoteForm({
                  ...quoteForm,
                  call_outcome: { ...quoteForm.call_outcome, notes: e.target.value }
                })}
                placeholder="Add any notes about this quote..."
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[100px]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quote'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
