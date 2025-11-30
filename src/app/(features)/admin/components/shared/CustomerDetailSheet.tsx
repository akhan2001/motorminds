'use client'

import React, { memo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
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
    History,
    CalendarDays,
    Receipt,
    CheckCircle,
    XCircle,
    AlertCircle,
    Users,
    Loader2
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
        title?: string
        status: string
        priority?: string
        created_at: string
        updated_at?: string
        completed_at?: string
        total_amount?: number
        customer_vehicles?: {
            id: string
            year?: number
            make?: string
            model?: string
            license_plate?: string
        }
        employees?: {
            id: string
            first_name?: string
            last_name?: string
        }
        shops?: {
            id: string
            shop_name: string
        }
    }>
    appointments: Array<{
        id: string
        appointment_date: string
        start_time?: string
        end_time?: string
        service_type: string
        status?: string
        notes?: string
        created_at: string
        confirmation_code?: string
        customer_vehicles?: {
            id: string
            year?: number
            make?: string
            model?: string
            license_plate?: string
        }
        shops?: {
            id: string
            shop_name: string
        }
    }>
    invoices: Array<{
        id: string
        invoice_number: string
        status: string
        total_amount: number
        issue_date: string
        due_date?: string
        paid_date?: string
        created_at: string
        work_orders?: {
            id: string
            work_order_number: string
            title?: string
        }
        shops?: {
            id: string
            shop_name: string
        }
    }>
    totalSpent: number
    lastVisit?: string
    stats?: {
        totalWorkOrders: number
        totalAppointments: number
        totalInvoices: number
        completedWorkOrders: number
        paidInvoices: number
    }
}

interface CustomerDetailSheetProps {
    customer: Customer | null
    customerHistory?: CustomerHistory | null
    isOpen: boolean
    onClose: () => void
    loading?: boolean
    error?: string | null
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

    const getWorkOrderStatusVariant = (status: string) => {
        const statusLower = status.toLowerCase()
        if (statusLower === 'completed') return 'default'
        if (statusLower === 'in_progress' || statusLower === 'pending') return 'secondary'
        if (statusLower === 'cancelled') return 'destructive'
        return 'outline'
    }

    const getAppointmentStatusVariant = (status: string) => {
        const statusLower = status.toLowerCase()
        if (statusLower === 'completed' || statusLower === 'confirmed') return 'default'
        if (statusLower === 'scheduled' || statusLower === 'in_progress') return 'secondary'
        if (statusLower === 'cancelled') return 'destructive'
        return 'outline'
    }

