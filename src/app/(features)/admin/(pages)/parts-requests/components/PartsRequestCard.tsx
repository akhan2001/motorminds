'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, FileText, Edit, Building2, Car, DollarSign } from 'lucide-react'
import { PartsRequest } from '@/app/(features)/parts/types/parts'
import { ShopInfoSection } from './ShopInfoSection'
import { SupplierInfoSection } from './SupplierInfoSection'
import { PartsDetailsSection } from './PartsDetailsSection'
import { VehicleInfoSection } from './VehicleInfoSection'
import { PricingInfoSection } from './PricingInfoSection'
import { NotesSection } from './NotesSection'
import { AdminNotesSection } from './AdminNotesSection'
import { DatesSection } from './DatesSection'
import { ExpandableSection } from './ExpandableSection'

interface PartsRequestCardProps {
  request: PartsRequest
  onUpdateStatus: (requestId: string, status: PartsRequest['status']) => void
  onOpenQuoteModal: (request: PartsRequest) => void
  onEditAdminNotes: (requestId: string, currentNotes: string) => void
  onSaveAdminNotes: (requestId: string) => void
  onCancelEditAdminNotes: () => void
  editingAdminNotes: string | null
  adminNotesValue: string
  setAdminNotesValue: (value: string) => void
  isSavingAdminNotes: boolean
}

export function PartsRequestCard({
  request,
  onUpdateStatus,
  onOpenQuoteModal,
  onEditAdminNotes,
  onSaveAdminNotes,
  onCancelEditAdminNotes,
  editingAdminNotes,
  adminNotesValue,
  setAdminNotesValue,
  isSavingAdminNotes
}: PartsRequestCardProps) {
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

  return (
    <Card className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
      <CardHeader className="pb-4 border-b border-[#2a2a2a]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1">
            <CardTitle className="text-white flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-blue-400" />
              {request.parts_requested[0]?.part_name || 'Unknown Part'}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className={`${getStatusColor(request.status)} text-xs font-medium`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
              <Badge variant="outline" className={`${getPriorityColor(request.priority)} border-0 text-xs font-medium`}>
                {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
              </Badge>
              {request.parts_requested?.length > 0 && (
                <Badge variant="outline" className="border-[#2a2a2a] text-gray-300 text-xs">
                  {request.parts_requested.length} Part{request.parts_requested.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {(request.status === 'pending' || request.status === 'processing') && (
              <Button
                onClick={() => onOpenQuoteModal(request)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Quote
              </Button>
            )}
            {request.status === 'quoted' && (
              <Button
                onClick={() => onOpenQuoteModal(request)}
                size="sm"
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-900/20 whitespace-nowrap"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Quote
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ExpandableSection
          title="Request Details"
          icon={<Package className="h-4 w-4 text-blue-400" />}
          defaultExpanded={true}
        >
          {/* Top Row: Shop & Vehicle Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <ShopInfoSection request={request} />
            <VehicleInfoSection request={request} />
          </div>

          {/* Middle Row: Supplier & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <SupplierInfoSection request={request} />
            <PricingInfoSection request={request} />
          </div>

          {/* Parts Details - Full Width */}
          <div className="mb-4">
            <PartsDetailsSection request={request} />
          </div>

          {/* Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <NotesSection request={request} />
            <AdminNotesSection
              request={request}
              onEditAdminNotes={onEditAdminNotes}
              onSaveAdminNotes={onSaveAdminNotes}
              onCancelEditAdminNotes={onCancelEditAdminNotes}
              editingAdminNotes={editingAdminNotes}
              adminNotesValue={adminNotesValue}
              setAdminNotesValue={setAdminNotesValue}
              isSavingAdminNotes={isSavingAdminNotes}
            />
          </div>
        </ExpandableSection>
        
        {/* Footer: Dates */}
        <div className="pt-4 border-t border-[#2a2a2a] px-6 pb-4">
          <DatesSection request={request} />
        </div>
      </CardContent>
    </Card>
  )
}
