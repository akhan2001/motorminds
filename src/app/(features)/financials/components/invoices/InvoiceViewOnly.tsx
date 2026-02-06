'use client'

import React, { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    Edit,
    Download,
    Send,
    Trash2,
    User,
    Car,
    LayoutIcon,
    X,
    Check,
    XCircle,
    Wrench,
    DollarSign,
} from 'lucide-react'
import { useInvoice, useDeleteInvoice, useUpdateInvoice } from '../../hooks/use-invoices'
import { useAuth } from '../../../operations/hooks/use-auth'
import { useWorkOrderItems } from '../../../operations/hooks/use-work-order-items'
import { useExpensesByInvoice } from '@/app/(features)/expenses/hooks/use-expenses'
import { ExpenseSummaryCard } from '@/app/(features)/expenses/components/ExpenseSummaryCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/currency'
import { InvoiceSendModal } from './InvoiceSendModal'
import { InvoiceSendChoiceModal } from './InvoiceSendChoiceModal'
import { InvoiceSendSmsModal } from './InvoiceSendSmsModal'
import { InvoicePaymentsSection } from './InvoicePaymentsSection'
import { InvoicePreviewModal } from './InvoicePreviewModal'
import { InvoiceDeleteConfirmation } from './InvoiceDeleteConfirmation'
import { useRouter } from 'next/navigation'
import { useShopInfo } from '@/hooks/core/useShopInfo'
import { useTemplatePreference } from '../../hooks/use-template-preference'
import { generateInvoicePDF, downloadPDF, getInvoiceFilename, generateInvoicePDFFromHTMLElement } from '../../lib/pdf/pdf-generator'
import { prepareShopBrandingWithLogo } from '../../lib/pdf/logo-utils'
import { TonyTemplatePreview } from '../invoice-preview/TonyTemplatePreview'

interface InvoiceViewOnlyProps {
    invoiceId: string
    onEdit: () => void
    onClose: () => void
}

// Roles that can delete invoices
const ADMIN_ROLES = ['admin', 'super', 'shop_admin']

