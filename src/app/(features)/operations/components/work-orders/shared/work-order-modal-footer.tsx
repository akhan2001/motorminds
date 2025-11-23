'use client'

import { Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface WorkOrderModalFooterProps {
    isEditing: boolean
    isCreating?: boolean
    isSubmitting?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canGenerateInvoice?: boolean
    workOrderStatus?: string
    hasInvoice?: boolean
    onEdit?: () => void
    onSave: () => void
    onCancel: () => void
    onClose: () => void
    onDelete?: () => void
    onGenerateInvoice?: () => void
    onGoToInvoice?: () => void
    deleteDisabledReason?: string
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
    hasInvoice = false,
    onEdit,
    onSave,
    onCancel,
    onClose,
    onDelete,
    onGenerateInvoice,
    onGoToInvoice,
    deleteDisabledReason,
    className = ""
}) => {
    return (
        <div className={`flex items-center justify-between p-6 border-t border-border dark:border-[#222222] shrink-0 ${className}`}>
            <div className="flex items-center gap-2">
                {onDelete && (
                    canDelete ? (
                        <Button
                            variant="destructive"
                            className='bg-[#e23232] text-white hover:bg-[#e23232]/80'
                            onClick={onDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    ) : (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                        <Button
                                            variant="destructive"
                                            className='bg-gray-600 dark:bg-gray-600 text-muted-foreground dark:text-gray-400 cursor-not-allowed opacity-50'
                                            disabled
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {deleteDisabledReason && (
                                    <TooltipContent>
                                        <p>{deleteDisabledReason}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    )
                )}
            </div>

            <div className="flex items-center gap-4">
                {isEditing ? (
                    <>
                        <Button
                            variant="outline"
                            className="border border-border dark:border-[#626262] px-8 text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#626262] hover:text-foreground dark:hover:text-white"
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
                        {onEdit && workOrderStatus !== 'completed' && (
                            <Button
                                variant="outline"
                                className={`border px-8 ${canEdit
                                    ? 'border-border dark:border-[#626262] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#626262] hover:text-foreground dark:hover:text-white'
                                    : 'border-border dark:border-gray-600 text-muted-foreground dark:text-gray-500 cursor-not-allowed opacity-50'
                                    }`}
                                onClick={onEdit}
                                disabled={!canEdit}
                            >
                                Edit
                            </Button>
                        )}
                        {canGenerateInvoice && workOrderStatus === 'completed' && (
                            hasInvoice ? (
                                <Button
                                    variant="outline"
                                    className="border border-green-500/50 text-green-500 dark:text-green-400 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-white px-8"
                                    onClick={onGoToInvoice}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Go to Invoice
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="border border-blue-500/50 text-blue-500 dark:text-blue-400 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-white px-8"
                                    onClick={onGenerateInvoice}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Generate Invoice
                                </Button>
                            )
                        )}
                        <Button
                            variant="outline"
                            className="border border-border dark:border-[#626262] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#626262] hover:text-foreground dark:hover:text-white"
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
