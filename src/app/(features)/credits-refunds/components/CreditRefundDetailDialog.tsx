'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { CreditsRefundsService } from '../lib/credits-refunds-service'
import { creditsRefundsKeys } from '../data/keys'
import {
    isValidStatusTransition,
    getValidNextStatuses,
} from '../lib/validations/credit-refund-schema'
import type { CreditRefundItem, CreditRefundStatus } from '../types/credits-refunds'
import {
    DollarSign,
    Building2,
    FileText,
    Calendar,
    StickyNote,
    CheckCircle2,
    FileCheck,
    Loader2,
    History,
} from 'lucide-react'

interface CreditRefundDetailDialogProps {
    creditRefund: CreditRefundItem | null
    isOpen: boolean
    onClose: () => void
    onUpdated?: () => void
    shopId?: string
}

export function CreditRefundDetailDialog({
    creditRefund,
    isOpen,
    onClose,
    onUpdated,
    shopId = '',
}: CreditRefundDetailDialogProps) {
    const queryClient = useQueryClient()
    const [statusToSet, setStatusToSet] = useState<CreditRefundStatus | null>(null)

    const { data: creditRefundData } = useQuery({
        queryKey: creditsRefundsKeys.detail(shopId, creditRefund?.id ?? ''),
        queryFn: () =>
            CreditsRefundsService.getCreditRefund(creditRefund!.id, shopId),
        enabled: isOpen && !!creditRefund?.id && !!shopId,
    })
    const displayCreditRefund = creditRefundData ?? creditRefund

    const { data: history = [] } = useQuery({
        queryKey: ['creditsRefunds', 'history', creditRefund?.id],
        queryFn: () =>
            CreditsRefundsService.getHistory(creditRefund!.id, shopId),
        enabled: isOpen && !!creditRefund?.id && !!shopId,
    })

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string
            data: { status?: CreditRefundStatus }
        }) => CreditsRefundsService.updateCreditRefund(id, shopId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: creditsRefundsKeys.all(shopId),
            })
            if (creditRefund?.id) {
                queryClient.invalidateQueries({
                    queryKey: creditsRefundsKeys.detail(shopId, creditRefund.id),
                })
            }
            onUpdated?.()
            setStatusToSet(null)
        },
    })

    useEffect(() => {
        if (!isOpen) setStatusToSet(null)
    }, [isOpen])

    if (!creditRefund || !displayCreditRefund) return null

    const validNextStatuses = getValidNextStatuses(
        displayCreditRefund.status as 'pending' | 'processed' | 'reconciled'
    )

    const handleStatusChange = (newStatus: CreditRefundStatus) => {
        if (
            isValidStatusTransition(
                displayCreditRefund.status as 'pending' | 'processed' | 'reconciled',
                newStatus as 'pending' | 'processed' | 'reconciled'
            )
        ) {
            setStatusToSet(newStatus)
            updateMutation.mutate({
                id: displayCreditRefund.id,
                data: { status: newStatus },
            })
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
            processed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            reconciled: 'bg-green-500/10 text-green-600 dark:text-green-400',
        }
        return (
            <Badge className={variants[status] || ''}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden bg-slate-50 dark:bg-card border-border text-foreground">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        Credit/Refund Details
                        {getStatusBadge(displayCreditRefund.status)}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto min-h-0 flex-1 pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Amount
                            </Label>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                                {formatCurrency(displayCreditRefund.amount)}
                            </p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Date
                            </Label>
                            <p className="text-foreground mt-1">
                                {formatDate(displayCreditRefund.refund_date)}
                            </p>
                        </div>
                    </div>

                    <div>
                        <Label className="text-muted-foreground text-xs flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Supplier
                        </Label>
                        <p className="text-foreground mt-1">
                            {displayCreditRefund.supplier || '-'}
                        </p>
                    </div>

                    <div>
                        <Label className="text-muted-foreground text-xs flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Reason
                        </Label>
                        <p className="text-foreground mt-1">{displayCreditRefund.reason}</p>
                    </div>

                    {(displayCreditRefund.description || displayCreditRefund.part_number || displayCreditRefund.invoice_number || displayCreditRefund.parts_description) && (
                        <div>
                            <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Parts / description
                            </Label>
                            {displayCreditRefund.description && (
                                <p className="text-foreground mt-1">{displayCreditRefund.description}</p>
                            )}
                            {displayCreditRefund.part_number && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Part #: {displayCreditRefund.part_number}
                                </p>
                            )}
                            {displayCreditRefund.invoice_number && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Invoice #: {displayCreditRefund.invoice_number}
                                </p>
                            )}
                            {displayCreditRefund.parts_description && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {displayCreditRefund.parts_description}
                                </p>
                            )}
                        </div>
                    )}

                    {displayCreditRefund.notes && (
                        <div>
                            <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                <StickyNote className="h-3 w-3" />
                                Notes
                            </Label>
                            <p className="text-foreground mt-1 text-sm">
                                {displayCreditRefund.notes}
                            </p>
                        </div>
                    )}

                    <Separator />

                    {/* Status transition buttons */}
                    {validNextStatuses.length > 0 && (
                        <div>
                            <Label className="text-muted-foreground text-xs mb-2 block">
                                Update Status
                            </Label>
                            <div className="flex gap-2">
                                {validNextStatuses.map((s) => (
                                    <Button
                                        key={s}
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            handleStatusChange(
                                                s as CreditRefundStatus
                                            )
                                        }
                                        disabled={updateMutation.isPending}
                                    >
                                        {updateMutation.isPending &&
                                        statusToSet === s ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : s === 'processed' ? (
                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                        ) : (
                                            <FileCheck className="h-4 w-4 mr-1" />
                                        )}
                                        Mark as{' '}
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Audit history */}
                    {history.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <Label className="text-muted-foreground text-xs flex items-center gap-1 mb-2">
                                    <History className="h-3 w-3" />
                                    History
                                </Label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {history.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="text-xs p-2 rounded bg-muted/50"
                                        >
                                            <span className="font-medium">
                                                {entry.action}
                                            </span>
                                            <span className="text-muted-foreground ml-1">
                                                {formatDate(entry.changed_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
