'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Trash2, Loader2, Lock, Eye, EyeOff, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface InvoiceForDeletion {
    id: string
    invoice_number: string
    display_id?: number
    title?: string
    status: string
    total_amount: number
    customer?: {
        customer_name: string
    }
    vehicle?: {
        year?: number
        make?: string
        model?: string
    }
}

export interface InvoiceDeleteConfirmationProps {
    invoice: InvoiceForDeletion | null
    isOpen: boolean
    isDeleting?: boolean
    onClose: () => void
    onConfirm: () => void
}

export const InvoiceDeleteConfirmation: React.FC<InvoiceDeleteConfirmationProps> = ({
    invoice,
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

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            setPassword('')
            setError(null)
            setIsPasswordVerified(false)
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
            case 'sent': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            case 'viewed': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
            case 'overdue': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            case 'cancelled': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
            default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
        }
    }

    const formatInvoiceNumber = (invoice: InvoiceForDeletion) => {
        if (invoice.display_id) {
            return `INV-${invoice.display_id}`
        }
        return invoice.invoice_number
    }

    if (!invoice) return null

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md bg-slate-50 dark:bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        Archive Invoice
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isPasswordVerified 
                            ? 'Password verified. Confirm to archive this Invoice.'
                            : 'Admin password required to archive Invoices.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Invoice Info Card */}
                    <div className="bg-white dark:bg-card rounded-lg p-4 border border-border">
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-foreground">{formatInvoiceNumber(invoice)}</h4>
                            <Badge variant="outline" className={getStatusColor(invoice.status)}>
                                {invoice.status}
                            </Badge>
                        </div>
                        {invoice.title && (
                            <p className="text-sm text-muted-foreground mb-2">{invoice.title}</p>
                        )}
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                                <span className="text-foreground">Customer:</span>{' '}
                                {invoice.customer?.customer_name || 'Unknown'}
                            </p>
                            {invoice.vehicle && (
                                <p>
                                    <span className="text-foreground">Vehicle:</span>{' '}
                                    {[invoice.vehicle.year, invoice.vehicle.make, invoice.vehicle.model]
                                        .filter(Boolean)
                                        .join(' ') || 'Unknown'}
                                </p>
                            )}
                            <p className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span className="text-foreground font-medium">
                                    ${Number(invoice.total_amount || 0).toFixed(2)}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Password Verification Form */}
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

                    {/* Confirmation Info */}
                    {isPasswordVerified && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="text-blue-600 dark:text-blue-400 font-medium mb-1">Archiving Information</h5>
                                        <p className="text-blue-600 dark:text-blue-300 text-sm">
                                            The invoice will be archived and removed from active financials. 
                                            You can still access it from archived records.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {invoice.status === 'paid' && (
                                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/20 rounded-lg p-4">
                                    <div className="flex gap-3">
                                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="text-orange-600 dark:text-orange-400 font-medium mb-1">Warning: Paid Invoice</h5>
                                            <p className="text-orange-600 dark:text-orange-300 text-sm">
                                                This invoice has been marked as paid. Archiving it will affect your financial records.
                                            </p>
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
                                    Archive Invoice
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default InvoiceDeleteConfirmation
