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
            <div className="bg-card dark:bg-[#131313] rounded-xl p-6 border border-border dark:border-[#333333]">
                <textarea
                    value={notes}
                    onChange={(e) => isEditing && onFieldChange('notes', e.target.value)}
                    className={`w-full text-sm text-foreground dark:text-white border border-border dark:border-[#333333] focus:ring-gray-500 rounded-md p-3 min-h-[120px] ${
                        isEditing 
                            ? 'bg-background dark:bg-[#1a1a1a]' 
                            : 'bg-card dark:bg-[#131313]'
                    }`}
                    placeholder="Enter your recommendation..."
                    readOnly={!isEditing}
                />
            </div>
        </div>
    )
}
