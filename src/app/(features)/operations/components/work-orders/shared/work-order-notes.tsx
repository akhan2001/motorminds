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
            <div className="bg-slate-50 dark:bg-[#1A1A1A] rounded-xl p-6">
                <textarea
                    value={notes}
                    onChange={(e) => isEditing && onFieldChange('notes', e.target.value)}
                    className="w-full text-sm bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border border-border dark:border-[#2a2a2a] focus:ring-gray-500 rounded-md p-3 min-h-[120px]"
                    placeholder="Enter your recommendation..."
                    readOnly={!isEditing}
                />
            </div>
        </div>
    )
}
