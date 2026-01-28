'use client'

import React from 'react'
import { Wrench, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useWorkOrderWithDetails } from '@/app/(features)/operations/hooks/use-work-orders'
import { useWorkOrderItems } from '@/app/(features)/operations/hooks/use-work-order-items'
import { 
    WorkOrderDetailContent, 
    getWorkOrderStatusBadge, 
    getWorkOrderPriorityBadge 
} from '@/app/(features)/operations/components/work-orders/shared/WorkOrderDetailContent'

interface WorkOrderQuickViewProps {
    workOrderId: string
    isOpen: boolean
    onClose: () => void
}

export function WorkOrderQuickView({ workOrderId, isOpen, onClose }: WorkOrderQuickViewProps) {
    const { data: workOrder, isLoading, error } = useWorkOrderWithDetails(workOrderId)
    const { data: workOrderItems = [], isLoading: itemsLoading } = useWorkOrderItems(workOrderId)

    if (isLoading) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] [&>button:last-child]:hidden">
                    <DialogHeader className="flex-shrink-0 pb-4 border-b border-border dark:border-[#2a2a2a]">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted dark:bg-[#1a1a1a]">
                                    <Wrench className="h-5 w-5 text-orange-500" />
                                </div>
                                <DialogTitle className="text-lg font-semibold text-foreground dark:text-white">
                                    Loading Work Order...
                                </DialogTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (error || !workOrder) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] [&>button:last-child]:hidden">
                    <DialogHeader className="flex-shrink-0 pb-4 border-b border-border dark:border-[#2a2a2a]">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted dark:bg-[#1a1a1a]">
                                    <Wrench className="h-5 w-5 text-red-500" />
                                </div>
                                <DialogTitle className="text-lg font-semibold text-foreground dark:text-white">
                                    Work Order Not Found
                                </DialogTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="text-center py-12 text-muted-foreground">
                        Unable to load Work Order details.
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] [&>button:last-child]:hidden">
                <DialogHeader className="flex-shrink-0 pb-4 border-b border-border dark:border-[#2a2a2a]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted dark:bg-[#1a1a1a]">
                                <Wrench className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold text-foreground dark:text-white">
                                    Work Order #{workOrder.work_order_number}
                                </DialogTitle>
                                {workOrder.title && (
                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-0.5">
                                        {workOrder.title}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {getWorkOrderStatusBadge(workOrder.status)}
                            {getWorkOrderPriorityBadge(workOrder.priority)}
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 ml-2">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto py-4">
                    <WorkOrderDetailContent 
                        workOrder={workOrder}
                        workOrderItems={workOrderItems as any}
                        itemsLoading={itemsLoading}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
