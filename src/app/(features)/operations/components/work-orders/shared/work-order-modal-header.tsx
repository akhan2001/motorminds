'use client'

import React from "react"
import { X, Stethoscope } from "lucide-react"
import { useRouter } from "next/navigation"
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

const IN_PROGRESS_STATUSES = new Set(['in_progress', 'waiting_parts', 'waiting_customer'])

export const WorkOrderModalHeader: React.FC<WorkOrderModalHeaderProps> = ({
    workOrder,
    workOrderDetails,
    onClose,
    isCreating = false,
    onRevert,
    className = ""
}) => {
    const router = useRouter()
    const displayNumber = workOrderDetails?.work_order_number || workOrder.id
    const currentStatus = workOrderDetails?.status || workOrder.status
    const isCompleted = currentStatus === 'completed'
    const isInProgress = IN_PROGRESS_STATUSES.has(currentStatus as string)

    return (
        <div className={`flex items-center justify-between p-6 border-b border-border dark:border-[#222222] shrink-0 ${className}`}>
            <div className="space-y-1">
                <h1 className="text-foreground dark:text-white text-xl sm:text-2xl font-bold">
                    {isCreating ? 'Create New Work Order' : `Work Order ${displayNumber}`}
                </h1>
                <p className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">
                    {isCreating
                        ? 'Fill out the details to create a new work order.'
                        : 'Manage work order details and customer information.'
                    }
                </p>
            </div>
            <div className="flex items-center gap-2">
                {isInProgress && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/ai/diagnostics')}
                        className="bg-white dark:bg-[#1a1a1a] text-foreground border-border hover:bg-accent dark:hover:bg-zinc-800"
                    >
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Diagnostics
                    </Button>
                )}
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
