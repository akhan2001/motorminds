'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { WorkOrderKanbanItem } from '../../../types/work-order'

export interface WorkOrderDeleteConfirmationProps {
    workOrder: WorkOrderKanbanItem | null
    isOpen: boolean
    isDeleting?: boolean
    onClose: () => void
    onConfirm: () => void
}

export const WorkOrderDeleteConfirmation: React.FC<WorkOrderDeleteConfirmationProps> = ({
    workOrder,
    isOpen,
    isDeleting = false,
    onClose,
    onConfirm
}) => {
    if (!workOrder) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-slate-50 dark:bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        Archive Work Order
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Are you sure you want to archive this work order? It will be moved to your historical records.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-white dark:bg-card rounded-lg p-4 border border-border">
                        <h4 className="font-medium text-foreground mb-2">{workOrder.title}</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p><span className="text-foreground">Customer:</span> {workOrder.customer || 'Unknown'}</p>
                            <p><span className="text-foreground">Vehicle:</span> {workOrder.vehicle || 'Unknown'}</p>
                            <p><span className="text-foreground">Status:</span> 
                                <span className={`ml-1 capitalize ${
                                    workOrder.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                                    workOrder.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' :
                                    workOrder.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-muted-foreground'
                                }`}>
                                    {workOrder.status}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-blue-600 dark:text-blue-400 font-medium mb-1">Archiving Information</h5>
                                <p className="text-blue-600 dark:text-blue-300 text-sm">
                                    The work order will be archived and moved to historical records. You can still access it from the customer's service history and old invoices.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Archiving...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Archive Work Order
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
