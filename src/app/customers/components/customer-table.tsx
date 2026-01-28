"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { CustomerDetailSheet } from "@/components/shared/customer-detail-sheet";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, Building2, Filter } from "lucide-react";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { formatPhoneNumber } from "@/utils/format-phone";
import { capitalizeCustomerName } from "@/lib/utils/text";
import { useCustomerAccessContext } from "@/hooks/customers";
import { customerKeys } from "@/data/customers/keys";

interface Customer {
	id: string;
	customer_name: string;
	customer_email: string | null;
	customer_phone: string | null;
	customer_address: string | null;
	license_plate: string | null;
	shop_id: string;
	created_at: string;
	isFromCurrentShop: boolean;
	shopName: string | null;
}

// Debounced search hook
function useDebouncedSearch(initialValue: string = '', delay: number = 300) {
	const [searchTerm, setSearchTerm] = useState<string>(initialValue);
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>(initialValue);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, delay);

		return () => clearTimeout(handler);
	}, [searchTerm, delay]);

	return {
		searchTerm: searchTerm ?? '',
		debouncedSearchTerm: debouncedSearchTerm ?? '',
		setSearchTerm
	};
}

interface CustomerTableProps {
	shopId: string;
	user: any;
	refreshIndex: number;
}

/**
 * Unified CustomerTable - adapts based on user's access scope
 * 
 * - Shop scope: Shows only current shop's customers
 * - Organization scope: Shows all customers across organization with shop filter
 * - Platform scope: Shows all customers with shop filter
 */
