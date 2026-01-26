'use client'

import React from 'react'
import { FileText, User, Car, Loader2, Check, XCircle, DollarSign, X, Receipt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useInvoice } from '@/app/(features)/financials/hooks/use-invoices'
import { useWorkOrderItems } from '@/app/(features)/operations/hooks/use-work-order-items'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { formatPhoneNumber } from '@/lib/utils/formatters'

interface InvoiceQuickViewProps {
    invoiceId: string // invoice_number
    isOpen: boolean
    onClose: () => void
}

export function InvoiceQuickView({ invoiceId, isOpen, onClose }: InvoiceQuickViewProps) {
    const { data: invoice, isLoading, error } = useInvoice(invoiceId)
    
    // Fetch work order items to get expense items (tracking only)
    const { data: workOrderItems = [] } = useWorkOrderItems(invoice?.work_order_id || '')
    
    // Filter expense items from work order (these are tracking only, not on invoice)
    const expenseItems = workOrderItems.filter((item: any) => item.item_type === 'expense' && item.active !== false)

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

    // Calculate totals - only include active items, exclude expense items (tracking only), handle discounts correctly
    const activeItems = (invoice.invoice_items || []).filter((item: any) => item.active !== false && item.item_type !== 'expense')
    const subtotal = activeItems.reduce((sum: number, item: any) => {
        if (item.item_type === 'discount') return sum - item.total_price
        return sum + item.total_price
    }, 0)
    const tax = subtotal * (invoice.tax_rate || 0)
    const total = subtotal + tax - (invoice.discount_amount || 0)

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
                                    invoice.status === 'paid'
                                        ? 'bg-green-600 text-white border-green-600'
                                        : invoice.status === 'partially_paid'
                                        ? 'bg-yellow-600 text-white border-yellow-600'
                                        : 'bg-red-600 text-white border-red-600'
                                }
                            >
                                {invoice.status.replace('_', ' ').toUpperCase()}
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
                        {invoice.paid_date && (
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
                                        <p className="text-foreground dark:text-gray-300">{formatPhoneNumber(invoice.customer?.customer_phone || null)}</p>
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
                            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Items</h3>
                            
                            {/* Line Items Table */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground dark:text-gray-400 border-b border-border dark:border-gray-700 pb-2">
                                    <div className="col-span-5">DESCRIPTION</div>
                                    <div className="col-span-2 text-center">TYPE</div>
                                    <div className="col-span-2 text-center">QTY / HOURS</div>
                                    <div className="col-span-3 text-right">TOTAL</div>
                                </div>

                                {/* Invoice Items */}
                                {invoice.invoice_items.map((item: any, index: number) => {
                                    const isActive = item.active !== false
                                    return (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-border dark:border-gray-800">
                                            <div className="col-span-5 text-foreground dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    {isActive ? (
                                                        <Check className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3 text-red-500" />
                                                    )}
                                                    <span>{item.description}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <Badge variant="outline" className="text-xs capitalize text-foreground dark:text-white">
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

                    {/* Expense Items Card (Tracking Only - Not Billed) */}
                    {expenseItems.length > 0 && (
                        <Card className="bg-orange-50/50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Shop Expenses</h3>
                                    <Badge className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/30 text-xs">
                                        Tracking Only
                                    </Badge>
                                </div>
                                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mb-3">
                                    These expenses are for internal cost tracking and are not included in the customer invoice.
                                </p>
                                
                                {/* Expense Items Table */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-orange-600/80 dark:text-orange-400/80 border-b border-orange-200 dark:border-orange-500/20 pb-2">
                                        <div className="col-span-5">DESCRIPTION</div>
                                        <div className="col-span-4 text-center">VENDOR / INVOICE</div>
                                        <div className="col-span-3 text-right">COST</div>
                                    </div>

                                    {expenseItems.map((item: any, index: number) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-orange-200/50 dark:border-orange-500/10">
                                            <div className="col-span-5 text-foreground dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="h-3 w-3 text-orange-500" />
                                                    <span>{item.description}</span>
                                                </div>
                                                {item.expense_cost_date && (
                                                    <div className="text-xs text-muted-foreground dark:text-gray-500 ml-5">
                                                        {formatDate(item.expense_cost_date)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-4 text-center text-muted-foreground dark:text-gray-400 text-xs">
                                                {item.expense_vendor || item.supplier || '-'}
                                                {(item.expense_invoice_number || item.part_number) && (
                                                    <div>#{item.expense_invoice_number || item.part_number}</div>
                                                )}
                                            </div>
                                            <div className="col-span-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                                                {formatCurrency(item.total_price || 0)}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Expense Total */}
                                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-orange-200 dark:border-orange-500/20">
                                        <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Shop Expenses:</span>
                                        <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                            {formatCurrency(expenseItems.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

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
                                {(invoice.amount_paid !== undefined && invoice.amount_paid > 0) && (
                                    <>
                                        <Separator className="bg-border dark:bg-gray-700" />
                                        <div className="flex justify-between items-center pt-2">
                                            <p className="text-muted-foreground dark:text-gray-400 font-medium">Amount Paid:</p>
                                            <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                                                {formatCurrency(invoice.amount_paid)}
                                            </p>
                                        </div>
                                        {(invoice.outstanding_balance !== undefined && invoice.outstanding_balance > 0) && (
                                            <div className="flex justify-between items-center">
                                                <p className="text-muted-foreground dark:text-gray-400 font-medium">Outstanding:</p>
                                                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                                    {formatCurrency(invoice.outstanding_balance)}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
