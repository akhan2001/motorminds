'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import AddCreditRefundModal from './AddCreditRefundModal'

interface CreditsRefundsPageHeaderProps {
    title?: string
    description?: string
    backRoute?: string
    shopId?: string | null
    onCreditRefundAdded?: () => void
}

export function CreditsRefundsPageHeader({
    title = 'Credits & Refunds',
    description = 'Track supplier credits and refunds',
    backRoute = '/expenses',
    shopId,
    onCreditRefundAdded,
}: CreditsRefundsPageHeaderProps) {
    const router = useRouter()

    return (
        <div className="flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    {backRoute && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(backRoute)}
                            className="-ml-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <h1 className="text-3xl font-bold text-foreground dark:text-white">
                        {title}
                    </h1>
                </div>
                <p className="text-muted-foreground dark:text-gray-400 ml-11">
                    {description}
                </p>
            </div>
            <div className="flex items-center gap-4">
                {shopId && (
                    <AddCreditRefundModal
                        shopId={shopId}
                        onCreditRefundAdded={onCreditRefundAdded}
                    >
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Credit/Refund
                        </Button>
                    </AddCreditRefundModal>
                )}
            </div>
        </div>
    )
}
