'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Wrench } from 'lucide-react'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import { useWorkOrderItems } from '../../../hooks/use-work-order-items'
import { WorkOrderDetailContent, getWorkOrderStatusBadge, getWorkOrderPriorityBadge } from './WorkOrderDetailContent'

interface WorkOrderDetailSheetProps {
    workOrder: WorkOrderWithDetails | null
    isOpen: boolean
    onClose: () => void
}

export const WorkOrderDetailSheet: React.FC<WorkOrderDetailSheetProps> = ({
    workOrder,
    isOpen,
    onClose
}) => {
    // Fetch work order items (only when work order ID is available)
    const { data: workOrderItems = [], isLoading: itemsLoading } = useWorkOrderItems(workOrder?.id || '')

    if (!workOrder) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[600px] sm:w-[700px] bg-white dark:bg-[#0a0a0a] border-border dark:border-[#222222] overflow-y-auto">
                <SheetHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Wrench className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                            <SheetTitle className="text-foreground dark:text-white text-lg">
                                {workOrder.work_order_number}
                            </SheetTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            {getWorkOrderStatusBadge(workOrder.status)}
                            {getWorkOrderPriorityBadge(workOrder.priority)}
                        </div>
                    </div>
                    {workOrder.title ? (
                        <SheetDescription className="text-muted-foreground dark:text-gray-400 text-sm mt-1">
                            {workOrder.title}
                        </SheetDescription>
                    ) : (
                        <SheetDescription className="sr-only">
                            Work order details
                        </SheetDescription>
                    )}
                </SheetHeader>

                <WorkOrderDetailContent 
                    workOrder={workOrder}
                    workOrderItems={workOrderItems as any}
                    itemsLoading={itemsLoading}
                />
            </SheetContent>
        </Sheet>
    )
}
