'use client'

import React from 'react'
import { History } from 'lucide-react'
import type { Customer } from './types'

interface CustomerNotesProps {
    customer: Customer
}

export const CustomerNotes: React.FC<CustomerNotesProps> = ({ customer }) => {
    if (!customer.notes) return null

    return (
        <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <h3 className="text-foreground dark:text-white font-medium">Notes</h3>
            </div>
            <p className="text-sm text-foreground dark:text-white whitespace-pre-wrap">
                {customer.notes}
            </p>
        </div>
    )
}
