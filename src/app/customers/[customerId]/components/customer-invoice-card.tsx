import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { formatDate } from "@/app/invoices/utils/invoice-utils";
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
                invoices.map((invoice) => (
                    <Card key={invoice.id} className="bg-[#1A1A1A] border-[#333] text-white overflow-hidden hover:border-[#444] transition-colors">
                        <div className={`h-1 ${getStatusColor(invoice.status)}`}></div>
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center mb-2">
                                        <File className="h-5 w-5 mr-2 text-blue-400" />
                                        Invoice #{invoice.invoice_number || invoice.number}
                                    </CardTitle>
                                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span className="text-gray-500">Date:</span>
                                            <span>{formatDate(invoice.invoice_date || invoice.created_at)}</span>
                                        </div>
                                        {invoice.due_date && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Due:</span>
                                                <span>{formatDate(invoice.due_date)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {invoice.customer_name && (
                                        <div className="flex items-center gap-1 text-sm text-gray-300">
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
                                        <div className="text-xs text-gray-500">Total Amount</div>
                                        <div className="text-lg font-bold text-green-400">
                                            ${parseFloat(invoice.total_amount || invoice.amount || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="py-0">
                            {invoice.description && (
                                <div className="bg-[#0f0f0f] rounded-md p-3 mb-3">
                                    <div className="text-xs text-gray-500 mb-1">Description:</div>
                                    <div className="text-sm text-gray-300 line-clamp-2">
                                        {invoice.description}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {invoice.subtotal && (
                                    <div>
                                        <div className="text-gray-500 text-xs">Subtotal</div>
                                        <div className="text-gray-300">${parseFloat(invoice.subtotal).toFixed(2)}</div>
                                    </div>
                                )}
                                {invoice.tax_amount && (
                                    <div>
                                        <div className="text-gray-500 text-xs">Tax</div>
                                        <div className="text-gray-300">${parseFloat(invoice.tax_amount).toFixed(2)}</div>
                                    </div>
                                )}
                                {invoice.discount_amount && (
                                    <div>
                                        <div className="text-gray-500 text-xs">Discount</div>
                                        <div className="text-gray-300">-${parseFloat(invoice.discount_amount).toFixed(2)}</div>
                                    </div>
                                )}
                                {invoice.payment_terms && (
                                    <div>
                                        <div className="text-gray-500 text-xs">Payment Terms</div>
                                        <div className="text-gray-300">{invoice.payment_terms}</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-[#333] pt-4">
                            <div className="flex gap-2 w-full">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 border border-[#444] text-gray-300 hover:bg-[#333] hover:text-white"
                                    onClick={() => {
                                        router.push(`/invoices/${invoice.id}`)
                                    }}
                                >
                                    View Invoice
                                </Button>
                                {invoice.status?.toLowerCase() !== 'paid' && (
                                    <Button 
                                        variant="outline" 
                                        className="border border-[#444] text-gray-300 hover:bg-[#333] hover:text-white"
                                        onClick={() => {
                                            // Handle payment or edit action
                                            console.log('Handle payment for invoice:', invoice.id)
                                        }}
                                    >
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        Pay
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-[#1A1A1A] rounded-lg border border-[#333]">
                    <File className="h-12 w-12 text-gray-500 mb-3" />
                    <h3 className="text-xl font-semibold mb-2">No Invoices</h3>
                    <p className="text-gray-400 text-center mb-4">This customer doesn't have any invoices yet.</p>
                    <Button 
                        className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                        onClick={() => {
                            router.push(`/invoices`)
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

