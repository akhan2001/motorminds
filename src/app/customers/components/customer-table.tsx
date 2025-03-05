"use client"

import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { getCustomers } from "../api/customer-utils"
import { useEffect, useState } from "react";
import { CustomerSheet } from "./customer-sheet";

export function CustomerTable() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);


    useEffect(() => {
        const fetchCustomers = async () => {
            const customers = await getCustomers();
            setCustomers(customers);
        }
        console.log(customers);
        fetchCustomers();
    }, []);

    const handleCustomerClick = (customer: any) => {
        setSelectedCustomer(customer);
        setIsSheetOpen(true);
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-[#222] overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#222]">
                        <TableRow className="hover:bg-[#222] border-b-0">
                            <TableHead className="text-white font-medium">Name</TableHead>
                            <TableHead className="text-white font-medium">Email</TableHead>
                            <TableHead className="text-white font-medium">Phone</TableHead>
                            <TableHead className="text-white font-medium">Address</TableHead>
                        </TableRow>

                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow className="hover:bg-[#1a1a1a] border-b border-[#222] cursor-pointer" key={customer.id}
                                onClick={() => {
                                    handleCustomerClick(customer);
                                }}
                            >
                                <TableCell className="text-[#E2E2E2]">{customer.customer_name}</TableCell>
                                <TableCell className="text-[#E2E2E2]">{customer.customer_email}</TableCell>
                                <TableCell className="text-[#E2E2E2]">{customer.customer_phone}</TableCell>
                                <TableCell className="text-[#E2E2E2]">{customer.customer_address}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <CustomerSheet
                    customer={selectedCustomer}
                    isOpen={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                />
            </div>
        </div>
    )
}
