'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Trash2, Loader2, Lock, Eye, EyeOff, FileText } from 'lucide-react'
import { WorkOrderKanbanItem } from '../../../types/work-order'
import { createClient } from '@/utils/supabase/client'

export interface WorkOrderDeleteConfirmationProps {
    workOrder: WorkOrderKanbanItem | null
    isOpen: boolean
    isDeleting?: boolean
    onClose: () => void
    onConfirm: (options: { deleteInvoice: boolean }) => void
}

export const WorkOrderDeleteConfirmation: React.FC<WorkOrderDeleteConfirmationProps> = ({
    workOrder,
    isOpen,
    isDeleting = false,
    onClose,
    onConfirm
}) => {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPasswordVerified, setIsPasswordVerified] = useState(false)
    const [deleteInvoice, setDeleteInvoice] = useState(false)
    const [hasInvoice, setHasInvoice] = useState(false)
    const [invoiceInfo, setInvoiceInfo] = useState<{ invoice_number: string; status: string; total_amount: number } | null>(null)
    const [isCheckingInvoice, setIsCheckingInvoice] = useState(false)

    // Check if work order has an associated invoice
    useEffect(() => {
        const checkInvoice = async () => {
            if (!workOrder?.id || !isOpen) return
            
            setIsCheckingInvoice(true)
            try {
                const supabase = createClient()
                const { data: invoice, error } = await supabase
                    .from('invoices_table')
                    .select('invoice_number, status, total_amount')
                    .eq('work_order_id', workOrder.id)
                    .single()
                
                if (!error && invoice) {
                    setHasInvoice(true)
                    setInvoiceInfo(invoice)
                } else {
                    setHasInvoice(false)
                    setInvoiceInfo(null)
                }
            } catch (err) {
                console.error('Error checking invoice:', err)
                setHasInvoice(false)
                setInvoiceInfo(null)
            } finally {
                setIsCheckingInvoice(false)
            }
        }
        
        checkInvoice()
    }, [workOrder?.id, isOpen])

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            setPassword('')
            setError(null)
            setIsPasswordVerified(false)
            setDeleteInvoice(false)
        }
    }, [isOpen])

    // Clear error when password changes
    useEffect(() => {
        if (error) setError(null)
    }, [password])

    const handleVerifyPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password.trim() || isVerifying) return

        setIsVerifying(true)
        setError(null)

        try {
            const response = await fetch('/api/financials/auth/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setIsPasswordVerified(true)
                setPassword('')
            } else {
                setError(data.error || 'Invalid password')
                setPassword('')
            }
        } catch (error) {
            setError('Network error. Please try again.')
        } finally {
            setIsVerifying(false)
        }
    }

    const handleClose = () => {
        setPassword('')
        setError(null)
        setIsPasswordVerified(false)
        onClose()
    }

    if (!workOrder) return null

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md bg-slate-50 dark:bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        Archive Work Order
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isPasswordVerified 
                            ? 'Password verified. Confirm to archive this Work Order.'
                            : 'Admin password required to archive Work Orders.'}
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

                    {/* Password Verification Form - Show when not yet verified */}
                    {!isPasswordVerified && (
                        <form onSubmit={handleVerifyPassword} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 rounded-lg p-3">
                                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <div>
                                <Label htmlFor="admin-password" className="text-foreground mb-2 block">
                                    Admin Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="admin-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter admin password"
                                        required
                                        disabled={isVerifying}
                                        className="pl-10 pr-12 bg-white dark:bg-background border-border text-foreground placeholder-muted-foreground"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        disabled={isVerifying}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={!password.trim() || isVerifying}
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isVerifying ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Verifying...
                                    </div>
                                ) : (
                                    'Verify Password'
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Confirmation Info - Show after password verified */}
                    {isPasswordVerified && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="text-blue-600 dark:text-blue-400 font-medium mb-1">Archiving Information</h5>
                                        <p className="text-blue-600 dark:text-blue-300 text-sm">
                                            The work order will be archived and moved to historical records. You can still access it from the customer's service history.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Deletion Option */}
                            {hasInvoice && invoiceInfo && (
                                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/20 rounded-lg p-4">
                                    <div className="flex gap-3">
                                        <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h5 className="text-orange-600 dark:text-orange-400 font-medium mb-2">Associated Invoice Found</h5>
                                            <div className="text-sm text-orange-700 dark:text-orange-300 mb-3 space-y-1">
                                                <p><span className="font-medium">Invoice #:</span> {invoiceInfo.invoice_number}</p>
                                                <p><span className="font-medium">Status:</span> <span className="capitalize">{invoiceInfo.status}</span></p>
                                                <p><span className="font-medium">Amount:</span> ${Number(invoiceInfo.total_amount || 0).toFixed(2)}</p>
                                            </div>
                                            
                                            <div className="flex items-start gap-3 pt-2 border-t border-orange-300 dark:border-orange-500/30">
                                                <Checkbox
                                                    id="delete-invoice"
                                                    checked={deleteInvoice}
                                                    onCheckedChange={(checked) => setDeleteInvoice(checked === true)}
                                                    className="mt-0.5 border-orange-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                                                />
                                                <div>
                                                    <Label 
                                                        htmlFor="delete-invoice" 
                                                        className="text-orange-700 dark:text-orange-300 font-medium cursor-pointer"
                                                    >
                                                        Also cancel this invoice
                                                    </Label>
                                                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                                        The invoice will be marked as cancelled and removed from financials. 
                                                        {invoiceInfo.status === 'paid' && (
                                                            <span className="font-medium"> Warning: This invoice has been paid.</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isDeleting || isVerifying}
                        className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    {isPasswordVerified && (
                        <Button
                            variant="destructive"
                            onClick={() => onConfirm({ deleteInvoice })}
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
                                    Archive Work Order{deleteInvoice ? ' & Invoice' : ''}
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
