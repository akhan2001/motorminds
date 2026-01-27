import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, File, DollarSign, Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface CustomerInvoiceCardProps {
    invoices: any[];
}

export function CustomerInvoiceCard({ invoices }: CustomerInvoiceCardProps) {
    const router = useRouter()

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'bg-green-500';
            case 'pending':
                return 'bg-yellow-500';
            case 'overdue':
                return 'bg-red-500';
            case 'draft':
                return 'bg-gray-500';
            default:
                return 'bg-blue-500';
        }
    }

    const getStatusText = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'Paid';
            case 'pending':
                return 'Pending';
            case 'overdue':
                return 'Overdue';
            case 'draft':
                return 'Draft';
            default:
                return status || 'Unknown';
        }
    }

    return (
        <div className="space-y-4">
            {invoices.length > 0 ? (
                invoices.map((invoice) => {
                    const isArchived = invoice.work_orders?.archived === true
                    return (
                    <Card key={invoice.id} className="bg-white dark:bg-card border-border text-foreground overflow-hidden hover:border-border transition-colors">
                        <div className={`h-1 ${getStatusColor(invoice.status)}`}></div>
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center mb-2 text-foreground">
                                        <File className="h-5 w-5 mr-2 text-blue-400" />
                                        Invoice #{invoice.invoice_number || invoice.number}
                                        {isArchived && (
                                            <Badge variant="outline" className="ml-2 text-xs border-gray-400 text-gray-600">
                                                Archived
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span className="text-muted-foreground">Date:</span>
                                            <span className="text-foreground">{formatDate(invoice.invoice_date || invoice.created_at)}</span>
                                        </div>
                                        {invoice.due_date && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-muted-foreground">Due:</span>
                                                <span className="text-foreground">{formatDate(invoice.due_date)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {invoice.customer_name && (
                                        <div className="flex items-center gap-1 text-sm text-foreground">
                                            <User className="h-3 w-3" />
                                            <span>{invoice.customer_name}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge className={`${getStatusColor(invoice.status).replace('bg-', 'bg-opacity-20 text-').replace('500', '400')} border-0 px-3 py-1`}>
                                        {getStatusText(invoice.status)}
                                    </Badge>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground">Total Amount</div>
                                        <div className="text-lg font-bold text-green-600">
                                            ${parseFloat(invoice.total_amount || invoice.amount || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="py-0">
                            {invoice.description && (
                                <div className="bg-slate-50 dark:bg-muted rounded-md p-3 mb-3">
                                    <div className="text-xs text-muted-foreground mb-1">Description:</div>
                                    <div className="text-sm text-foreground line-clamp-2">
                                        {invoice.description}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {invoice.subtotal && (
                                    <div>
                                        <div className="text-muted-foreground text-xs">Subtotal</div>
                                        <div className="text-foreground">${parseFloat(invoice.subtotal).toFixed(2)}</div>
                                    </div>
                                )}
                                {invoice.tax_amount && (
                                    <div>
                                        <div className="text-muted-foreground text-xs">Tax</div>
                                        <div className="text-foreground">${parseFloat(invoice.tax_amount).toFixed(2)}</div>
                                    </div>
                                )}
                                {invoice.discount_amount && (
                                    <div>
                                        <div className="text-muted-foreground text-xs">Discount</div>
                                        <div className="text-foreground">-${parseFloat(invoice.discount_amount).toFixed(2)}</div>
                                    </div>
                                )}
                                {invoice.payment_terms && (
                                    <div>
                                        <div className="text-muted-foreground text-xs">Payment Terms</div>
                                        <div className="text-foreground">{invoice.payment_terms}</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-border pt-4">
                            <div className="flex gap-2 w-full">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                    onClick={() => {
                                        // Navigate to financials invoices page with invoice number to auto-select
                                        const invoiceNumber = invoice.invoice_number || invoice.number
                                        router.push(`/financials/invoices?invoice_number=${invoiceNumber}`)
                                    }}
                                >
                                    View Invoice
                                </Button>
                                {invoice.status?.toLowerCase() !== 'paid' && (
                                    <Button 
                                        variant="outline" 
                                        className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                        onClick={() => {
                                            // Navigate to invoice page to add payment
                                            const invoiceNumber = invoice.invoice_number || invoice.number
                                            router.push(`/financials/invoices?invoice_number=${invoiceNumber}`)
                                        }}
                                    >
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        Pay
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                    )
                })
            ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-card rounded-lg border border-border">
                    <File className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">No Invoices</h3>
                    <p className="text-muted-foreground text-center mb-4">This customer doesn't have any invoices yet.</p>
                    <Button 
                        className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => {
                            router.push(`/financials/invoices`)
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                    </Button>
                </div>
            )}
        </div>
    )
}

