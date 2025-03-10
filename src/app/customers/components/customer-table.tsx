"use client";

import { useEffect, useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { getCustomers } from "@/app/customers/api/customer-utils";
import { CustomerSheet } from "./customer-sheet";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function CustomerTable({ shopId, user, refreshIndex }: { shopId: string, user: any, refreshIndex: number }) {
	const [customers, setCustomers] = useState<any[]>([]);
	const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const fetchCustomers = async () => {
		setIsLoading(true);
		try {
			const { data: customers, error } = await supabase
				.from('customers')
				.select('*')
				.eq('shop_id', shopId)
				.order('created_at', { ascending: false });

			if (error) throw error;
			setCustomers(customers || []);
		} catch (error) {
			console.error('Error fetching customers:', error);
			toast.error('Failed to load customers');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCustomers();
	}, [shopId, refreshIndex]);

	const handleRowClick = (customer: any) => {
		setSelectedCustomer(customer);
		setIsSheetOpen(true);
	};

	return (
		<div className="space-y-4">
			<div className="rounded-md border border-[#222] overflow-hidden">
				<Table>
					<TableHeader className="bg-[#222] border-none">
						<TableRow className="hover:bg-[#222] border-b-1 border-[#333]">
							<TableHead className="text-white font-medium">Name</TableHead>
							<TableHead className="text-white font-medium">Email</TableHead>
							<TableHead className="text-white font-medium">Phone</TableHead>
							<TableHead className="text-white font-medium">Address</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{customers.map((customer) => (
						<TableRow
							className="hover:bg-[#1a1a1a] border-b border-[#222] cursor-pointer"
							key={customer.id}
							onClick={() => handleRowClick(customer)}
						>
							<TableCell className="text-[#E2E2E2]">
								{customer.customer_name}
							</TableCell>
							<TableCell className="text-[#E2E2E2]">
								{customer.customer_email}
							</TableCell>
							<TableCell className="text-[#E2E2E2]">
								{customer.customer_phone}
							</TableCell>
							<TableCell className="text-[#E2E2E2]">
								{customer.customer_address}
							</TableCell>
						</TableRow>
						))}
					</TableBody>
				</Table>

				{selectedCustomer && (
					<CustomerSheet
						customer={selectedCustomer}
						isOpen={isSheetOpen}
						onOpenChange={setIsSheetOpen}
						onCustomerUpdated={fetchCustomers}
					/>
				)}
			</div>
		</div>
	);
}
