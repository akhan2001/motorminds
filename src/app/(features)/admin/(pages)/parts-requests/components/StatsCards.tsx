'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Package } from 'lucide-react'
import { PartsRequest } from '@/app/(features)/parts/types/parts'

interface StatsCardsProps {
  partsRequests: PartsRequest[]
}

export function StatsCards({ partsRequests }: StatsCardsProps) {
  const statuses = ['pending', 'processing', 'quoted', 'ordered', 'received'] as const

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {statuses.map((status) => {
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
  )
}