const InvoiceViewOnly: React.FC<InvoiceViewOnlyProps> = ({ invoiceId, onEdit, onClose }) => {
    const router = useRouter()
    const { shopId, userRole } = useAuth()
    const { data: invoice, isLoading, error } = useInvoice(invoiceId)
    const { data: shopInfo, isLoading: isLoadingShopInfo, error: shopInfoError } = useShopInfo()
    
    // Fetch work order items (for legacy expense items if any)
    const { data: workOrderItems = [] } = useWorkOrderItems(invoice?.work_order_id || '')
    
    // Fetch expenses from unified expenses table - use invoice.id (UUID) not invoiceId (which might be invoice_number)
    const { data: expenses = [] } = useExpensesByInvoice(invoice?.id ?? null)
    
    // Filter legacy expense items from work order (for backward compatibility)
    const legacyExpenseItems = workOrderItems.filter((item: any) => item.item_type === 'expense' && item.active !== false)
    
    // Use unified expenses table expenses, fallback to legacy if no unified expenses
    const expenseItems = expenses.length > 0 ? expenses : legacyExpenseItems
    const deleteMutation = useDeleteInvoice()
    const updateMutation = useUpdateInvoice()
    const { templateId, setTemplateId } = useTemplatePreference()
    const [isLandscape, setIsLandscape] = useState(false)
    const [isSendChoiceModalOpen, setIsSendChoiceModalOpen] = useState(false)
    const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false)
    const [isSendSmsModalOpen, setIsSendSmsModalOpen] = useState(false)
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const pdfElementRef = useRef<HTMLDivElement>(null)
    
    // Check if user can delete (admin only)
    const canDelete = userRole ? ADMIN_ROLES.includes(userRole) : false

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync({ id: invoiceId, shop_id: shopId || '' })
            toast.success('Invoice archived successfully')
            setIsDeleteModalOpen(false)
            onClose()
        } catch (error: any) {
            console.error('Failed to archive invoice:', error)
            toast.error(error?.message || 'Failed to archive invoice')
        }
    }

    const handleDownload = () => {
        if (!invoice) {
            toast.error('Invoice information not available')
            return
        }

        if (!shopInfo) {
            if (isLoadingShopInfo) {
                toast.info('Loading shop information...')
                return
            }
            if (shopInfoError) {
                toast.error('Failed to load shop information. Please refresh the page and try again.')
                return
            }
            toast.error('Shop information not available')
            return
        }

        // Open preview modal instead of directly downloading
        setIsPreviewModalOpen(true)
    }

    const handleSend = () => {
        setIsSendChoiceModalOpen(true)
    }

    const handleEmailChoice = () => {
        setIsSendChoiceModalOpen(false)
        setIsSendEmailModalOpen(true)
    }

    const handleSmsChoice = () => {
        setIsSendChoiceModalOpen(false)
        setIsSendSmsModalOpen(true)
    }

    const handleSendEmailConfirm = (sendEmail: boolean, customMessage?: string) => {
        if (sendEmail) {
            toast.success('Invoice email sent successfully!')
        }
        setIsSendEmailModalOpen(false)
    }

    const handleSendSmsConfirm = (sendSms: boolean, customMessage?: string) => {
        if (sendSms) {
            toast.success('Invoice SMS sent successfully!')
        }
        setIsSendSmsModalOpen(false)
    }

    const toggleFormat = () => {
        setIsLandscape(!isLandscape)
        toast.success(`PDF format set to ${!isLandscape ? 'Landscape' : 'Portrait'}`)
    }

    const handleGoToWorkOrder = () => {
        if (invoice?.work_order_id) {
            router.push(`/operations/work-orders?id=${invoice.work_order_id}`)
        } else {
            toast.error('No work order associated with this invoice')
        }
    }

    const formatPhoneNumber = (phone: string | null) => {
        if (!phone) return 'N/A'
        const cleaned = phone.replace(/\D/g, '')
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
        }
        return phone
    }

    const formatDateString = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    const handleMarkAsPaid = async () => {
        if (!invoice) return

        const confirmed = confirm('Mark this invoice as paid?')
        if (!confirmed) return

        try {
            await updateMutation.mutateAsync({
                id: invoice.invoice_number,
                data: {
                    status: 'paid',
                    paid_date: new Date().toISOString(),
                },
            })
            toast.success('Invoice marked as paid')
        } catch (err) {
            console.error('Failed to mark invoice as paid:', err)
            toast.error('Failed to mark invoice as paid')
        }
    }

    if (isLoading) {
        return (
            <div className="h-full flex flex-col space-y-4 p-4">
                <Skeleton className="h-10 w-full bg-secondary dark:bg-[#2a2a2a]" />
                <Skeleton className="h-32 w-full bg-secondary dark:bg-[#2a2a2a]" />
                <Skeleton className="h-48 w-full bg-secondary dark:bg-[#2a2a2a]" />
            </div>
        )
    }

    if (error || !invoice) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                    <div className="flex flex-col items-center justify-center text-center">
                        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                            Error Loading Invoice
                        </h3>
                        <p className="text-muted-foreground dark:text-gray-400 text-sm">
                            Failed to load invoice details. Please try again.
                        </p>
                    </div>
                </Card>
            </div>
        )
    }

    // Calculate totals - only include active items, exclude expense items (tracking only), handle discounts correctly
    const subtotal = invoice.invoice_items
        .filter(item => (item as any).active !== false && item.item_type !== 'expense')
        .reduce((sum, item) => {
            // Discounts subtract from subtotal, all other items add
            if (item.item_type === 'discount') {
                return sum - item.total_price
            }
            return sum + item.total_price
        }, 0)
    const tax = subtotal * invoice.tax_rate
    const total = subtotal + tax - invoice.discount_amount

    // Calculate amount_paid from active (non-deleted) payments
    const allPayments = (invoice.payments || []) as any[]
    const activePayments = allPayments.filter(p => !p.deleted)
    const calculatedAmountPaid = activePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const hasActivePayments = activePayments.length > 0
    
    // Calculate outstanding balance
    const calculatedOutstanding = Math.max(0, total - calculatedAmountPaid)
    
    // Use a small epsilon for floating point comparison (0.01 cents tolerance)
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

    return (
        <div className="h-full flex flex-col bg-background dark:bg-[#0d0d0d]">
            {/* Fixed Header */}
            <div className="bg-slate-50 dark:bg-[#131313] p-3 sm:p-4 border-b border-border dark:border-[#333333]">
                {/* Top row: Invoice title and close button */}
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground dark:text-white">
                            Invoice #{invoice.display_id}
                        </h2>
                        <p className="text-muted-foreground dark:text-gray-500 text-xs sm:text-sm">
                            {invoice.invoice_number}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-transparent -mr-2"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Bottom row: Dates and actions */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    {/* Dates */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                        <p className="text-muted-foreground dark:text-gray-400">
                            Created: {formatDateString(invoice.created_at)}
                        </p>
                        <span className="text-muted-foreground dark:text-gray-500">|</span>
                        <p className="text-muted-foreground dark:text-gray-400">
                            Issued: {formatDateString(invoice.issue_date)}
                        </p>
                        {invoice.paid_date && isFullyPaid && hasActivePayments && (
                            <>
                                <span className="text-muted-foreground dark:text-gray-500">|</span>
                                <p className="text-green-600 dark:text-green-400 font-medium">
                                    Paid: {formatDateString(invoice.paid_date)}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Work Order Button */}
                    {invoice.work_order_id && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGoToWorkOrder}
                            className="bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white text-xs sm:text-sm"
                        >
                            <Wrench className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Go to Work Order
                        </Button>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-background dark:bg-[#1A1A1A] p-2">
                <div className="space-y-2">
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

                    {/* Work Order Details Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <LayoutIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <h2 className="text-lg font-semibold text-foreground dark:text-white">Work Order Details</h2>
                            </div>

                            {invoice.title && (
                                <div className="mb-1">
                                    <h3 className="text-md font-semibold text-foreground dark:text-white">{invoice.title}</h3>
                                </div>
                            )}

                            {invoice.description && (
                                <div className="mb-4">
                                    <p className="text-muted-foreground dark:text-gray-400">{invoice.description}</p>
                                </div>
                            )}

                            {/* Line Items Table */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground dark:text-gray-400 border-b border-border dark:border-gray-700 pb-2">
                                    <div className="col-span-5">DESCRIPTION</div>
                                    <div className="col-span-2 text-center">TYPE</div>
                                    <div className="col-span-2 text-center">QTY / HOURS</div>
                                    <div className="col-span-3 text-right">TOTAL</div>
                                </div>

                                {/* Invoice Items */}
                                {invoice.invoice_items.map((item, index) => {
                                    const isActive = (item as any).active !== false // Use the 'active' field from JSONB
                                    const isExpense = item.item_type === 'expense'
                                    return (
                                        <div 
                                            key={index} 
                                            className={`grid grid-cols-12 gap-2 items-center text-sm py-2 border-b ${
                                                !isActive
                                                    ? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5'
                                                    : isExpense
                                                    ? 'border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/5'
                                                    : 'border-border dark:border-gray-800'
                                            }`}
                                        >
                                            <div className="col-span-5 text-foreground dark:text-white">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {isActive ? (
                                                        <Check className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3 text-red-500" />
                                                    )}
                                                    <span>{item.description}</span>
                                                    {isExpense && isActive && (
                                                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                                                            Tracking only - not in calculations
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-xs capitalize ${
                                                            !isActive
                                                                ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/20'
                                                                : isExpense
                                                                ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/20'
                                                                : 'text-foreground dark:text-white'
                                                        }`}
                                                    >
                                                        {item.item_type}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center text-foreground dark:text-white">
                                                {item.item_type === 'labor' ? item.labor_hours || item.quantity : item.quantity}
                                            </div>
                                            <div className="col-span-3 text-right">
                                                <div className="text-foreground dark:text-white">
                                                    {item.item_type === 'discount' ? (
                                                        <span className="text-red-600 dark:text-red-400 font-semibold">
                                                            -{formatCurrency(Math.abs(item.total_price))}
                                                        </span>
                                                    ) : item.item_type === 'labor' ? (
                                                        <span>
                                                            {formatCurrency(item.total_price)}
                                                            <span className="text-muted-foreground dark:text-gray-400 text-xs ml-1">
                                                                ({formatCurrency(item.unit_price)}/hr)
                                                            </span>
                                                        </span>
                                                    ) : item.quantity > 1 ? (
                                                        <span>
                                                            {formatCurrency(item.total_price)}
                                                            <span className="text-muted-foreground dark:text-gray-400 text-xs ml-1">
                                                                ({formatCurrency(item.unit_price)}/ea)
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        formatCurrency(item.total_price)
                                                    )}
                                                </div>
                                                {!isActive && (
                                                    <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                                        Not included in total
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Expense Items (Tracking Only - Not Billed) */}
                                {expenseItems.length > 0 && (
                                    <>
                                        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-500/20">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/30 text-xs">
                                                    Shop Expenses (Tracking Only)
                                                </Badge>
                                                <span className="text-xs text-orange-600/70 dark:text-orange-400/70">
                                                    Not included in invoice totals
                                                </span>
                                            </div>
                                        </div>
                                        {expenseItems.map((item: any, index: number) => {
                                            // Check if it's from unified table (has ExpenseItem structure) or legacy (has item_type)
                                            const isUnifiedExpense = 'id' in item && 'description' in item && !('item_type' in item)
                                            
                                            if (isUnifiedExpense) {
                                                return (
                                                    <div key={item.id || `expense-${index}`} className="mb-2">
                                                        <ExpenseSummaryCard expense={item} defaultExpanded={false} />
                                                    </div>
                                                )
                                            } else {
                                                // Legacy expense item from work_order_items
                                                return (
                                                    <div 
                                                        key={`expense-${index}`} 
                                                        className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/5"
                                                    >
                                                        <div className="col-span-5 text-foreground dark:text-white">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Check className="h-3 w-3 text-orange-500" />
                                                                <span>{item.description}</span>
                                                            </div>
                                                            {item.expense_vendor && (
                                                                <div className="text-xs text-muted-foreground dark:text-gray-500 ml-5 mt-0.5">
                                                                    Vendor: {item.expense_vendor}
                                                                    {item.expense_invoice_number && ` - Invoice #${item.expense_invoice_number}`}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="col-span-2 text-center">
                                                            <Badge 
                                                                variant="outline" 
                                                                className="text-xs capitalize bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/20"
                                                            >
                                                                {item.item_type}
                                                            </Badge>
                                                        </div>
                                                        <div className="col-span-2 text-center text-foreground dark:text-white">
                                                            {item.quantity || 1}
                                                        </div>
                                                        <div className="col-span-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                                                            {formatCurrency(item.total_price || 0)}
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        })}
                                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-orange-200 dark:border-orange-500/20">
                                            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Shop Expenses:</span>
                                            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                                {formatCurrency(
                                                    expenseItems.reduce((sum: number, item: any) => {
                                                        // Handle both unified expenses (has 'total') and legacy (has 'total_price')
                                                        const total = 'total' in item ? Number(item.total ?? 0) : (item.total_price || 0)
                                                        return sum + total
                                                    }, 0)
                                                )}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {invoice.notes && (
                                <div className="mt-4 pt-4 border-t border-border dark:border-gray-700">
                                    <p className="text-foreground dark:text-white font-medium">Notes:</p>
                                    <p className="text-muted-foreground dark:text-gray-400 mt-1">{invoice.notes}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Amount and Status Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                {/* <div className="h-4 w-4 bg-yellow-400 rounded-full"></div> */}
                                <h3 className="text-lg font-semibold text-foreground dark:text-white">Invoice Summary</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-foreground dark:text-white">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground dark:text-gray-400">
                                    <span>Tax ({(invoice.tax_rate * 100).toFixed(0)}%):</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                                {/* {invoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-muted-foreground dark:text-gray-400">
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(invoice.discount_amount)}</span>
                                    </div>
                                )} */}
                                <Separator className="bg-border dark:bg-gray-700" />
                                <div className="flex justify-between items-center pt-2">
                                    <div>
                                        <p className="text-muted-foreground dark:text-gray-400 font-medium">Total Amount:</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground dark:text-white">{formatCurrency(total)}</p>
                                    </div>
                                </div>
                                {/* {(invoice.outstanding_balance !== undefined && invoice.outstanding_balance > 0) && (
                                    <>
                                        <Separator className="bg-border dark:bg-gray-700" />
                                        <div className="flex justify-between items-center pt-2">
                                            <div>
                                                <p className="text-muted-foreground dark:text-gray-400 font-medium">Outstanding:</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                                    {formatCurrency(invoice.outstanding_balance)}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )} */}
                                <div className="flex items-center justify-between gap-2 pt-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-sm px-3 py-1",
                                                        isFullyPaid
                                                            ? 'bg-green-600 text-white border-green-600 cursor-default'
                                                            : isPartiallyPaid
                                                            ? 'bg-yellow-600 text-white border-yellow-600 cursor-default'
                                                            : 'bg-red-600 text-white border-red-600 cursor-default'
                                                    )}
                                                >
                                                    <DollarSign className="w-3 h-3 mr-1" />
                                                    {isFullyPaid
                                                        ? 'PAID'
                                                        : isPartiallyPaid
                                                        ? 'PARTIALLY PAID'
                                                        : 'UNPAID'}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent side="left">
                                                <p>
                                                    {isFullyPaid
                                                        ? 'This invoice is fully paid.'
                                                        : isPartiallyPaid
                                                        ? 'This invoice has partial payments.'
                                                        : 'This invoice is unpaid.'}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {invoice.paid_date && isFullyPaid && (
                                        <span className="text-xs text-muted-foreground dark:text-gray-400">
                                            Paid on {formatDateString(invoice.paid_date)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Payments Section */}
                    <InvoicePaymentsSection invoice={invoice} />
                </div>
            </div>

            {/* Fixed Footer with Actions */}
            <div className="bg-slate-50 dark:bg-[#131313] border-t border-border dark:border-[#333333] p-4 flex flex-wrap gap-2">
                <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={onEdit}
                >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                </Button>
                <Button
                    size="sm"
                    className="bg-gray-600 text-white hover:bg-gray-700"
                    onClick={handleDownload}
                    disabled={isDownloading || isLoadingShopInfo || !shopInfo}
                    title={shopInfoError ? 'Shop information failed to load. Please refresh the page.' : isLoadingShopInfo ? 'Loading shop information...' : !shopInfo ? 'Shop information not available' : undefined}
                >
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading ? 'Generating...' : isLoadingShopInfo ? 'Loading...' : 'PDF'}
                </Button>
                <Button
                    size="sm"
                    className="bg-purple-600 text-white hover:bg-purple-700"
                    onClick={handleSend}
                >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                </Button>
                {canDelete && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto bg-red-600 text-white hover:bg-red-700 border-red-600"
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={deleteMutation.isPending}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                )}
            </div>

            {/* Invoice Send Choice Modal */}
            {invoice && (
                <InvoiceSendChoiceModal
                    invoice={invoice}
                    isOpen={isSendChoiceModalOpen}
                    onClose={() => setIsSendChoiceModalOpen(false)}
                    onEmailChoice={handleEmailChoice}
                    onSmsChoice={handleSmsChoice}
                />
            )}

            {/* Invoice Send Email Modal */}
            {invoice && (
                <InvoiceSendModal
                    invoice={invoice}
                    isOpen={isSendEmailModalOpen}
                    onClose={() => setIsSendEmailModalOpen(false)}
                    onConfirm={handleSendEmailConfirm}
                />
            )}

            {/* Invoice Send SMS Modal */}
            {invoice && (
                <InvoiceSendSmsModal
                    invoice={invoice}
                    isOpen={isSendSmsModalOpen}
                    onClose={() => setIsSendSmsModalOpen(false)}
                    onConfirm={handleSendSmsConfirm}
                />
            )}

            {/* Invoice PDF Preview Modal */}
            {invoice && shopInfo && (
                <InvoicePreviewModal
                    invoice={invoice}
                    shopInfo={shopInfo}
                    templateId={templateId}
                    isOpen={isPreviewModalOpen}
                    onClose={() => setIsPreviewModalOpen(false)}
                />
            )}

            {/* Hidden PDF element for HTML-to-PDF conversion (Tony template only) */}
            {invoice && shopInfo && templateId === 'tony' && (
                <div
                    ref={pdfElementRef}
                    data-pdf-element="true"
                    className="fixed -left-[9999px] top-0"
                    style={{
                        width: '210mm',
                        height: '297mm',
                        transform: 'scale(1)',
                        transformOrigin: 'top left',
                    }}
                >
                    <TonyTemplatePreview invoice={invoice} shop={shopInfo} />
                </div>
            )}

            {/* Invoice Delete Confirmation Modal */}
            {invoice && (
                <InvoiceDeleteConfirmation
                    invoice={{
                        id: invoice.id,
                        invoice_number: invoice.invoice_number,
                        display_id: invoice.display_id ? Number(invoice.display_id) : undefined,
                        title: invoice.title ?? undefined,
                        status: invoice.status,
                        total_amount: invoice.total_amount,
                        customer: invoice.customer ?? undefined,
                        vehicle: invoice.vehicle ?? undefined
                    }}
                    isOpen={isDeleteModalOpen}
                    isDeleting={deleteMutation.isPending}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    )
}

export default InvoiceViewOnly