'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import AddExpenseModal from './AddExpenseModal'

interface ExpensesPageHeaderProps {
    title?: string
    description?: string
    backRoute?: string
    shopId?: string | null
    onExpenseAdded?: () => void
    addExpenseButtonText?: string
}

export function ExpensesPageHeader({
    title = 'Parts & Expenses',
    description = 'View all parts and expenses across all work orders and general business expenses',
    backRoute = '/operations/work-orders',
    shopId,
    onExpenseAdded,
    addExpenseButtonText = 'Add Expense',
}: ExpensesPageHeaderProps) {
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
                    <AddExpenseModal shopId={shopId} onExpenseAdded={onExpenseAdded}>
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            {addExpenseButtonText}
                        </Button>
                    </AddExpenseModal>
                )}
            </div>
        </div>
    )
}
