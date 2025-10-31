'use client'

import { Calendar } from 'lucide-react'
import { PartsRequest } from '@/app/(features)/parts/types/parts'

interface DatesSectionProps {
  request: PartsRequest
}

export function DatesSection({ request }: DatesSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-400">
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
  )
}