    const getInvoiceStatusVariant = (status: string) => {
        const statusLower = status.toLowerCase()
        if (statusLower === 'paid') return 'default'
        if (statusLower === 'pending' || statusLower === 'sent') return 'secondary'
        if (statusLower === 'overdue' || statusLower === 'cancelled') return 'destructive'
        return 'outline'
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CalendarDays className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                                        <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">Appointments</span>
                                    </div>
                                    <p className="text-lg font-semibold text-foreground dark:text-white">
                                        {customerHistory.stats?.totalAppointments || customerHistory.appointments?.length || 0}
                                    </p>
                                </CardContent>
                            </Card>
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
                    )}

                    {/* Customer History Tabs */}
                    <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                                <History className="h-5 w-5" />
                                Customer History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <Tabs defaultValue="work-orders" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="work-orders" className="flex items-center gap-2">
                                            <Wrench className="h-4 w-4" />
                                            Work Orders
                                        </TabsTrigger>
                                        <TabsTrigger value="appointments" className="flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4" />
                                            Appointments
                                        </TabsTrigger>
                                        <TabsTrigger value="invoices" className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4" />
                                            Invoices
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="work-orders" className="mt-4">
                                        <ScrollArea className="h-[400px]">
                                            {!customerHistory?.workOrders || customerHistory.workOrders.length === 0 ? (
                                                <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                                                    No work orders found
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {customerHistory.workOrders.map((workOrder) => (
                                                        <div key={workOrder.id} className="p-4 bg-card dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a]">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h4 className="font-medium text-foreground dark:text-white">
                                                                            #{workOrder.work_order_number}
                                                                        </h4>
                                                                        <Badge
                                                                            variant={getWorkOrderStatusVariant(workOrder.status)}
                                                                            className="capitalize"
                                                                        >
                                                                            {workOrder.status}
                                                                        </Badge>
                                                                    </div>
                                                                    {workOrder.title && (
                                                                        <p className="text-sm text-muted-foreground dark:text-gray-400 mb-2">
                                                                            {workOrder.title}
                                                                        </p>
                                                                    )}
                                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                                                                        <div className="flex items-center gap-1">
                                                                            <Calendar className="h-3 w-3" />
                                                                            {formatDate(workOrder.created_at)}
                                                                        </div>
                                                                        {workOrder.customer_vehicles && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Car className="h-3 w-3" />
                                                                                {`${workOrder.customer_vehicles.year || ''} ${workOrder.customer_vehicles.make || ''} ${workOrder.customer_vehicles.model || ''}`.trim() || 'Unknown Vehicle'}
                                                                            </div>
                                                                        )}
                                                                        {workOrder.employees && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Users className="h-3 w-3" />
                                                                                {`${workOrder.employees.first_name || ''} ${workOrder.employees.last_name || ''}`.trim()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {workOrder.total_amount && (
                                                                    <div className="text-right">
                                                                        <p className="font-semibold text-foreground dark:text-white">
                                                                            {formatCurrency(workOrder.total_amount)}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="appointments" className="mt-4">
                                        <ScrollArea className="h-[400px]">
                                            {!customerHistory?.appointments || customerHistory.appointments.length === 0 ? (
                                                <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                                                    No appointments found
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {customerHistory.appointments.map((appointment) => (
                                                        <div key={appointment.id} className="p-4 bg-card dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a]">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h4 className="font-medium text-foreground dark:text-white">
                                                                            {appointment.service_type}
                                                                        </h4>
                                                                        {appointment.status && (
                                                                            <Badge
                                                                                variant={getAppointmentStatusVariant(appointment.status)}
                                                                                className="capitalize"
                                                                            >
                                                                                {appointment.status}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                                                                        <div className="flex items-center gap-1">
                                                                            <Calendar className="h-3 w-3" />
                                                                            {formatDate(appointment.appointment_date)}
                                                                        </div>
                                                                        {appointment.start_time && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock className="h-3 w-3" />
                                                                                {appointment.start_time}
                                                                                {appointment.end_time && ` - ${appointment.end_time}`}
                                                                            </div>
                                                                        )}
                                                                        {appointment.customer_vehicles && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Car className="h-3 w-3" />
                                                                                {`${appointment.customer_vehicles.year || ''} ${appointment.customer_vehicles.make || ''} ${appointment.customer_vehicles.model || ''}`.trim() || 'Unknown Vehicle'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {appointment.notes && (
                                                                        <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                                                                            {appointment.notes}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {appointment.confirmation_code && (
                                                                    <div className="text-right">
                                                                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                                            Code: {appointment.confirmation_code}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="invoices" className="mt-4">
                                        <ScrollArea className="h-[400px]">
                                            {!customerHistory?.invoices || customerHistory.invoices.length === 0 ? (
                                                <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                                                    No invoices found
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {customerHistory.invoices.map((invoice) => (
                                                        <div key={invoice.id} className="p-4 bg-card dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a]">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h4 className="font-medium text-foreground dark:text-white">
                                                                            #{invoice.invoice_number}
                                                                        </h4>
                                                                        <Badge
                                                                            variant={getInvoiceStatusVariant(invoice.status)}
                                                                            className="capitalize"
                                                                        >
                                                                            {invoice.status}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                                                                        <div className="flex items-center gap-1">
                                                                            <Calendar className="h-3 w-3" />
                                                                            Issued: {formatDate(invoice.issue_date)}
                                                                        </div>
                                                                        {invoice.due_date && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock className="h-3 w-3" />
                                                                                Due: {formatDate(invoice.due_date)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {invoice.work_orders && (
                                                                        <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                                                                            Work Order: #{invoice.work_orders.work_order_number}
                                                                            {invoice.work_orders.title && ` - ${invoice.work_orders.title}`}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-semibold text-foreground dark:text-white">
                                                                        {formatCurrency(invoice.total_amount)}
                                                                    </p>
                                                                    {invoice.paid_date && (
                                                                        <p className="text-xs text-green-600 dark:text-green-400">
                                                                            Paid: {formatDate(invoice.paid_date)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            )}
                        </CardContent>
                    </Card>

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
