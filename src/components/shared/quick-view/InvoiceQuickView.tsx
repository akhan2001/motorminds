'use client'

import React from 'react'
import { FileText, User, Car, Loader2, Check, XCircle, DollarSign, X, CreditCard, LayoutIcon, Receipt, Undo2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useInvoice } from '@/app/(features)/financials/hooks/use-invoices'
import { useExpensesByInvoice } from '@/app/(features)/expenses/hooks/use-expenses'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { formatPhoneNumber } from '@/lib/utils/formatters'
import { format } from 'date-fns'
import { ExpenseSummaryCard } from '@/app/(features)/expenses/components/ExpenseSummaryCard'
import { MigrationMetadataView } from '@/app/(features)/financials/components/invoices/MigrationMetadataView'

interface InvoiceQuickViewProps {
    invoiceId: string // invoice_number
    isOpen: boolean
    onClose: () => void
}

export function InvoiceQuickView({ invoiceId, isOpen, onClose }: InvoiceQuickViewProps) {
    const { data: invoice, isLoading, error } = useInvoice(invoiceId, { includeArchived: true })
    
    // Fetch expenses from the expenses table linked to this invoice
    const { data: invoiceExpenses = [], isLoading: expensesLoading } = useExpensesByInvoice(invoice?.id || null)

    const formatDateString = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A'
        return formatDate(dateString)
    }

    if (isLoading) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] [&>button:last-child]:hidden">
                    <DialogHeader className="flex-shrink-0 pb-4 border-b border-border dark:border-[#2a2a2a]">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted dark:bg-[#1a1a1a]">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                </div>
                                <DialogTitle className="text-lg font-semibold text-foreground dark:text-white">
                                    Loading Invoice...
                                </DialogTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (error || !invoice) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] [&>button:last-child]:hidden">
                    <DialogHeader className="flex-shrink-0 pb-4 border-b border-border dark:border-[#2a2a2a]">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted dark:bg-[#1a1a1a]">
                                    <FileText className="h-5 w-5 text-red-500" />
                                </div>
                                <DialogTitle className="text-lg font-semibold text-foreground dark:text-white">
                                    Invoice Not Found
                                </DialogTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="text-center py-12 text-muted-foreground">
                        Unable to load invoice details.
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Normalize invoice_items to always be an array
    // Handle cases where it might be a string (JSON), object, null, or already an array
    const normalizeInvoiceItems = (items: any): any[] => {
        if (!items) return []
        if (Array.isArray(items)) return items
        if (typeof items === 'string') {
            try {
                const parsed = JSON.parse(items)
                return Array.isArray(parsed) ? parsed : []
            } catch {
                return []
            }
        }
        if (typeof items === 'object') {
            // If it's a single object, wrap it in an array
            return [items]
        }
        return []
    }

    const invoiceItems = normalizeInvoiceItems(invoice.invoice_items)

    // Calculate totals - only include active items, exclude expense items (tracking only), handle discounts correctly
    const activeItems = invoiceItems.filter((item: any) => item.active !== false && item.item_type !== 'expense')
    const subtotal = activeItems.reduce((sum: number, item: any) => {
        if (item.item_type === 'discount') return sum - item.total_price
        return sum + item.total_price
    }, 0)
    const tax = subtotal * (invoice.tax_rate || 0)
    const total = subtotal + tax - (invoice.discount_amount || 0)

    // Calculate amount_paid from active (non-deleted) payments
    const allPayments = (invoice.payments || []) as any[]
    const activePayments = allPayments.filter(p => !p.deleted)
    const calculatedAmountPaid = activePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const hasActivePayments = activePayments.length > 0

    // Calculate total_refunded from active (non-deleted) refunds
    const allRefunds = (invoice.refunds || []) as any[]
    const activeRefunds = allRefunds.filter(r => !r.deleted)
    const calculatedTotalRefunded = activeRefunds.reduce((sum: number, r: any) => sum + (r.amount || 0), 0)
    const netPaid = Math.max(0, calculatedAmountPaid - calculatedTotalRefunded)

    // Calculate outstanding balance
    const calculatedOutstanding = Math.max(0, total - calculatedAmountPaid)
    const paymentProgress = total > 0 ? (calculatedAmountPaid / total) * 100 : 0
    
    // Determine payment status
    // Consider fully paid if:
    // 1. $0 invoice with $0 payment is fully paid, OR
    // 2. There are active payments AND outstanding balance is 0 (or within 1 cent) OR amount paid equals/exceeds total
    const isFullyPaid = (
        // $0 invoice with $0 payment is fully paid
        (total === 0 && hasActivePayments && calculatedAmountPaid === 0) ||
        // Regular invoice fully paid
        (hasActivePayments && total > 0 && (
            calculatedOutstanding < 0.01 || 
            Math.abs(calculatedAmountPaid - total) < 0.01 || 
            calculatedAmountPaid >= total
        ))
    )
    const isPartiallyPaid = hasActivePayments && calculatedAmountPaid > 0 && !isFullyPaid

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            cash: 'Cash',
            credit_card: 'Credit Card',
            debit: 'Debit',
            bank_transfer: 'Bank Transfer',
            check: 'Check',
            other: 'Other'
        }
        return labels[method] || method
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] [&>button:last-child]:hidden">
                <DialogHeader className="flex-shrink-0 pb-4 border-b border-border dark:border-[#2a2a2a]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted dark:bg-[#1a1a1a]">
                                <FileText className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold text-foreground dark:text-white">
                                    Invoice #{invoice.display_id || invoice.invoice_number}
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground dark:text-gray-400 mt-0.5">
                                    {invoice.title || 'Service Invoice'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                className={
                                    isFullyPaid
                                        ? 'bg-green-600 text-white border-green-600'
                                        : isPartiallyPaid
                                        ? 'bg-yellow-600 text-white border-yellow-600'
                                        : 'bg-red-600 text-white border-red-600'
                                }
                            >
                                {isFullyPaid ? 'PAID' : isPartiallyPaid ? 'PARTIAL' : invoice.status?.toUpperCase() || 'UNPAID'}
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 ml-2">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    {/* Dates */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm mt-2">
                        <p className="text-muted-foreground dark:text-gray-400">
                            Created: {formatDateString(invoice.created_at)}
                        </p>
                        <span className="text-muted-foreground dark:text-gray-500">|</span>
                        <p className="text-muted-foreground dark:text-gray-400">
                            Issued: {formatDateString(invoice.issue_date)}
                        </p>
                        {invoice.paid_date && isFullyPaid && (
                            <>
                                <span className="text-muted-foreground dark:text-gray-500">|</span>
                                <p className="text-green-600 dark:text-green-400 font-medium">
                                    Paid: {formatDateString(invoice.paid_date)}
                                </p>
                            </>
                        )}
                    </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {/* Customer Information Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-foreground dark:text-white">Customer Information</h3>
                                {invoice.customer_type === 'walk_in' && (
                                    <Badge variant="outline" className="ml-2 text-xs border-orange-500 text-orange-500">
                                        Walk-in
                                    </Badge>
                                )}
                            </div>
                            {invoice.customer_type === 'walk_in' ? (
                                <div className="text-center py-4">
                                    <p className="text-foreground dark:text-white font-medium">Walk-in Customer</p>
                                    <p className="text-muted-foreground dark:text-gray-400 text-sm">Walk-in customers do not have a customer record.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">Name</p>
                                        <p className="text-foreground dark:text-white font-medium">{invoice.customer?.customer_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">Phone</p>
                                        <p className="text-foreground dark:text-gray-300">{invoice.customer?.customer_phone ? formatPhoneNumber(invoice.customer.customer_phone) : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">Email</p>
                                        <p className="text-foreground dark:text-gray-300">{invoice.customer?.customer_email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">Address</p>
                                        <p className="text-foreground dark:text-gray-300">{invoice.customer?.customer_address || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Vehicle Information Card */}
                    {(invoice.vehicle || invoice.walk_in_vehicle_info) && (
                        <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Vehicle Information</h3>
                                </div>
                                {invoice.customer_type === 'walk_in' && invoice.walk_in_vehicle_info ? (
                                    <p className="text-foreground dark:text-white">
                                        {invoice.walk_in_vehicle_info.year} {invoice.walk_in_vehicle_info.make} {invoice.walk_in_vehicle_info.model}
                                        {invoice.walk_in_vehicle_info.license_plate
                                            ? ` - ${invoice.walk_in_vehicle_info.license_plate}`
                                            : ''
                                        }
                                    </p>
                                ) : invoice.vehicle ? (
                                    <p className="text-foreground dark:text-white">
                                        {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                        {invoice.vehicle.license_plate && invoice.vehicle.license_plate !== 'NULL'
                                            ? ` - ${invoice.vehicle.license_plate}`
                                            : ''
                                        }
                                    </p>
                                ) : null}
                            </div>
                        </Card>
                    )}

                    {/* Line Items Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <LayoutIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <h3 className="text-lg font-semibold text-foreground dark:text-white">Items</h3>
                            </div>
                            
                            {/* Line Items Table */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground dark:text-gray-400 border-b border-border dark:border-gray-700 pb-2">
                                    <div className="col-span-5">DESCRIPTION</div>
                                    <div className="col-span-2 text-center">TYPE</div>
                                    <div className="col-span-2 text-center">QTY / HOURS</div>
                                    <div className="col-span-3 text-right">TOTAL</div>
                                </div>

                                {/* Invoice Items - exclude expense items (they're shown in Expenses Card below) */}
                                {invoiceItems
                                    .filter((item: any) => item.item_type !== 'expense')
                                    .map((item: any, index: number) => {
                                    const isActive = item.active !== false
                                    return (
                                        <div 
                                            key={index} 
                                            className={`text-sm py-2 border-b ${
                                                !isActive
                                                    ? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5'
                                                    : 'border-border dark:border-gray-800'
                                            }`}
                                        >
                                            <div className="grid grid-cols-12 gap-2 items-center">
                                                <div className="col-span-5 text-foreground dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        {isActive ? (
                                                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                        ) : (
                                                            <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                                        )}
                                                        <span className="truncate">{item.description}</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-xs capitalize ${
                                                            !isActive
                                                                ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/20'
                                                                : 'text-foreground dark:text-white'
                                                        }`}
                                                    >
                                                        {item.item_type}
                                                    </Badge>
                                                </div>
                                                <div className="col-span-2 text-center text-foreground dark:text-white">
                                                    {item.item_type === 'labor' ? item.labor_hours || item.quantity : item.quantity}
                                                </div>
                                                <div className="col-span-3 text-right text-foreground dark:text-white">
                                                    {item.item_type === 'discount' ? (
                                                        <span className="text-red-600 dark:text-red-400 font-semibold">
                                                            -{formatCurrency(Math.abs(item.total_price))}
                                                        </span>
                                                    ) : (
                                                        formatCurrency(item.total_price)
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>


                            {invoice.notes && (
                                <div className="mt-4 pt-4 border-t border-border dark:border-gray-700">
                                    <p className="text-foreground dark:text-white font-medium">Notes:</p>
                                    <p className="text-muted-foreground dark:text-gray-400 mt-1">{invoice.notes}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Migration data (under Notes) — human-readable */}
                    {(invoice as any).migration_metadata != null && (
                        <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3">Migration data</h3>
                                <MigrationMetadataView migrationMetadata={(invoice as any).migration_metadata} />
                            </div>
                        </Card>
                    )}

                    {/* Expenses Card (from expenses table) */}
                    {expensesLoading ? (
                        <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Expenses</h3>
                                </div>
                                <div className="text-sm text-muted-foreground dark:text-gray-400">Loading expenses...</div>
                            </div>
                        </Card>
                    ) : invoiceExpenses.length > 0 ? (
                        <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Expenses</h3>
                                    <Badge variant="outline" className="text-xs">
                                        {invoiceExpenses.length}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    {invoiceExpenses.map((expense: any) => {
                                        const isRefunded = (expense.refund_amount && expense.refund_amount > 0) || expense.resolution_type === 'returned'
                                        return (
                                            <div key={expense.id} className="relative">
                                                {isRefunded && (
                                                    <div className="absolute top-2 right-2 z-10">
                                                        <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 flex items-center gap-1">
                                                            <Undo2 className="h-3 w-3" />
                                                            Refunded
                                                        </Badge>
                                                    </div>
                                                )}
                                                <div className={isRefunded ? 'opacity-60' : ''}>
                                                    <ExpenseSummaryCard expense={expense} />
                                                </div>
                                                {isRefunded && expense.refund_amount > 0 && (
                                                    <div className="mt-2 text-right text-xs text-green-600 dark:text-green-400">
                                                        Refund: {formatCurrency(expense.refund_amount)}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                    <Separator className="bg-border dark:bg-gray-700" />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total Expenses:</span>
                                        <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                            {formatCurrency(
                                                invoiceExpenses.reduce((sum: number, exp: any) => {
                                                    const refund = exp.refund_amount || 0
                                                    return sum + Math.max(0, exp.total - refund)
                                                }, 0)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : null}

                    {/* Invoice Summary Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <h3 className="text-lg font-semibold text-foreground dark:text-white">Invoice Summary</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-foreground dark:text-white">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {invoice.tax_rate > 0 && (
                                    <div className="flex justify-between text-muted-foreground dark:text-gray-400">
                                        <span>Tax ({(invoice.tax_rate * 100).toFixed(0)}%):</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                )}
                                {invoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-muted-foreground dark:text-gray-400">
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(invoice.discount_amount)}</span>
                                    </div>
                                )}
                                <Separator className="bg-border dark:bg-gray-700" />
                                <div className="flex justify-between items-center pt-2">
                                    <p className="text-muted-foreground dark:text-gray-400 font-medium">Total Amount:</p>
                                    <p className="text-2xl font-bold text-foreground dark:text-white">{formatCurrency(total)}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Payments Summary Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <h3 className="text-lg font-semibold text-foreground dark:text-white">Payments</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground dark:text-gray-400">Total Amount:</span>
                                    <span className="text-sm font-medium text-foreground dark:text-white">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground dark:text-gray-400">Amount Paid:</span>
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                        {formatCurrency(calculatedAmountPaid)}
                                    </span>
                                </div>
                                {calculatedTotalRefunded > 0 && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground dark:text-gray-400">Total Refunded:</span>
                                            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                                -{formatCurrency(calculatedTotalRefunded)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-border dark:border-[#333] pt-2">
                                            <span className="text-sm font-medium text-foreground dark:text-white">Net Paid:</span>
                                            <span className="text-sm font-semibold text-foreground dark:text-white">
                                                {formatCurrency(netPaid)}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground dark:text-gray-400">Outstanding:</span>
                                    <span className={`text-sm font-semibold ${
                                        calculatedOutstanding > 0
                                            ? 'text-orange-600 dark:text-orange-400'
                                            : 'text-green-600 dark:text-green-400'
                                    }`}>
                                        {formatCurrency(calculatedOutstanding)}
                                    </span>
                                </div>
                                
                                {/* Progress Bar */}
                                {total > 0 && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground dark:text-gray-400">
                                            <span>Payment Progress</span>
                                            <span>{paymentProgress.toFixed(0)}%</span>
                                        </div>
                                        <Progress 
                                            value={Math.min(paymentProgress, 100)} 
                                            className="h-2"
                                        />
                                    </div>
                                )}

                                {/* Payment History */}
                                {activePayments.length > 0 ? (
                                    <div className="space-y-2 pt-2">
                                        <h4 className="text-sm font-medium text-foreground dark:text-white">
                                            Payment History
                                        </h4>
                                        <div className="space-y-2">
                                            {activePayments.map((payment: any) => (
                                                <div
                                                    key={payment.id}
                                                    className="flex items-center justify-between p-3 bg-background dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a]"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <CreditCard className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                                                            <span className="font-medium text-foreground dark:text-white">
                                                                {formatCurrency(payment.amount)}
                                                            </span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {getPaymentMethodLabel(payment.payment_method)}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground dark:text-gray-400">
                                                            {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-sm text-muted-foreground dark:text-gray-400">
                                        No payments recorded yet
                                    </div>
                                )}

                                {/* Refund History */}
                                {activeRefunds.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                            Refunds
                                        </h4>
                                        <div className="space-y-2">
                                            {activeRefunds.map((refund: any) => (
                                                <div
                                                    key={refund.id}
                                                    className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-500/5 rounded-lg border border-orange-200 dark:border-orange-500/20"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-orange-700 dark:text-orange-300">
                                                                -{formatCurrency(refund.amount)}
                                                            </span>
                                                            <Badge variant="outline" className="text-xs border-orange-300 dark:border-orange-500/40 text-orange-600 dark:text-orange-400">
                                                                {getPaymentMethodLabel(refund.refund_method)}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground dark:text-gray-400 space-y-0.5">
                                                            <div>{format(new Date(refund.refund_date), 'MMM d, yyyy')}</div>
                                                            <div className="text-orange-600 dark:text-orange-400">{refund.reason}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
