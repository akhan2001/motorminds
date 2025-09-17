'use client'

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkOrderKanbanItem } from "../../../types/work-order"

export interface WorkOrderModalHeaderProps {
    workOrder: WorkOrderKanbanItem
    onClose: () => void
    isCreating?: boolean
    className?: string
}

export const WorkOrderModalHeader: React.FC<WorkOrderModalHeaderProps> = ({
    workOrder,
    onClose,
    isCreating = false,
    className = ""
}) => {
    return (
        <div className={`flex items-center justify-between p-6 border-b border-[#222222] shrink-0 ${className}`}>
            <div className="space-y-1">
                <h2 className="text-white text-xl sm:text-2xl">
                    {isCreating ? 'Create New Work Order' : `Work Order #${workOrder.id}`}
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                    {isCreating 
                        ? 'Fill out the details to create a new work order.'
                        : 'Manage work order details and customer information.'
                    }
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-zinc-800"
                    onClick={onClose}
                >
                    <X className="h-6 w-6" />
                </Button>
            </div>
        </div>
    )
}
