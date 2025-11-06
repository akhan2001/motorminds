'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowRight, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function NewInvoicesBanner() {
    const router = useRouter()

    const handleNavigate = () => {
        router.push('/financials/invoices')
    }

    return (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-600/20 dark:to-orange-600/20 border-b border-red-300 dark:border-red-500/30">
            <div className="max-w-7xl mx-auto px-6 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-foreground font-medium text-sm">
                                Checkout the new refreshed invoices
                            </p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                Experience our improved invoice management system
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={handleNavigate}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            View New Invoices
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

