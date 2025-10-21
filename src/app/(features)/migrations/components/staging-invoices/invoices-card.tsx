import { FileText, Calendar, DollarSign, Clock, CreditCard, Tag, Wrench, Package, Settings, Receipt, AlertCircle } from "lucide-react";
import { StagingInvoice } from "../../types/staging-invoices";
import { Badge } from "@/components/ui/badge";

interface InvoicesCardProps {
    invoice: StagingInvoice
}

export function InvoicesCard({ invoice }: InvoicesCardProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-400" />
            case 'approved':
                return <Tag className="h-4 w-4 text-green-400" />
            case 'rejected':
                return <AlertCircle className="h-4 w-4 text-red-400" />
            case 'migrated':
                return <FileText className="h-4 w-4 text-blue-400" />
            default:
                return <Clock className="h-4 w-4 text-gray-400" />
        }
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            approved: "bg-green-500/20 text-green-400 border-green-500/30",
            rejected: "bg-red-500/20 text-red-400 border-red-500/30",
            migrated: "bg-blue-500/20 text-blue-400 border-blue-500/30"
        }
        
        return (
            <Badge className={`${variants[status as keyof typeof variants] || variants.pending} border`}>
                {status.toUpperCase()}
            </Badge>
        )
    }

    const formatCurrency = (amount: number | null) => {
        if (!amount) return '$0.00'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        } catch {
            return 'Invalid Date'
        }
    }

    const renderCustomFields = () => {
        if (!invoice.custom_fields || typeof invoice.custom_fields !== 'object') {
            return null
        }

        const customFields = invoice.custom_fields as Record<string, any>
        
        return (
            <div className="mt-3 space-y-2">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Custom Fields:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(customFields).map(([key, value]) => {
                        if (value === null || value === undefined || value === '') return null
                        
                        // Handle nested objects
                        if (typeof value === 'object' && !Array.isArray(value)) {
                            return (
                                <div key={key} className="bg-[#1a1a1a] p-2 rounded border border-[#2a2a2a]">
                                    <div className="text-xs font-medium text-gray-400 mb-1">{key}:</div>
                                    <div className="text-xs text-gray-300">
                                        {Object.entries(value).map(([nestedKey, nestedValue]) => (
                                            <div key={nestedKey} className="flex justify-between">
                                                <span className="text-gray-500">{nestedKey}:</span>
                                                <span className="text-white">{String(nestedValue)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                        
                        // Handle arrays
                        if (Array.isArray(value)) {
                            return (
                                <div key={key} className="bg-[#1a1a1a] p-2 rounded border border-[#2a2a2a]">
                                    <div className="text-xs font-medium text-gray-400 mb-1">{key}:</div>
                                    <div className="text-xs text-gray-300">
                                        {value.map((item, index) => (
                                            <div key={index} className="mb-1">
                                                {typeof item === 'object' ? 
                                                    JSON.stringify(item, null, 2) : 
                                                    String(item)
                                                }
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                        
                        // Handle primitive values
                        return (
                            <div key={key} className="bg-[#1a1a1a] p-2 rounded border border-[#2a2a2a]">
                                <div className="text-xs font-medium text-gray-400">{key}:</div>
                                <div className="text-xs text-white truncate">{String(value)}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                        <h4 className="font-medium text-white text-lg">
                            {invoice.invoice_number || 'No Invoice Number'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(invoice.import_status)}
                            {getStatusBadge(invoice.import_status)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Dates */}
                <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-300">Dates</h5>
                    <div className="space-y-1 text-sm">
                        {invoice.invoice_date && (
                            <div className="flex items-center gap-2 text-gray-400">
                                <Calendar className="h-3 w-3" />
                                <span>Invoice: {formatDate(invoice.invoice_date)}</span>
                            </div>
                        )}
                        {invoice.due_date && (
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock className="h-3 w-3" />
                                <span>Due: {formatDate(invoice.due_date)}</span>
                            </div>
                        )}
                        {invoice.paid_date && (
                            <div className="flex items-center gap-2 text-gray-400">
                                <Tag className="h-3 w-3" />
                                <span>Paid: {formatDate(invoice.paid_date)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-300">Financial</h5>
                    <div className="space-y-1 text-sm">
                        {invoice.total_amount && (
                            <div className="flex items-center gap-2 text-white">
                                <DollarSign className="h-3 w-3" />
                                <span className="font-medium">Total: {formatCurrency(invoice.total_amount)}</span>
                            </div>
                        )}
                        {invoice.subtotal && (
                            <div className="text-gray-400">
                                Subtotal: {formatCurrency(invoice.subtotal)}
                            </div>
                        )}
                        {invoice.tax_amount && (
                            <div className="text-gray-400">
                                Tax: {formatCurrency(invoice.tax_amount)}
                            </div>
                        )}
                        {invoice.discount_amount && (
                            <div className="text-gray-400">
                                Discount: {formatCurrency(invoice.discount_amount)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment & Status */}
                <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-300">Payment</h5>
                    <div className="space-y-1 text-sm">
                        {invoice.status && (
                            <div className="text-gray-400">
                                Status: <span className="text-white">{invoice.status}</span>
                            </div>
                        )}
                        {invoice.payment_method && (
                            <div className="flex items-center gap-2 text-gray-400">
                                <CreditCard className="h-3 w-3" />
                                <span>{invoice.payment_method}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Breakdown Totals */}
            {(invoice.labor_total || invoice.parts_total || invoice.services_total || invoice.fees_total) && (
                <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Breakdown</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {invoice.labor_total && (
                            <div className="flex items-center gap-1 text-gray-400">
                                <Wrench className="h-3 w-3" />
                                <span>Labor: {formatCurrency(invoice.labor_total)}</span>
                            </div>
                        )}
                        {invoice.parts_total && (
                            <div className="flex items-center gap-1 text-gray-400">
                                <Package className="h-3 w-3" />
                                <span>Parts: {formatCurrency(invoice.parts_total)}</span>
                            </div>
                        )}
                        {invoice.services_total && (
                            <div className="flex items-center gap-1 text-gray-400">
                                <Settings className="h-3 w-3" />
                                <span>Services: {formatCurrency(invoice.services_total)}</span>
                            </div>
                        )}
                        {invoice.fees_total && (
                            <div className="flex items-center gap-1 text-gray-400">
                                <Receipt className="h-3 w-3" />
                                <span>Fees: {formatCurrency(invoice.fees_total)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Fields */}
            {renderCustomFields()}

            {/* Notes */}
            {invoice.notes && (
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Notes</h5>
                    <p className="text-sm text-gray-400">{invoice.notes}</p>
                </div>
            )}

            {/* Validation Errors */}
            {invoice.validation_errors && invoice.validation_errors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                    <h5 className="text-sm font-medium text-red-400 mb-2">Validation Errors</h5>
                    <div className="space-y-1">
                        {invoice.validation_errors.map((error, index) => (
                            <div key={index} className="text-xs text-red-300 bg-red-500/10 p-2 rounded">
                                {error}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}