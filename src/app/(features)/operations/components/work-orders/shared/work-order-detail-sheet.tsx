'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Wrench, Send, Download, ArchiveRestore } from 'lucide-react'
import { toast } from 'sonner'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import { useWorkOrderItems } from '../../../hooks/use-work-order-items'
import { WorkOrderDetailContent, getWorkOrderStatusBadge, getWorkOrderPriorityBadge } from './WorkOrderDetailContent'
import { WorkOrderSendChoiceModal } from './WorkOrderSendChoiceModal'
import { WorkOrderSendEmailModal } from './WorkOrderSendEmailModal'
import { WorkOrderSendSmsModal } from './WorkOrderSendSmsModal'
import { downloadWorkOrderPDF } from '../../../lib/work-order-pdf-generator'
import { useShopInfo } from '@/hooks/core/useShopInfo'
import { prepareShopBrandingWithLogo } from '../../../../financials/lib/pdf/logo-utils'

const SEND_PRINT_STATUSES = ['pending', 'approved', 'waiting_parts', 'waiting_customer']

interface WorkOrderDetailSheetProps {
    workOrder: WorkOrderWithDetails | null
    isOpen: boolean
    onClose: () => void
    onUnarchive?: () => void
}

export const WorkOrderDetailSheet: React.FC<WorkOrderDetailSheetProps> = ({
    workOrder,
    isOpen,
    onClose,
    onUnarchive
}) => {
    const { data: workOrderItems = [], isLoading: itemsLoading } = useWorkOrderItems(workOrder?.id || '')
    const { data: shopInfo } = useShopInfo()

    const [isSendChoiceOpen, setIsSendChoiceOpen] = useState(false)
    const [isSendEmailOpen, setIsSendEmailOpen] = useState(false)
    const [isSendSmsOpen, setIsSendSmsOpen] = useState(false)
    const [isPrinting, setIsPrinting] = useState(false)

    if (!workOrder) return null

    const showSendPrint = SEND_PRINT_STATUSES.includes(workOrder.status)

    const handlePrint = async () => {
        if (!shopInfo) { toast.error('Shop information not available'); return }
        setIsPrinting(true)
        try {
            const shop = await prepareShopBrandingWithLogo(shopInfo)
            await downloadWorkOrderPDF(workOrder, workOrderItems as any, shop)
        } catch {
            toast.error('Failed to generate PDF')
        } finally {
            setIsPrinting(false)
        }
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-[600px] sm:w-[700px] bg-white dark:bg-[#0a0a0a] border-border dark:border-[#222222] overflow-y-auto flex flex-col">
                    <SheetHeader className="pb-4 flex-shrink-0">
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

                    <div className="flex-1 overflow-y-auto">
                        <WorkOrderDetailContent
                            workOrder={workOrder}
                            workOrderItems={workOrderItems as any}
                            itemsLoading={itemsLoading}
                        />
                    </div>

                    {(showSendPrint || onUnarchive) && (
                        <SheetFooter className="flex-shrink-0 border-t border-border dark:border-[#222222] pt-4 mt-4 flex flex-row gap-2 justify-end">
                            {onUnarchive && (
                                <Button
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                    onClick={onUnarchive}
                                >
                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                    Unarchive
                                </Button>
                            )}
                            {showSendPrint && (
                                <>
                                    <Button
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                        onClick={() => setIsSendChoiceOpen(true)}
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        Send
                                    </Button>
                                    <Button
                                        className="bg-gray-600 hover:bg-gray-700 text-white"
                                        onClick={handlePrint}
                                        disabled={isPrinting}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        {isPrinting ? 'Generating...' : 'Print / PDF'}
                                    </Button>
                                </>
                            )}
                        </SheetFooter>
                    )}
                </SheetContent>
            </Sheet>

            {/* Send / Print Modals — rendered outside Sheet to avoid stacking context issues */}
            <WorkOrderSendChoiceModal
                workOrder={workOrder}
                isOpen={isSendChoiceOpen}
                onClose={() => setIsSendChoiceOpen(false)}
                onEmailChoice={() => { setIsSendChoiceOpen(false); setIsSendEmailOpen(true) }}
                onSmsChoice={() => { setIsSendChoiceOpen(false); setIsSendSmsOpen(true) }}
            />
            <WorkOrderSendEmailModal
                workOrder={workOrder}
                workOrderItems={workOrderItems as any}
                isOpen={isSendEmailOpen}
                onClose={() => setIsSendEmailOpen(false)}
                onConfirm={() => setIsSendEmailOpen(false)}
            />
            <WorkOrderSendSmsModal
                workOrder={workOrder}
                workOrderItems={workOrderItems as any}
                isOpen={isSendSmsOpen}
                onClose={() => setIsSendSmsOpen(false)}
                onConfirm={() => setIsSendSmsOpen(false)}
            />
        </>
    )
}
