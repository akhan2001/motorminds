'use client'

import { Package } from 'lucide-react'
import { PartsRequest } from '@/app/(features)/parts/types/parts'

interface PartsDetailsSectionProps {
  request: PartsRequest
}

export function PartsDetailsSection({ request }: PartsDetailsSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  return (
    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Package className="h-4 w-4 text-purple-400" />
        Parts Details ({request.parts_requested?.length || 0} item{request.parts_requested?.length !== 1 ? 's' : ''})
      </h4>
      <div className="space-y-2">
        {request.parts_requested && Array.isArray(request.parts_requested) && request.parts_requested.length > 0 ? (
          request.parts_requested.map((part: any, index: number) => (
            <div key={index} className="bg-[#1a1a1a] p-3 rounded border border-[#2a2a2a]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-300 font-medium mb-1">{part.part_name || `Part ${index + 1}`}</div>
                  {part.part_number && (
                    <div className="text-xs text-gray-400">Part #: {part.part_number}</div>
                  )}
                  {part.description && (
                    <div className="text-xs text-gray-400 mt-1">{part.description}</div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Qty:</span>
                    <div className="text-gray-300 font-medium">{part.quantity || 1}</div>
                  </div>
                  {(part.estimated_price || part.price) && (
                    <div>
                      <span className="text-gray-500">Est. Price:</span>
                      <div className="text-gray-300 font-medium">{formatCurrency((part.estimated_price || part.price || 0) * (part.quantity || 1))}</div>
                    </div>
                  )}
                  {part.availability && (
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div className="text-gray-300 font-medium">{part.availability}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400">No parts information available</div>
        )}
      </div>
    </div>
  )
}
