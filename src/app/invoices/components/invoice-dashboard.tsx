"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/app/financials/utils/formatting";
import { Badge } from "@/components/ui/badge";
import { InvoiceDialog } from "./InvoiceDialog";
import { Invoice } from "../types/invoice";
import { formatDate, mapInvoiceToDialog } from "../utils/invoice-utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ConfirmationProvider } from "@/app/components/confirmation-service";

interface InvoiceDashboardProps {
    invoices: Invoice[];
}

const InvoiceDashboard = ({ invoices }: InvoiceDashboardProps) => {
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    if (!invoices) {
        return <div>Loading...</div>; // Or a more sophisticated loading skeleton
    }

    const getStatusVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID':
                return 'success';
            case 'UNPAID':
                return 'warning';
            default:
                return 'default';
        }
    };

    return (
        <ConfirmationProvider>
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-[#1a1a1a] border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-gray-400 text-sm font-medium">Total Invoiced</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {formatCurrency(invoices.reduce((acc, inv) => acc + inv.amount, 0))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1a1a1a] border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-gray-400 text-sm font-medium">Total Paid</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-400">
                                {formatCurrency(invoices.filter(inv => inv.status === 'PAID').reduce((acc, inv) => acc + inv.amount, 0))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1a1a1a] border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-gray-400 text-sm font-medium">Total Outstanding</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-400">
                                {formatCurrency(invoices.filter(inv => inv.status === 'UNPAID').reduce((acc, inv) => acc + inv.amount, 0))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1a1a1a] border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-gray-400 text-sm font-medium">Overdue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                {formatCurrency(0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-[#1a1a1a] border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Recent Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-gray-700 hover:bg-transparent">
                                    <TableHead className="text-gray-400">Customer</TableHead>
                                    <TableHead className="text-gray-400">Date</TableHead>
                                    <TableHead className="text-gray-400">Amount</TableHead>
                                    <TableHead className="text-gray-400">Status</TableHead>
                                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice) => (
                                    <TableRow 
                                        key={invoice.invoice_number} 
                                        onClick={() => setSelectedInvoice(invoice)}
                                        className="border-b border-gray-800 hover:bg-[#222] cursor-pointer"
                                    >
                                        <TableCell className="font-medium text-white">{invoice.client_name}</TableCell>
                                        <TableCell className="text-gray-300">{formatDate(invoice.issue_date)}</TableCell>
                                        <TableCell className="text-gray-300">{formatCurrency(invoice.amount)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(invoice.status) as any}>
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Actions can be added here if needed, but row click handles dialog */}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {selectedInvoice && (
                <InvoiceDialog 
                    isOpen={!!selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    invoice={mapInvoiceToDialog(selectedInvoice)} 
                />
            )}
        </ConfirmationProvider>
    );
};

export default InvoiceDashboard;