'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Save } from 'lucide-react'
import { PartsRequest } from '@/app/(features)/parts/types/parts'

interface AdminNotesSectionProps {
  request: PartsRequest
  onEditAdminNotes: (requestId: string, currentNotes: string) => void
  onSaveAdminNotes: (requestId: string) => void
  onCancelEditAdminNotes: () => void
  editingAdminNotes: string | null
  adminNotesValue: string
  setAdminNotesValue: (value: string) => void
  isSavingAdminNotes: boolean
}

export function AdminNotesSection({
  request,
  onEditAdminNotes,
  onSaveAdminNotes,
  onCancelEditAdminNotes,
  editingAdminNotes,
  adminNotesValue,
  setAdminNotesValue,
  isSavingAdminNotes
}: AdminNotesSectionProps) {
  return (
    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-yellow-400">Admin Notes</h4>
        {editingAdminNotes !== request.id ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEditAdminNotes(request.id, request.admin_notes || '')}
            className="h-6 px-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30"
          >
            <Edit className="h-3 w-3 mr-1" />
            {request.admin_notes ? 'Edit' : 'Add Notes'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelEditAdminNotes}
              disabled={isSavingAdminNotes}
              className="h-6 px-2 text-gray-400 hover:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onSaveAdminNotes(request.id)}
              disabled={isSavingAdminNotes}
              className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        )}
      </div>
      {editingAdminNotes === request.id ? (
        <Textarea
          value={adminNotesValue}
          onChange={(e) => setAdminNotesValue(e.target.value)}
          placeholder="Add admin notes (visible to shop owner)..."
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[80px] text-sm"
        />
      ) : (
        <div className="text-sm text-gray-300 min-h-[20px]">
          {request.admin_notes || <span className="text-gray-500 italic">No admin notes yet</span>}
        </div>
      )}
    </div>
  )
}
