'use client'

import { useEffect, useState } from 'react';
import { InvoiceFilter } from './components/invoice-filter';
import { InvoiceCard } from './components/invoice-card';
import { fetchAllInvoices, formatCurrency, formatDate } from './utils/invoice-utils';
import { Nav } from '../components/nav';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadInvoices = async () => {
            setIsLoading(true);
            try {
                const data = await fetchAllInvoices();
                if (data) {
                    setInvoices(data);
                }
            } catch (error) {
                console.error("Error loading invoices:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInvoices();
    }, []);

    const todayCount = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date);
        const today = new Date();
        return invoiceDate.toDateString() === today.toDateString();
    }).length;

    const monthCount = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date);
        const today = new Date();
        return invoiceDate.getMonth() === today.getMonth() && invoiceDate.getFullYear() === today.getFullYear();
    }).length;

    return (
        <div className="bg-black">
            <Nav activeLink="Invoices" />

            <div className="flex items-center justify-center py-8">
                <div className="container mx-auto max-w-[1300px]">
                    <div className="flex flex-row justify-between items-center mb-8">
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-white">Invoices</h1>
                            <p className="text-gray-400">
                                Manage your invoices and track their activity. Add new invoices, edit their information, and view their activity.
                            </p>
                        </div>
                        <div className="flex flex-row gap-4">
                            <Button className="bg-[#B22222] hover:bg-[#B22222]/80 text-white rounded-full px-7">
                                <PlusIcon className="w-4 h-4 mr-1" />
                                ADD NEW INVOICE
                            </Button>
                        </div>
                    </div>

                    {/* FILTERS */}
                    <div className="flex flex-row gap-4 justify-start mb-8">
                        <InvoiceFilter title="All" todayCount={todayCount} monthCount={monthCount} active={true} />
                        <InvoiceFilter title="Paid" todayCount={todayCount} monthCount={monthCount} />
                        <InvoiceFilter title="Unpaid" todayCount={todayCount} monthCount={monthCount} />
                    </div>

                    {/* INVOICES */}
                    <div className="flex flex-col gap-4 bg-[#000]">
                        {isLoading ? (
                            // Show loading skeletons
                            Array(3).fill(0).map((_, i) => (
                                <div key={`skeleton-${i}`} className="w-full p-6 rounded-lg border border-[#131313] animate-pulse">
                                    <div className="h-6 bg-[#131313] rounded w-1/4 mb-4"></div>
                                    <div className="h-4 bg-[#131313] rounded w-1/2 mb-2"></div>
                                    <div className="h-4 bg-[#131313] rounded w-3/4 mb-2"></div>
                                    <div className="flex justify-between mt-4">
                                        <div className="h-5 bg-[#131313] rounded w-1/5"></div>
                                        <div className="h-5 bg-[#131313] rounded w-1/5"></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            invoices.map((invoice, index) => (
                                <InvoiceCard
                                    key={`invoice-${invoice.id || index}`}
                                    invoiceNumber={invoice.invoice_number}
                                    clientName={invoice.client_name}
                                    clientAddress={invoice.client_address}
                                    clientEmail={invoice.client_email}
                                    amount={formatCurrency(invoice.amount)}
                                    issueDate={formatDate(invoice.issue_date)}
                                    status={invoice.status}
                                    shopName={invoice.shop_name}
                                    shopAddress={invoice.shop_address}
                                    shopEmail={invoice.shop_email}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}