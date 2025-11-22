'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertCircle } from 'lucide-react'

interface LimitReachedModalProps {
    isOpen: boolean
    onClose: () => void
    limit: number
    maxTotal?: number
    adminType?: 'organization-admin' | 'shop-admin'
}

export function LimitReachedModal({
    isOpen,
    onClose,
    limit,
    maxTotal,
    adminType
}: LimitReachedModalProps) {
    const getMessage = () => {
        if (adminType === 'shop-admin' && maxTotal) {
            return `You have reached the maximum limit of ${maxTotal} users (shop admin + ${limit} additional users). Please contact support to increase your limit.`
        }
        return `You have reached the maximum limit of ${limit} users. Please contact support to increase your limit.`
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        User Limit Reached
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                        {getMessage()}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white">
                        Understood
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

