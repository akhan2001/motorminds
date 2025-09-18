'use client'

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface WorkOrderModalFooterProps {
    isEditing: boolean
    isCreating?: boolean
    isSubmitting?: boolean
    onEdit?: () => void
    onSave: () => void
    onCancel: () => void
    onClose: () => void
    onDelete?: () => void
    className?: string
}

export const WorkOrderModalFooter: React.FC<WorkOrderModalFooterProps> = ({
    isEditing,
    isCreating = false,
    isSubmitting = false,
    onEdit,
    onSave,
    onCancel,
    onClose,
    onDelete,
    className = ""
}) => {
    return (
        <div className={`flex items-center justify-between p-6 border-t border-[#222222] shrink-0 ${className}`}>
            <div className="flex items-center gap-2">
                {onDelete && (
                    <Button
                        variant="destructive"
                        className="bg-[#e23232] text-white hover:bg-[#e23232]/80"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-4">
                {isEditing ? (
                    <>
                        <Button
                            variant="outline"
                            className="border border-[#626262] px-8 text-gray-300 hover:bg-[#626262] hover:text-white"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="px-8 bg-[#22C55E] hover:bg-[#22C55E]/80 text-white"
                            onClick={onSave}
                            disabled={isSubmitting}
                        >
                            {isSubmitting 
                                ? (isCreating ? 'Creating...' : 'Saving...') 
                                : (isCreating ? 'Create Work Order' : 'Save Changes')
                            }
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="outline"
                        className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                )}
            </div>
        </div>
    )
}
