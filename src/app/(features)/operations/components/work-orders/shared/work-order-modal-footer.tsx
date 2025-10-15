'use client'

import { Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface WorkOrderModalFooterProps {
    isEditing: boolean
    isCreating?: boolean
    isSubmitting?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canGenerateInvoice?: boolean
    workOrderStatus?: string
    onEdit?: () => void
    onSave: () => void
    onCancel: () => void
    onClose: () => void
    onDelete?: () => void
    onGenerateInvoice?: () => void
    className?: string
}

export const WorkOrderModalFooter: React.FC<WorkOrderModalFooterProps> = ({
    isEditing,
    isCreating = false,
    isSubmitting = false,
    canEdit = true,
    canDelete = true,
    canGenerateInvoice = false,
    workOrderStatus,
    onEdit,
    onSave,
    onCancel,
    onClose,
    onDelete,
    onGenerateInvoice,
    className = ""
}) => {
    return (
        <div className={`flex items-center justify-between p-6 border-t border-[#222222] shrink-0 ${className}`}>
            <div className="flex items-center gap-2">
                {onDelete && (
                    <Button
                        variant="destructive"
                        className={
                            canDelete 
                                ? 'bg-[#e23232] text-white hover:bg-[#e23232]/80' 
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                        }
                        onClick={onDelete}
                        disabled={!canDelete}
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
                    <>
                        {onEdit && (
                            <Button
                                variant="outline"
                                className={`border px-8 ${
                                    canEdit 
                                        ? 'border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white' 
                                        : 'border-gray-600 text-gray-500 cursor-not-allowed opacity-50'
                                }`}
                                onClick={onEdit}
                                disabled={!canEdit}
                            >
                                Edit
                            </Button>
                        )}
                        {onGenerateInvoice && canGenerateInvoice && workOrderStatus === 'completed' && (
                            <Button
                                variant="outline"
                                className="border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-white px-8"
                                onClick={onGenerateInvoice}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Invoice
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
