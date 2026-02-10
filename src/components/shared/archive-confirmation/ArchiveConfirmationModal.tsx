'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Trash2, Loader2, Lock, Eye, EyeOff } from 'lucide-react'

export interface ArchiveConfirmationModalProps {
    title: string
    entityLabel: string
    isOpen: boolean
    isDeleting?: boolean
    onClose: () => void
    onConfirm: (options?: { deleteInvoice?: boolean; reason?: string }) => void
    /** Entity summary card (e.g. work order or invoice details) */
    children: React.ReactNode
    /** Shown after password is verified: archiving info box + optional invoice checkbox or paid-invoice warning */
    contentAfterPassword?: React.ReactNode
    /** Primary button label, e.g. "Archive Work Order" or "Archive Invoice". Can include " & Invoice" for work order. */
    confirmButtonLabel: string
}

/**
 * Shared archive confirmation modal used for both Work Order and Invoice deletion.
 * Requires admin password verification before showing final confirm step.
 */
export function ArchiveConfirmationModal({
    title,
    entityLabel,
    isOpen,
    isDeleting = false,
    onClose,
    onConfirm,
    children,
    contentAfterPassword,
    confirmButtonLabel,
}: ArchiveConfirmationModalProps) {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPasswordVerified, setIsPasswordVerified] = useState(false)
    const [archiveReason, setArchiveReason] = useState('')

    useEffect(() => {
        if (isOpen) {
            setPassword('')
            setError(null)
            setIsPasswordVerified(false)
            setArchiveReason('')
        }
    }, [isOpen])

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
                headers: { 'Content-Type': 'application/json' },
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
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setIsVerifying(false)
        }
    }

    const handleClose = () => {
        setPassword('')
        setError(null)
        setIsPasswordVerified(false)
        setArchiveReason('')
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md bg-slate-50 dark:bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isPasswordVerified
                            ? `Password verified. Confirm to archive this ${entityLabel}.`
                            : `Admin password required to archive ${entityLabel}s.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-white dark:bg-card rounded-lg p-4 border border-border">
                        {children}
                    </div>

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
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                                        disabled={isVerifying}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={!password.trim() || isVerifying}
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isVerifying ? (
                                    <span className="flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Verifying...
                                    </span>
                                ) : (
                                    'Verify Password'
                                )}
                            </Button>
                        </form>
                    )}

                    {isPasswordVerified && (
                        <>
                            {contentAfterPassword}
                            <div className="space-y-2">
                                <Label htmlFor="archive-reason" className="text-foreground">
                                    Why are you archiving this {entityLabel}? <span className="text-muted-foreground text-sm">(Optional)</span>
                                </Label>
                                <Textarea
                                    id="archive-reason"
                                    value={archiveReason}
                                    onChange={(e) => setArchiveReason(e.target.value)}
                                    placeholder="Enter reason for archiving..."
                                    rows={3}
                                    className="bg-white dark:bg-background border-border text-foreground placeholder-muted-foreground resize-none"
                                    disabled={isDeleting}
                                />
                            </div>
                        </>
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
                            onClick={() => onConfirm({ reason: archiveReason.trim() || undefined })}
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
                                    {confirmButtonLabel}
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
