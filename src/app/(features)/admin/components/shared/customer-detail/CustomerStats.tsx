'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Wrench, CalendarDays, Receipt } from 'lucide-react'
import { formatCurrency } from './utils'
import type { CustomerHistory } from './types'

interface CustomerStatsProps {
    customerHistory: CustomerHistory
}

export const CustomerStats: React.FC<CustomerStatsProps> = ({ customerHistory }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-500 dark:text-green-400" />
                        <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total Spent</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground dark:text-white">
                        {formatCurrency(customerHistory.totalSpent)}
                    </p>
                </CardContent>
            </Card>
            
            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Wrench className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">Work Orders</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground dark:text-white">
                        {customerHistory.stats?.totalWorkOrders || customerHistory.workOrders.length}
                    </p>
                </CardContent>
            </Card>
            
            {/* <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                        <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">Appointments</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground dark:text-white">
                        {customerHistory.stats?.totalAppointments || customerHistory.appointments?.length || 0}
                    </p>
                </CardContent>
            </Card> */}
            
            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Receipt className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                        <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">Invoices</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground dark:text-white">
                        {customerHistory.stats?.totalInvoices || customerHistory.invoices?.length || 0}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
