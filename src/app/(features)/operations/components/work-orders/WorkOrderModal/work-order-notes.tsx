'use client'

import { Label } from "@/components/ui/label"

export interface WorkOrderNotesProps {
    notes: string
    isEditing: boolean
    onFieldChange: (field: string, value: string) => void
    className?: string
}

export const WorkOrderNotes: React.FC<WorkOrderNotesProps> = ({
    notes,
    isEditing,
    onFieldChange,
    className = ""
}) => {
    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-white">Notes</h3>
            <div className="bg-[#1A1A1A] rounded-xl p-6">
                <textarea
                    value={notes}
                    onChange={(e) => isEditing && onFieldChange('notes', e.target.value)}
                    className="w-full bg-[#292929] text-white border-[#626262] focus:ring-gray-500 rounded-md p-3 min-h-[120px]"
                    placeholder="Enter notes about the work order..."
                    readOnly={!isEditing}
                />
            </div>
        </div>
    )
}
