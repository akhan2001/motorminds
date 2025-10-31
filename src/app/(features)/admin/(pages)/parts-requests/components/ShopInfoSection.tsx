'use client'

import { Building2 } from 'lucide-react'
import { PartsRequest } from '@/app/(features)/parts/types/parts'

interface ShopInfoSectionProps {
  request: PartsRequest
}

export function ShopInfoSection({ request }: ShopInfoSectionProps) {
  return (
    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-blue-400" />
        Shop Information
      </h4>
      <div className="text-sm text-gray-300">
        {(request as any).shops?.shop_name ? (
          <>
            <div><strong>Shop:</strong> {(request as any).shops.shop_name}</div>
            {(request as any).shops.shop_email && (
              <div><strong>Email:</strong> {(request as any).shops.shop_email}</div>
            )}
            {(request as any).shops.shop_phone && (
              <div><strong>Phone:</strong> {(request as any).shops.shop_phone}</div>
            )}
          </>
        ) : (
          <div><strong>Shop ID:</strong> {request.shop_id}</div>
        )}
        {request.user_id && (
          <div className="mt-2"><strong>Requested by User ID:</strong> {request.user_id.substring(0, 8)}...</div>
        )}
      </div>
    </div>
  )
}
