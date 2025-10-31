'use client'

import { DollarSign } from 'lucide-react'
import { PartsRequest } from '@/app/(features)/parts/types/parts'

interface PricingInfoSectionProps {
  request: PartsRequest
}

export function PricingInfoSection({ request }: PricingInfoSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  return (
    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-green-400" />
        Pricing Information
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {request.total_estimated_price !== null && request.total_estimated_price !== undefined && (
          <div>
            <span className="text-gray-500 font-medium">Estimated Total:</span>
            <div className="text-gray-300 font-semibold text-lg">{formatCurrency(request.total_estimated_price)}</div>
          </div>
        )}
        {request.actual_cost !== null && request.actual_cost !== undefined && (
          <div>
            <span className="text-gray-500 font-medium">Actual Cost:</span>
            <div className="text-green-400 font-semibold text-lg">{formatCurrency(request.actual_cost)}</div>
          </div>
        )}
        {request.quote_provided && typeof request.quote_provided === 'object' && (request.quote_provided as any).quote_details && (
          <>
            {(request.quote_provided as any).quote_details.total_cost && (
              <div>
                <span className="text-gray-500 font-medium">Quote Total:</span>
                <div className="text-blue-400 font-semibold text-lg">{formatCurrency((request.quote_provided as any).quote_details.total_cost)}</div>
              </div>
            )}
            {(request.quote_provided as any).quote_details.delivery_eta && (
              <div>
                <span className="text-gray-500 font-medium">Delivery ETA:</span>
                <div className="text-gray-300">{new Date((request.quote_provided as any).quote_details.delivery_eta).toLocaleDateString()}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