export function CustomerTable({ shopId, user, refreshIndex }: CustomerTableProps) {
	const queryClient = useQueryClient();
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
	const ITEMS_PER_PAGE = 50;

	const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearch('', 300);

	// Use the access context hook (Supabase pattern)
	const {
		accessContext,
		isLoading: contextLoading,
		hasOrganizationAccess,
		showShopFilter,
		showShopColumn,
		availableShops,
		accessScope
	} = useCustomerAccessContext();

	// Fetch customers using the unified API
	const { data: customersData, isLoading: customersLoading, error } = useQuery({
		queryKey: customerKeys.list(shopId, {
			scope: accessScope,
			search: debouncedSearchTerm,
			shopFilter: selectedShopIds[0],
			page: currentPage,
		}),
		queryFn: async () => {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: ITEMS_PER_PAGE.toString(),
			});

			if (debouncedSearchTerm.trim()) {
				params.set('search', debouncedSearchTerm.trim());
			}

			// Apply shop filter for org/platform scope
			if (selectedShopIds.length === 1) {
				params.set('shop_id', selectedShopIds[0]);
			}

			const res = await fetch(`/api/customers?${params}`);
			if (!res.ok) {
				throw new Error('Failed to fetch customers');
			}
			return res.json();
		},
		enabled: !!shopId && !contextLoading,
		staleTime: 30000, // 30 seconds
		placeholderData: (prev) => prev,
	});

	// Memoized data
	const customers = useMemo(() => customersData?.customers || [], [customersData]);
	const totalCount = useMemo(() => customersData?.total || 0, [customersData]);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	// Handlers
	const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setCurrentPage(1);
	}, [setSearchTerm]);

	const handleShopFilter = useCallback((shopIds: string[]) => {
		setSelectedShopIds(shopIds);
		setCurrentPage(1);
	}, []);

	const handlePageChange = useCallback((page: number) => {
		setCurrentPage(page);
	}, []);

	const handleRowClick = useCallback((customer: Customer) => {
		setSelectedCustomer(customer);
		setIsSheetOpen(true);
	}, []);

	const handleSheetClose = useCallback(() => {
		setIsSheetOpen(false);
		setSelectedCustomer(null);
	}, []);

	const handleCustomerUpdated = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
		if (selectedCustomer) {
			queryClient.invalidateQueries({ queryKey: customerKeys.history(selectedCustomer.id) });
			queryClient.invalidateQueries({ queryKey: customerKeys.vehiclesList(selectedCustomer.id) });
		}
	}, [queryClient, selectedCustomer]);

	// Fetch customer history when selected
	const { data: customerHistory, isLoading: historyLoading, error: historyError } = useQuery({
		queryKey: customerKeys.history(selectedCustomer?.id ?? ''),
		queryFn: async () => {
			if (!selectedCustomer) return null;
			const res = await fetch(`/api/admin/customers/${selectedCustomer.id}/history`);
			if (!res.ok) throw new Error('Failed to fetch customer history');
			return res.json();
		},
		enabled: !!selectedCustomer,
		staleTime: 60000,
		retry: 1,
	});

	// Fetch customer vehicles when selected
	const { data: customerVehicles, isLoading: vehiclesLoading } = useQuery({
		queryKey: customerKeys.vehiclesList(selectedCustomer?.id ?? ''),
		queryFn: async () => {
			if (!selectedCustomer) return [];
			const res = await fetch(`/api/customers/${selectedCustomer.id}/vehicles`);
			if (!res.ok) return [];
			return res.json();
		},
		enabled: !!selectedCustomer,
		staleTime: 60000,
		retry: 1,
	});

	// Pagination helpers
	const getPageNumbers = () => {
		const pages: number[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			const start = Math.max(1, currentPage - 2);
			const end = Math.min(totalPages, start + maxVisible - 1);
			for (let i = start; i <= end; i++) pages.push(i);
		}
		return pages;
	};

	const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
	const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

	// Loading state - Table skeleton
	if (contextLoading || (customersLoading && !customersData)) {
		return (
			<div className="space-y-4">
				{/* Search skeleton */}
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder="Search customers..."
							className="pl-10"
							disabled
							value=""
							readOnly
						/>
					</div>
				</div>

				{/* Table skeleton */}
				<div className="rounded-md border border-border overflow-hidden bg-white dark:bg-card">
					<Table>
						<TableHeader className="bg-slate-50 dark:bg-muted/50">
							<TableRow className="hover:bg-muted/50 border-b border-border">
								<TableHead className="text-foreground font-medium">Name</TableHead>
								<TableHead className="text-foreground font-medium hidden sm:table-cell">Email</TableHead>
								<TableHead className="text-foreground font-medium hidden md:table-cell">Phone</TableHead>
								<TableHead className="text-foreground font-medium hidden lg:table-cell">License Plate</TableHead>
								<TableHead className="text-foreground font-medium hidden xl:table-cell">Address</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{[...Array(8)].map((_, i) => (
								<TableRow key={i} className="border-b border-border">
									<TableCell>
										<Skeleton className="h-4 w-32" />
									</TableCell>
									<TableCell className="hidden sm:table-cell">
										<Skeleton className="h-4 w-40" />
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<Skeleton className="h-4 w-28" />
									</TableCell>
									<TableCell className="hidden lg:table-cell">
										<Skeleton className="h-4 w-20" />
									</TableCell>
									<TableCell className="hidden xl:table-cell">
										<Skeleton className="h-4 w-48" />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Search and Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder={showShopFilter
							? "Search customers by name, phone, email, or license plate (organization-wide)..."
							: "Search by name, email, phone, license plate, or address..."
						}
						value={searchTerm || ''}
						onChange={handleSearchChange}
						className="pl-10 bg-background border-border text-foreground"
					/>
				</div>

				{/* Shop Filter - only shown for organization/platform scope */}
				{showShopFilter && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="flex items-center gap-2">
								<Filter className="h-4 w-4" />
								{selectedShopIds.length === 0
									? "All Shops"
									: selectedShopIds.length === 1
										? availableShops.find(s => s.id === selectedShopIds[0])?.shop_name || "1 Shop"
										: `${selectedShopIds.length} Shops`
								}
								{selectedShopIds.length > 0 && (
									<Badge variant="secondary" className="ml-1">
										{selectedShopIds.length}
									</Badge>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel className="flex items-center justify-between">
								Filter by Shop
								{selectedShopIds.length > 0 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleShopFilter([])}
										className="h-auto p-1 text-xs"
									>
										Clear
									</Button>
								)}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{availableShops.map((shop) => (
								<DropdownMenuCheckboxItem
									key={shop.id}
									checked={selectedShopIds.includes(shop.id)}
									onCheckedChange={(checked) => {
										const newSelected = checked
											? [...selectedShopIds, shop.id]
											: selectedShopIds.filter(id => id !== shop.id);
										handleShopFilter(newSelected);
									}}
								>
									{shop.shop_name}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			{/* Results Summary */}
			{(searchTerm || selectedShopIds.length > 0) && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Search className="h-4 w-4" />
					<span>
						Found {totalCount} customer{totalCount !== 1 ? 's' : ''}
						{hasOrganizationAccess && ' across organization'}
						{searchTerm && ` matching "${searchTerm}"`}
						{selectedShopIds.length > 0 && ` in ${selectedShopIds.length} shop${selectedShopIds.length !== 1 ? 's' : ''}`}
					</span>
				</div>
			)}

			{/* Table */}
			<div className="rounded-md border border-border overflow-hidden bg-white dark:bg-card">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader className="bg-slate-50 dark:bg-muted/50">
							<TableRow className="hover:bg-muted/50 border-b border-border">
								<TableHead className="text-foreground font-medium">Name</TableHead>
								<TableHead className="text-foreground font-medium hidden sm:table-cell">Email</TableHead>
								<TableHead className="text-foreground font-medium hidden md:table-cell">Phone</TableHead>
								<TableHead className="text-foreground font-medium hidden lg:table-cell">License Plate</TableHead>
								{showShopColumn && (
									<TableHead className="text-foreground font-medium hidden lg:table-cell">Shop</TableHead>
								)}
								<TableHead className="text-foreground font-medium hidden xl:table-cell">
									{showShopColumn ? 'Created' : 'Address'}
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{customers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={showShopColumn ? 6 : 5} className="text-center py-8">
										<div className="flex flex-col items-center gap-2">
											<Search className="h-8 w-8 text-muted-foreground" />
											<p className="text-muted-foreground">
												{searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : (
								customers.map((customer: Customer) => (
									<TableRow
										key={customer.id}
										className="hover:bg-muted/50 border-b border-border cursor-pointer"
										onClick={() => handleRowClick(customer)}
									>
										<TableCell className="text-foreground font-medium">
											<div className="flex items-center gap-2">
												{capitalizeCustomerName(customer.customer_name)}
												{showShopColumn && !customer.isFromCurrentShop && customer.shopName && (
													<Badge
														variant="outline"
														className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
													>
														<Building2 className="h-3 w-3 mr-1" />
														{customer.shopName}
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell className="text-foreground hidden sm:table-cell">
											{customer.customer_email || "-"}
										</TableCell>
										<TableCell className="text-foreground hidden md:table-cell">
											{formatPhoneNumber(customer.customer_phone)}
										</TableCell>
										<TableCell className="text-foreground hidden lg:table-cell">
											{customer.license_plate || "-"}
										</TableCell>
										{showShopColumn && (
											<TableCell className="text-muted-foreground hidden lg:table-cell">
												{customer.shopName || 'Unknown'}
											</TableCell>
										)}
										<TableCell className="text-foreground hidden xl:table-cell">
											{showShopColumn
												? (customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-')
												: customer.customer_address || "-"
											}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between py-4 px-4 bg-slate-50 dark:bg-muted/30 border-t border-border">
						<div className="text-sm text-muted-foreground hidden sm:block">
							Showing {startItem} to {endItem} of {totalCount} customers
						</div>
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
										className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
									/>
								</PaginationItem>

								{getPageNumbers().map((page) => (
									<PaginationItem key={page}>
										<PaginationLink
											onClick={() => handlePageChange(page)}
											isActive={currentPage === page}
											className="cursor-pointer"
										>
											{page}
										</PaginationLink>
									</PaginationItem>
								))}

								<PaginationItem>
									<PaginationNext
										onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
										className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</div>

			{/* Customer Detail Sheet */}
			{selectedCustomer && (
				<CustomerDetailSheet
					customer={selectedCustomer}
					customerHistory={customerHistory}
					vehicles={customerVehicles || []}
					isOpen={isSheetOpen}
					onClose={handleSheetClose}
					loading={historyLoading}
					vehiclesLoading={vehiclesLoading}
					error={historyError?.message || null}
					onCustomerUpdated={handleCustomerUpdated}
					allowDelete={true}
					showEmailButton={true}
				/>
			)}
		</div>
	);
}