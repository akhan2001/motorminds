'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, DollarSign, Calendar, User, Car } from 'lucide-react'
import type { InvoiceWithDetails } from '../../types/invoice'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface InvoiceCardProps {
    invoice: InvoiceWithDetails
    isSelected: boolean
    onClick: () => void
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, isSelected, onClick }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-500/10 text-green-400 border-green-500/20'
            case 'sent': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            case 'viewed': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            case 'overdue': return 'bg-red-500/10 text-red-400 border-red-500/20'
            case 'cancelled': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
            case 'refunded': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-400'
            case 'high': return 'text-orange-400'
            case 'medium': return 'text-yellow-400'
            default: return 'text-gray-400'
        }
    }

    return (
        <Card 
            className={cn(
                "bg-[#1a1a1a] border-[#2a2a2a] p-4 cursor-pointer transition-all hover:border-[#3a3a3a] hover:shadow-lg",
                isSelected && "border-red-500 ring-1 ring-red-500/20"
            )}
            onClick={onClick}
        >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                        <h3 className="text-white font-semibold">
                            {invoice.display_id || invoice.invoice_number}
                        </h3>
                        <p className="text-sm text-gray-400">{invoice.title || 'Untitled Invoice'}</p>
                    </div>
                </div>
                <Badge variant="outline" className={cn("text-xs", getStatusColor(invoice.status))}>
                    {invoice.status}
                </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                {/* Customer */}
                <div className="flex items-center gap-2 text-gray-400">
                    <User className="h-4 w-4" />
                    <span className="truncate">{invoice.customer?.customer_name || 'Unknown'}</span>
                </div>

                {/* Vehicle */}
                {invoice.vehicle && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Car className="h-4 w-4" />
                        <span className="truncate">
                            {invoice.vehicle.year} {invoice.vehicle.make}
                        </span>
                    </div>
                )}

                {/* Issue Date */}
                <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</span>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-2 text-gray-400">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold text-white">
                        ${Number(invoice.total_amount).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Footer Row */}
            <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                    {invoice.work_order && (
                        <Badge variant="secondary" className="bg-[#2a2a2a] text-gray-300 text-xs">
                            WO: {invoice.work_order.work_order_number}
                        </Badge>
                    )}
                    <Badge variant="secondary" className={cn("text-xs", getPriorityColor(invoice.priority))}>
                        {invoice.priority}
                    </Badge>
                </div>
                
                {invoice.payment_method && (
                    <span className="text-xs text-gray-500 capitalize">
                        {invoice.payment_method.replace('_', ' ')}
                    </span>
                )}
            </div>
        </Card>
    )
}

export default InvoiceCard
