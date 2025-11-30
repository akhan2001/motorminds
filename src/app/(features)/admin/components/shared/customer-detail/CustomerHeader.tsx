'use client'

import React from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/text'
import type { Customer } from './types'

interface CustomerHeaderProps {
    customer: Customer
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({ customer }) => {
    return (
        <SheetHeader className="pb-4 border-b border-border dark:border-[#222222]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-red-600 text-white text-sm">
                            {getInitials(customer.customer_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <SheetTitle className="text-foreground dark:text-white text-xl font-bold">
                            {customer.customer_name}
                        </SheetTitle>
                        <p className="text-muted-foreground dark:text-gray-400 text-sm">
                            Customer ID: {customer.id.slice(0, 8)}...
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-500/20">
                        Active
                    </Badge>
                </div>
            </div>
        </SheetHeader>
    )
}
