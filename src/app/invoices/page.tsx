'use client'

import { useEffect, useState } from 'react';
import { InvoiceCard } from './components/invoice-card';
import { fetchAllInvoices } from './utils/invoice-utils';
import { Nav } from '../components/nav';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        const loadInvoices = async () => {
            const data = await fetchAllInvoices();
            if (data) {
                setInvoices(data);
            }
            console.log(data)
        };

        loadInvoices();
    }, []);

    return (
        <div className="h-screen bg-black">
            <Nav activeLink="Invoices" />
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-white">Invoices</h1>
                <div className="flex flex-col gap-4">
                    {invoices.map((invoice, index) => (
                        <InvoiceCard
                            key={index}
                            invoiceNumber={invoice.invoice_number}
                            clientName={invoice.client_name}
                            clientAddress={invoice.client_address}
                            clientEmail={invoice.client_email}
                            amount={invoice.amount}
                            issueDate={invoice.issue_date}
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