"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { CustomerSheet } from "./customer-sheet";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import debounce from "lodash.debounce";

export function CustomerTable({ shopId, user, refreshIndex }: { shopId: string, user: any, refreshIndex: number }) {
	const [customers, setCustomers] = useState<any[]>([]);
	const [allCustomers, setAllCustomers] = useState<any[]>([]);
	const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	const fetchCustomers = async () => {
		setIsLoading(true);
		try {
			const { data: customers, error } = await supabase
				.from('customers')
				.select('*')
				.eq('shop_id', shopId)
				.order('created_at', { ascending: false });

			if (error) throw error;
			setAllCustomers(customers || []); // Store all customers
			setCustomers(customers || []); // Initialize filtered list with all customers
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

	// Debounced search function to limit expensive filtering operations
	const debouncedSearch = useMemo(
		() =>
			debounce((query: string) => {
				if (!query.trim()) {
					setCustomers(allCustomers);
					return;
				}

				const lowerCaseQuery = query.toLowerCase();
				const filtered = allCustomers.filter((customer) => 
					(customer.customer_name && customer.customer_name.toLowerCase().includes(lowerCaseQuery)) ||
					(customer.customer_email && customer.customer_email.toLowerCase().includes(lowerCaseQuery)) ||
					(customer.customer_phone && customer.customer_phone.toLowerCase().includes(lowerCaseQuery)) ||
					(customer.customer_address && customer.customer_address.toLowerCase().includes(lowerCaseQuery))
				);
				setCustomers(filtered);
			}, 300),
		[allCustomers]
	);

	// Handle search input changes
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);
		debouncedSearch(query);
	};

	// Clean up debounce on unmount
	useEffect(() => {
		return () => {
			debouncedSearch.cancel();
		};
	}, [debouncedSearch]);

	const handleRowClick = (customer: any) => {
		setSelectedCustomer(customer);
		setIsSheetOpen(true);
	};

	return (
		<div className="space-y-4">
			<div className="relative mb-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
					<Input
						className="pl-10 bg-[#131313] border-[#222] hover:border-[#444] focus:border-[#555] text-white w-full"
						placeholder="Search by name, email, phone, or address..."
						value={searchQuery}
						onChange={handleSearchChange}
					/>
				</div>
				{searchQuery && (
					<p className="text-sm text-gray-400 mt-2">
						Found {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
					</p>
				)}
			</div>

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
						{customers.length > 0 ? (
							customers.map((customer) => (
								<TableRow
									className="hover:bg-secondary-foreground border-b border-[#222] cursor-pointer"
									key={customer.id}
									onClick={() => handleRowClick(customer)}
								>
									<TableCell className="text-foreground">
										{customer.customer_name}
									</TableCell>
									<TableCell className="text-foreground">
										{customer.customer_email}
									</TableCell>
									<TableCell className="text-foreground">
										{customer.customer_phone}
									</TableCell>
									<TableCell className="text-foreground">
										{customer.customer_address}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-8 text-gray-400">
									{isLoading ? "Loading customers..." : "No customers found"}
								</TableCell>
							</TableRow>
						)}
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
