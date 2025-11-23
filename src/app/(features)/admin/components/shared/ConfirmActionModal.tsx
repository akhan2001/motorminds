'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'

interface ConfirmActionModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    isLoading?: boolean
}

export function ConfirmActionModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    isLoading = false
}: ConfirmActionModalProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                        <AlertTriangle className={`h-5 w-5 ${variant === 'destructive' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        disabled={isLoading}
                        className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

