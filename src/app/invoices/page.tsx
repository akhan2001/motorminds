'use client'

import { useEffect, useState } from 'react';
import { InvoiceFilter } from './components/invoice-filter';
import { InvoiceCard } from './components/invoice-card';
import { fetchAllInvoices, formatCurrency, formatDate } from './utils/invoice-utils';
import { Nav } from '../components/nav';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        const loadInvoices = async () => {
            const data = await fetchAllInvoices();
            if (data) {
                setInvoices(data);
            }
            // console.log(data)
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

            {/* INVOICES */}
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-white">Invoices</h1>

                {/* FITLERS */}
                <div className="flex flex-row gap-4 justify-start mb-8">
                    <InvoiceFilter title="All" todayCount={todayCount} monthCount={monthCount} active={true} />
                    <InvoiceFilter title="Paid" todayCount={todayCount} monthCount={monthCount} />
                    <InvoiceFilter title="Unpaid" todayCount={todayCount} monthCount={monthCount} />
                </div>

                <div className="flex flex-col gap-4">
                    {invoices.map((invoice, index) => (
                        <InvoiceCard
                            key={index}
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
                    ))}
                </div>
            </div>
        </div>
    );
}