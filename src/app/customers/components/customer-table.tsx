"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { CustomerSheet } from "./customer-sheet";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import debounce from "lodash.debounce";
import { 
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPhoneNumber } from "@/utils/format-phone";
import { capitalizeCustomerName } from "@/lib/utils/text";

export function CustomerTable({ shopId, user, refreshIndex }: { shopId: string, user: any, refreshIndex: number }) {
	const [customers, setCustomers] = useState<any[]>([]);
	const [allCustomers, setAllCustomers] = useState<any[]>([]);
	const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

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
			setCurrentPage(1); // Reset to first page when fetching new data
		} catch (error) {
			console.error('Error fetching customers:', error);
			toast.error('Failed to load customers');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (shopId) {
			fetchCustomers();
		}
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
					(customer.license_plate && customer.license_plate.toLowerCase().includes(lowerCaseQuery)) ||
					(customer.customer_address && customer.customer_address.toLowerCase().includes(lowerCaseQuery))
				);
				setCustomers(filtered);
				setCurrentPage(1); // Reset to first page when searching
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

	// Calculate pagination values
	const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
	const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
	const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
	const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem);

	// Handle page changes
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	// Generate page numbers for pagination
	const generatePaginationItems = () => {
		// If we have 5 or fewer pages, show all of them
		if (totalPages <= 5) {
			return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
				<PaginationItem key={page}>
					<PaginationLink 
						onClick={() => handlePageChange(page)}
						isActive={currentPage === page}
						className={`${currentPage === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"} border-border`}
					>
						{page}
					</PaginationLink>
				</PaginationItem>
			));
		}

		// Otherwise, show a smart pagination with ellipsis
		const items = [];

		// Always show first page
		items.push(
			<PaginationItem key={1}>
				<PaginationLink 
					onClick={() => handlePageChange(1)}
					isActive={currentPage === 1}
					className={`${currentPage === 1 ? "bg-[#333] text-white" : "text-gray-400 hover:text-white hover:bg-[#222]"} border-[#444]`}
				>
					1
				</PaginationLink>
			</PaginationItem>
		);

		// Add ellipsis if needed
		if (currentPage > 3) {
			items.push(
				<PaginationItem key="ellipsis-1">
									<PaginationEllipsis className="text-muted-foreground" />
				</PaginationItem>
			);
		}

		// Add pages around current page
		const startPage = Math.max(2, currentPage - 1);
		const endPage = Math.min(totalPages - 1, currentPage + 1);

		for (let i = startPage; i <= endPage; i++) {
			items.push(
				<PaginationItem key={i}>
					<PaginationLink 
						onClick={() => handlePageChange(i)}
						isActive={currentPage === i}
						className={`${currentPage === i ? "bg-[#333] text-white" : "text-gray-400 hover:text-white hover:bg-[#222]"} border-[#444]`}
					>
						{i}
					</PaginationLink>
				</PaginationItem>
			);
		}

		// Add ellipsis if needed
		if (currentPage < totalPages - 2) {
			items.push(
				<PaginationItem key="ellipsis-2">
									<PaginationEllipsis className="text-muted-foreground" />
				</PaginationItem>
			);
		}

		// Always show last page
		if (totalPages > 1) {
			items.push(
				<PaginationItem key={totalPages}>
					<PaginationLink 
						onClick={() => handlePageChange(totalPages)}
						isActive={currentPage === totalPages}
						className={`${currentPage === totalPages ? "bg-[#333] text-white" : "text-gray-400 hover:text-white hover:bg-[#222]"} border-[#444]`}
					>
						{totalPages}
					</PaginationLink>
				</PaginationItem>
			);
		}

		return items;
	};

	return (
		<div className="space-y-4">
			<div className="relative mb-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						className="pl-10 bg-background border-border hover:border-border focus:border-border text-foreground w-full"
						placeholder="Search by name, email, phone, license plate, or address..."
						value={searchQuery}
						onChange={handleSearchChange}
					/>
				</div>
				{searchQuery && (
					<p className="text-sm text-muted-foreground mt-2">
						Found {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
					</p>
				)}
			</div>

			<div className="rounded-md border border-border overflow-hidden bg-white dark:bg-card">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader className="bg-slate-50 dark:bg-muted/50 border-none">
							<TableRow className="hover:bg-muted/50 border-b border-border">
								<TableHead className="text-foreground font-medium">Name</TableHead>
								<TableHead className="text-foreground font-medium hidden sm:table-cell">Email</TableHead>
								<TableHead className="text-foreground font-medium hidden md:table-cell">Phone</TableHead>
								<TableHead className="text-foreground font-medium hidden lg:table-cell">License Plate</TableHead>
								<TableHead className="text-foreground font-medium hidden xl:table-cell">Address</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{currentCustomers.length > 0 ? (
								currentCustomers.map((customer) => (
									<TableRow
										className="hover:bg-muted/50 border-b border-border cursor-pointer"
										key={customer.id}
										onClick={() => handleRowClick(customer)}
									>
										<TableCell className="text-foreground font-medium">
											{capitalizeCustomerName(customer.customer_name)}
										</TableCell>
										<TableCell className="text-foreground hidden sm:table-cell">
											{customer.customer_email}
										</TableCell>
										<TableCell className="text-foreground hidden md:table-cell">
											{formatPhoneNumber(customer.customer_phone)}
										</TableCell>
										<TableCell className="text-foreground hidden lg:table-cell">
											{customer.license_plate || "-"}
										</TableCell>
										<TableCell className="text-foreground hidden xl:table-cell">
											{customer.customer_address}
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
										{isLoading ? "Loading customers..." : searchQuery ? "No matching customers found" : "No customers found"}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{customers.length > 0 && (
					<div className="py-4 bg-slate-50 dark:bg-muted/30 border-t border-border">
						<Pagination>
							<PaginationContent>
								{/* Show shorter content on mobile */}
								<div className="hidden sm:flex items-center gap-1">
									<PaginationItem>
										<PaginationPrevious 
											onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
											className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"} border-border`}
										/>
									</PaginationItem>
									
									{generatePaginationItems()}
									
									<PaginationItem>
										<PaginationNext 
											onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
											className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"} border-border`}
										/>
									</PaginationItem>
								</div>

								{/* Simplified mobile version */}
								<div className="flex sm:hidden items-center justify-between w-full gap-2">
									<button
										onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
										disabled={currentPage === 1}
										className={`px-3 py-2 rounded border border-border ${
											currentPage === 1 
												? "opacity-50 cursor-not-allowed" 
												: "text-foreground hover:bg-muted"
										}`}
									>
										<ChevronLeft className="h-4 w-4" />
									</button>

									<span className="text-sm text-muted-foreground">
										Page {currentPage} of {totalPages}
									</span>

									<button
										onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
										disabled={currentPage === totalPages}
										className={`px-3 py-2 rounded border border-border ${
											currentPage === totalPages 
												? "opacity-50 cursor-not-allowed" 
												: "text-foreground hover:bg-muted"
										}`}
									>
										<ChevronRight className="h-4 w-4" />
									</button>
								</div>
							</PaginationContent>
						</Pagination>
						{/* <div className="text-center text-sm text-gray-400 mt-2">
							Showing {customers.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, customers.length)} of {customers.length} customers
						</div> */}
					</div>
				)}

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