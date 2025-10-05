'use client'

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, FileText } from 'lucide-react';

interface Customer {
    id: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    customer_address?: string;
    shop_id: string;
    shops?: {
        shop_name: string;
        shop_email: string;
    };
    invoice_count: number;
    outstanding_balance: number;
}

interface CustomerListProps {
    customers: Customer[];
    selectedCustomers: string[];
    onSelectionChange: (customerIds: string[]) => void;
    loading?: boolean;
}

export function CustomerList({ 
    customers, 
    selectedCustomers, 
    onSelectionChange,
    loading = false 
}: CustomerListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = customers.filter(customer =>
        customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_phone?.includes(searchTerm) ||
        customer.shops?.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(filteredCustomers.map(c => c.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectCustomer = (customerId: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedCustomers, customerId]);
        } else {
            onSelectionChange(selectedCustomers.filter(id => id !== customerId));
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (loading) {
        return (
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-6">
                    <div className="text-center text-gray-400">Loading customers...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search customers by name, email, phone, or shop..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#111111] border-[#2a2a2a] text-white"
                />
            </div>

            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-[#111111] border border-[#2a2a2a] rounded-lg">
                <Checkbox
                    id="select-all"
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onCheckedChange={handleSelectAll}
                />
                <label
                    htmlFor="select-all"
                    className="text-sm font-medium text-gray-300 cursor-pointer"
                >
                    Select All ({filteredCustomers.length} customers)
                </label>
                {selectedCustomers.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                        {selectedCustomers.length} selected
                    </Badge>
                )}
            </div>

            {/* Customer List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                    <Card className="bg-[#111111] border-[#2a2a2a]">
                        <CardContent className="p-6">
                            <div className="text-center text-gray-400">
                                No customers found
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    filteredCustomers.map((customer) => (
                        <Card
                            key={customer.id}
                            className={`bg-[#111111] border-[#2a2a2a] transition-colors ${
                                selectedCustomers.includes(customer.id) ? 'border-blue-500' : ''
                            }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        id={`customer-${customer.id}`}
                                        checked={selectedCustomers.includes(customer.id)}
                                        onCheckedChange={(checked) =>
                                            handleSelectCustomer(customer.id, checked as boolean)
                                        }
                                        className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={`customer-${customer.id}`}
                                                    className="text-sm font-medium text-white cursor-pointer block"
                                                >
                                                    {customer.customer_name}
                                                </label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Building2 className="h-3 w-3 text-gray-500" />
                                                    <span className="text-xs text-gray-400">
                                                        {customer.shops?.shop_name || 'Unknown Shop'}
                                                    </span>
                                                </div>
                                                {customer.customer_email && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {customer.customer_email}
                                                    </p>
                                                )}
                                                {customer.customer_phone && (
                                                    <p className="text-xs text-gray-500">
                                                        {customer.customer_phone}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <FileText className="h-3 w-3" />
                                                    <span>{customer.invoice_count} invoices</span>
                                                </div>
                                                {customer.outstanding_balance > 0 && (
                                                    <Badge variant="destructive" className="mt-1 text-xs">
                                                        {formatCurrency(customer.outstanding_balance)} due
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
