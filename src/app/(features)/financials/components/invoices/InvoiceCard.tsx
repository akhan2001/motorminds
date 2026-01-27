'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, DollarSign, Calendar, User, Car } from 'lucide-react'
import type { InvoiceWithDetails } from '../../types/invoice'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatInvoiceDisplayId } from '../../lib/invoice-calculations'

interface InvoiceCardProps {
    invoice: InvoiceWithDetails
    isSelected: boolean
    onClick: () => void
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, isSelected, onClick }) => {
    // Calculate payment status based on amounts (only PAID, UNPAID, or PARTIALLY PAID)
    const totalAmount = Number(invoice.total_amount) || 0
    const amountPaid = Number(invoice.amount_paid) || 0
    const payments = (invoice.payments as any[]) || []
    const activePayments = payments.filter(p => !p?.deleted)
    const hasActivePayments = activePayments.length > 0
    
    // Determine display status
    let displayStatus: 'PAID' | 'UNPAID' | 'PARTIALLY PAID'
    if (totalAmount === 0 && hasActivePayments) {
        // $0 invoice with any payment is paid
        displayStatus = 'PAID'
    } else if (amountPaid === 0 || !hasActivePayments) {
        displayStatus = 'UNPAID'
    } else if (amountPaid >= totalAmount) {
        displayStatus = 'PAID'
    } else {
        displayStatus = 'PARTIALLY PAID'
    }
    
    const isPaid = displayStatus === 'PAID'

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 dark:text-red-400'
            case 'high': return 'text-orange-600 dark:text-orange-400'
            case 'medium': return 'text-yellow-600 dark:text-yellow-400'
            default: return 'text-muted-foreground dark:text-gray-400'
        }
    }

    return (
        <Card 
            className={cn(
                "bg-slate-50 dark:bg-[#131313] border-border dark:border-[#2a2a2a] p-2 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:shadow-lg mr-2",
                isSelected && "border-zinc-500 dark:border-zinc-500 ring-1 ring-red-500/20"
            )}
            onClick={onClick}
        >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    {/* <FileText className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-400" /> */}
                    <div>
                        <h3 className="text-sm font-medium text-foreground dark:text-white">
                            {invoice.title || invoice.work_order?.title || 'Invoice'}
                        </h3>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">#{formatInvoiceDisplayId(invoice.display_id, invoice.invoice_number)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`${isPaid ? 'text-green-600 dark:text-green-500' : displayStatus === 'PARTIALLY PAID' ? 'text-yellow-600 dark:text-yellow-500' : 'text-red-600 dark:text-red-500'} text-xs px-1.5 py-0.5 rounded-full border ${isPaid ? 'border-green-800 dark:border-green-800' : displayStatus === 'PARTIALLY PAID' ? 'border-yellow-800 dark:border-yellow-800' : 'border-red-800 dark:border-red-800'}`}>
                        {displayStatus}
                    </span>
                </div>
            </div>

            {/* Separator */}
            <div className="border-t border-border dark:border-gray-800 my-2"></div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Customer Info */}
                <div>
                    <p className="text-xs uppercase mb-0.5 text-muted-foreground dark:text-gray-400">CUSTOMER</p>
                    {invoice.customer_type === 'walk_in' ? (
                        <>
                            <p className="text-xs font-medium text-foreground dark:text-white">Walk-in Customer</p>
                            <p className="text-xs text-muted-foreground dark:text-gray-400">No customer record</p>
                        </>
                    ) : (
                        <>
                            <p className="text-xs font-medium text-foreground dark:text-white">{invoice.customer?.customer_name || 'Unknown'}</p>
                            {invoice.customer?.customer_email && (
                                <p className="text-xs text-muted-foreground dark:text-gray-400">{invoice.customer.customer_email}</p>
                            )}
                        </>
                    )}
                </div>

                {/* Vehicle Info */}
                {(invoice.vehicle || invoice.walk_in_vehicle_info) && (
                    <div>
                        <p className="text-xs uppercase mb-0.5 text-muted-foreground dark:text-gray-400">VEHICLE</p>
                        {invoice.customer_type === 'walk_in' && invoice.walk_in_vehicle_info ? (
                            <>
                                <p className="text-xs font-medium text-foreground dark:text-white">
                                    {invoice.walk_in_vehicle_info.year} {invoice.walk_in_vehicle_info.make} {invoice.walk_in_vehicle_info.model}
                                </p>
                                {invoice.walk_in_vehicle_info.license_plate && (
                                    <p className="text-xs text-muted-foreground dark:text-gray-400">Plate: {invoice.walk_in_vehicle_info.license_plate}</p>
                                )}
                            </>
                        ) : invoice.vehicle ? (
                            <>
                                <p className="text-xs font-medium text-foreground dark:text-white">
                                    {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                </p>
                                {invoice.vehicle.license_plate && (
                                    <p className="text-xs text-muted-foreground dark:text-gray-400">Plate: {invoice.vehicle.license_plate}</p>
                                )}
                            </>
                        ) : null}
                    </div>
                )}

                {/* Amount */}
                <div className="text-right">
                    <p className="text-xs text-muted-foreground dark:text-gray-400 uppercase mb-0.5">
                        {isPaid ? "AMOUNT PAID" : "AMOUNT DUE"}
                    </p>
                    <p className={`text-base font-bold ${isPaid ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                        ${Number(invoice.total_amount || 0).toFixed(2)}
                    </p>
                    {invoice.tax_amount > 0 && (
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                            (Tax: ${Number(invoice.tax_amount).toFixed(2)})
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">Issued: {format(new Date(invoice.issue_date), 'MMM dd')}</p>
                </div>
            </div>

            {/* Footer Row - Only show if there are work orders or payment methods */}
            {(invoice.work_order || invoice.payment_method) && (
                <div className="flex items-center justify-between pt-1.5 border-t border-border dark:border-gray-800">
                    <div className="flex items-center gap-1">
                        {invoice.work_order && (
                            <Badge variant="secondary" className="bg-secondary dark:bg-[#2a2a2a] text-muted-foreground dark:text-gray-300 text-xs px-1 py-0.5">
                                Work Order: {invoice.work_order.work_order_number}
                            </Badge>
                        )}
                        <Badge variant="secondary" className={cn("text-xs px-1 py-0.5", getPriorityColor(invoice.priority))}>
                            {invoice.priority}
                        </Badge>
                    </div>
                    
                    {invoice.payment_method && (
                        <span className="text-xs text-muted-foreground dark:text-gray-500 capitalize">
                            {invoice.payment_method.replace('_', ' ')}
                        </span>
                    )}
                </div>
            )}
        </Card>
    )
}

export default InvoiceCard

