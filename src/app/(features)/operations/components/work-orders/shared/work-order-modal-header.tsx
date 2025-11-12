'use client'

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkOrderKanbanItem, WorkOrderWithDetails } from "../../../types/work-order"

export interface WorkOrderModalHeaderProps {
    workOrder: WorkOrderKanbanItem
    workOrderDetails?: WorkOrderWithDetails
    onClose: () => void
    isCreating?: boolean
    onRevert?: () => void
    className?: string
}

export const WorkOrderModalHeader: React.FC<WorkOrderModalHeaderProps> = ({
    workOrder,
    workOrderDetails,
    onClose,
    isCreating = false,
    onRevert,
    className = ""
}) => {
    const displayNumber = workOrderDetails?.work_order_number || workOrder.id
    const isCompleted = workOrderDetails?.status === 'completed' || workOrder.status === 'completed'
    
    return (
        <div className={`flex items-center justify-between p-6 border-b border-border dark:border-[#222222] shrink-0 ${className}`}>
            <div className="space-y-1">
                <h2 className="text-foreground dark:text-white text-xl sm:text-2xl">
                    {isCreating ? 'Create New Work Order' : `Work Order ${displayNumber}`}
                </h2>
                <p className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">
                    {isCreating 
                        ? 'Fill out the details to create a new work order.'
                        : 'Manage work order details and customer information.'
                    }
                </p>
            </div>
            <div className="flex items-center gap-2">
                {isCompleted && onRevert && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRevert}
                        className="bg-white dark:bg-[#1a1a1a] text-foreground border-border hover:bg-accent dark:hover:bg-zinc-800"
                    >
                        Revert to In Progress
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-zinc-800"
                    onClick={onClose}
                >
                    <X className="h-6 w-6" />
                </Button>
            </div>
        </div>
    )
}
