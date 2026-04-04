'use client'

import { Trash2, Send, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface WorkOrderModalFooterProps {
    isEditing: boolean
    isCreating?: boolean
    isSubmitting?: boolean
    canEdit?: boolean
    canDelete?: boolean
    workOrderStatus?: string
    onEdit?: () => void
    onSave: () => void
    onCancel: () => void
    onClose: () => void
    onDelete?: () => void
    deleteDisabledReason?: string
    /** Show Send + Print buttons (for estimates and in-progress work orders) */
    onSend?: () => void
    onPrint?: () => void
    isPrinting?: boolean
    className?: string
}

export const WorkOrderModalFooter: React.FC<WorkOrderModalFooterProps> = ({
    isEditing,
    isCreating = false,
    isSubmitting = false,
    canEdit = true,
    canDelete = true,
    workOrderStatus,
    onEdit,
    onSave,
    onCancel,
    onClose,
    onDelete,
    deleteDisabledReason,
    onSend,
    onPrint,
    isPrinting = false,
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
                                : (isCreating ? 'Create Work Order' : 'Save & Close')
                            }
                        </Button>
                    </>
                ) : (
                    <>
                        {onSend && (
                            <Button
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={onSend}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Send
                            </Button>
                        )}
                        {onPrint && (
                            <Button
                                className="bg-gray-600 hover:bg-gray-700 text-white"
                                onClick={onPrint}
                                disabled={isPrinting}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isPrinting ? 'Generating...' : 'Print / PDF'}
                            </Button>
                        )}
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
