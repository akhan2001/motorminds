'use client'

import { PartsRequest } from '@/app/(features)/parts/types/parts'

interface NotesSectionProps {
  request: PartsRequest
}

export function NotesSection({ request }: NotesSectionProps) {
  if (!request.notes && !request.customer_notes) {
    return null
  }

  return (
    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors h-full">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span className="text-gray-400">Notes</span>
      </h4>
      <div className="space-y-3">
        {request.notes && (
          <div className="text-sm text-gray-300 bg-[#1a1a1a] p-3 rounded border border-[#2a2a2a]">
            <span className="text-gray-500 font-medium text-xs block mb-1">Shop Notes:</span>
            <p className="text-gray-300">{request.notes}</p>
          </div>
        )}
        {request.customer_notes && (
          <div className="text-sm text-blue-300 bg-blue-500/10 p-3 rounded border border-blue-500/20">
            <span className="text-blue-400 font-medium text-xs block mb-1">Customer Notes:</span>
            <p className="text-blue-200">{request.customer_notes}</p>
          </div>
        )}
        {!request.notes && !request.customer_notes && (
          <div className="text-sm text-gray-500 italic">No notes available</div>
        )}
      </div>
    </div>
  )
}
