'use client'

import React, { memo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Building2, 
    Calendar, 
    Car, 
    Wrench, 
    FileText,
    DollarSign,
    Clock,
    History
} from 'lucide-react'
import { format } from 'date-fns'
import { formatPhoneNumber } from '@/utils/format-phone'
import { getInitials } from '@/lib/utils/text'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Customer {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone?: string
    customer_address?: string
    shop_id: string
    created_at: string
    updated_at?: string
    notes?: string
    shops?: {
        shop_name: string
        shop_email?: string
    }
}

interface CustomerHistory {
    workOrders: Array<{
        id: string
        work_order_number: string
        status: string
        created_at: string
        total_amount?: number
        vehicle_info?: string
    }>
    invoices: Array<{
        id: string
        invoice_number: string
        status: string
        total_amount: number
        issue_date: string
    }>
    totalSpent: number
    lastVisit?: string
}

interface CustomerDetailSheetProps {
    customer: Customer | null
    customerHistory?: CustomerHistory | null
    isOpen: boolean
    onClose: () => void
    loading?: boolean
}

/**
 * Customer detail sheet component following archived invoice sheet styling
 * Displays comprehensive customer information and history
 */
export const CustomerDetailSheet = memo<CustomerDetailSheetProps>(({
    customer,
    customerHistory,
    isOpen,
    onClose,
    loading = false
}) => {
    if (!customer) return null

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return format(new Date(dateString), 'MMM d, yyyy')
    }

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const getStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase()
        if (statusLower === 'completed' || statusLower === 'paid') {
            return <Badge className="bg-green-500/10 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-500/20">{status}</Badge>
        } else if (statusLower === 'in_progress' || statusLower === 'pending') {
            return <Badge className="bg-yellow-500/10 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-500/20">{status}</Badge>
        } else if (statusLower === 'cancelled' || statusLower === 'overdue') {
            return <Badge className="bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/20">{status}</Badge>
        }
        return <Badge className="bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20">{status}</Badge>
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[600px] sm:w-[700px] bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border dark:border-[#222222] overflow-y-auto">
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

                <div className="space-y-6 pt-6">
                    {/* Customer Information */}
                    <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            <h3 className="text-foreground dark:text-white font-medium">Contact Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {customer.customer_email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                                    <span className="text-foreground dark:text-white">{customer.customer_email}</span>
                                </div>
                            )}
                            {customer.customer_phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                                    <span className="text-foreground dark:text-white">{formatPhoneNumber(customer.customer_phone)}</span>
                                </div>
                            )}
                            {customer.customer_address && (
                                <div className="flex items-center gap-2 md:col-span-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                                    <span className="text-foreground dark:text-white">{customer.customer_address}</span>
                                </div>
                            )}
                            {customer.shops?.shop_name && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                                    <span className="text-foreground dark:text-white">{customer.shops.shop_name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                                <span className="text-foreground dark:text-white">
                                    Customer since {formatDate(customer.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Stats */}
                    {customerHistory && (
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
                                        {customerHistory.workOrders.length}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                                        <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">Last Visit</span>
                                    </div>
                                    <p className="text-lg font-semibold text-foreground dark:text-white">
                                        {customerHistory.lastVisit ? formatDate(customerHistory.lastVisit) : 'Never'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Recent Work Orders */}
                    {customerHistory?.workOrders && customerHistory.workOrders.length > 0 && (
                        <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center gap-2 mb-3">
                                <Wrench className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="text-foreground dark:text-white font-medium">Recent Work Orders</h3>
                            </div>
                            <div className="space-y-3">
                                {customerHistory.workOrders.slice(0, 5).map((workOrder) => (
                                    <div key={workOrder.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#0a0a0a] rounded border border-border dark:border-[#333333]">
                                        <div className="flex items-center gap-3">
                                            <Wrench className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground dark:text-white">
                                                    #{workOrder.work_order_number}
                                                </p>
                                                <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                    {formatDate(workOrder.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {workOrder.total_amount && (
                                                <span className="text-sm font-medium text-foreground dark:text-white">
                                                    {formatCurrency(workOrder.total_amount)}
                                                </span>
                                            )}
                                            {getStatusBadge(workOrder.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Invoices */}
                    {customerHistory?.invoices && customerHistory.invoices.length > 0 && (
                        <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="text-foreground dark:text-white font-medium">Recent Invoices</h3>
                            </div>
                            <div className="space-y-3">
                                {customerHistory.invoices.slice(0, 5).map((invoice) => (
                                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#0a0a0a] rounded border border-border dark:border-[#333333]">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground dark:text-white">
                                                    #{invoice.invoice_number}
                                                </p>
                                                <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                    {formatDate(invoice.issue_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-foreground dark:text-white">
                                                {formatCurrency(invoice.total_amount)}
                                            </span>
                                            {getStatusBadge(invoice.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {customer.notes && (
                        <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center gap-2 mb-3">
                                <History className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="text-foreground dark:text-white font-medium">Notes</h3>
                            </div>
                            <p className="text-sm text-foreground dark:text-white whitespace-pre-wrap">
                                {customer.notes}
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-pulse text-muted-foreground dark:text-gray-400">
                                Loading customer history...
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
})

CustomerDetailSheet.displayName = 'CustomerDetailSheet'
