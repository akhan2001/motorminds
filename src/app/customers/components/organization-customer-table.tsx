"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from '@tanstack/react-query';
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { CustomerDetailSheet } from "./customer-detail-sheet";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, Building2, Filter } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { OrganizationCustomersService, type OrganizationCustomer } from "../lib/organization-customers-service";
import { shouldEnableOrganizationWideSearch } from "@/lib/utils/organization-utils";

// Import the same debounced search hook used by admin
function useDebouncedSearch(initialValue: string = '', delay: number = 500) {
    const [searchTerm, setSearchTerm] = useState(initialValue)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [searchTerm, delay])

    const updateSearchTerm = useCallback((term: string) => {
        setSearchTerm(term)
    }, [])

    return {
        searchTerm,
        debouncedSearchTerm,
        updateSearchTerm
    }
}

interface OrganizationCustomerTableProps {
    shopId: string;
    user: any;
    refreshIndex: number;
}

export function OrganizationCustomerTable({ shopId, user, refreshIndex }: OrganizationCustomerTableProps) {
	const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);

	// Use the same debounced search hook as admin
	const { searchTerm, debouncedSearchTerm, updateSearchTerm } = useDebouncedSearch('', 500);

	const ITEMS_PER_PAGE = 50; // Match admin page limit

	// Fetch shops for filter options (same as admin)
	const { data: shopsData } = useQuery({
		queryKey: ['customers', 'organization-shops', shopId],
		queryFn: async () => {
			const res = await fetch(`/api/customers/organization-shops`)
			if (!res.ok) throw new Error('Failed to fetch shops')
			return res.json()
		},
		enabled: !!shopId,
		staleTime: 300000, // 5 minutes - shops don't change often
	});

	// Fetch customers with optimized query using debounced search and shop filters (same as admin)
	const { data, isLoading, error } = useQuery({
		queryKey: ['customers', 'organization-list', shopId, debouncedSearchTerm, currentPage, selectedShopIds],
		queryFn: async () => {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: ITEMS_PER_PAGE.toString(),
				organization_wide: 'true' // Always organization-wide for this component
			});
			
			// Only add search param if there's a search term
			if (debouncedSearchTerm.trim()) {
				params.set('search', debouncedSearchTerm.trim());
			}

			// Add shop filter if shops are selected
			if (selectedShopIds.length > 0) {
				params.set('shop_id', selectedShopIds.join(','));
			}
			
			const res = await fetch(`/api/customers/organization?${params}`);
			
			if (!res.ok) {
				const errorText = await res.text();
				console.error('Failed to fetch customers:', res.status, errorText);
				throw new Error(`Failed to fetch customers: ${res.status}`);
			}
			
			return res.json();
		},
		enabled: !!shopId,
		staleTime: 30000, // 30 seconds
		placeholderData: (previousData) => previousData // Keep previous data while fetching new data
	});

	// Handle search exactly like admin
	const handleSearch = useCallback((search: string) => {
		updateSearchTerm(search);
		setCurrentPage(1); // Reset to first page on search
	}, [updateSearchTerm]);

	// Handle shop filter exactly like admin
	const handleShopFilter = useCallback((shopIds: string[]) => {
		setSelectedShopIds(shopIds);
		setCurrentPage(1); // Reset to first page on filter change
	}, []);

	// Memoize customer data to prevent unnecessary re-renders (same as admin)
	const customers = useMemo(() => {
		return (data as any)?.customers || [];
	}, [data]);

	const totalCount = useMemo(() => {
		return (data as any)?.total || 0;
	}, [data]);

	const availableShops = useMemo(() => {
		return (shopsData as any)?.shops || [];
	}, [shopsData]);

	const handleRowClick = useCallback((customer: OrganizationCustomer) => {
		setSelectedCustomer(customer);
		setIsSheetOpen(true);
	}, []);

	const handleSheetClose = useCallback(() => {
		setIsSheetOpen(false);
		setSelectedCustomer(null);
	}, []);

	// Fetch customer history when a customer is selected
	const { data: customerHistory, isLoading: historyLoading, error: historyError } = useQuery({
		queryKey: ['customer-history', selectedCustomer?.id],
		queryFn: async () => {
			if (!selectedCustomer) return null
			
			const res = await fetch(`/api/admin/customers/${selectedCustomer.id}/history`)
			
			if (!res.ok) {
				const errorText = await res.text()
				console.error('Failed to fetch customer history:', res.status, errorText)
				throw new Error(`Failed to fetch customer history: ${res.status}`)
			}
			
			return res.json()
		},
		enabled: !!selectedCustomer,
		staleTime: 60000, // 1 minute
		retry: 1 // Only retry once on failure
	});

	// Fetch customer vehicles when a customer is selected
	const { data: customerVehicles, isLoading: vehiclesLoading } = useQuery({
		queryKey: ['customer-vehicles', selectedCustomer?.id],
		queryFn: async () => {
			if (!selectedCustomer) return []
			
			const res = await fetch(`/api/customers/${selectedCustomer.id}/vehicles`)
			
			if (!res.ok) {
				console.error('Failed to fetch customer vehicles:', res.status)
				return [] // Return empty array on error instead of throwing
			}
			
			return res.json()
		},
		enabled: !!selectedCustomer,
		staleTime: 60000, // 1 minute
		retry: 1
	});

	// Handle search input changes (same as admin)
	const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		handleSearch(value);
	}, [handleSearch]);

	// Handle page changes
	const handlePageChange = useCallback((page: number) => {
		setCurrentPage(page);
		// React Query will automatically refetch when currentPage changes
	}, []);

	// Calculate pagination
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
	const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
	const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;
		
		if (totalPages <= maxVisiblePages) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			const start = Math.max(1, currentPage - 2);
			const end = Math.min(totalPages, start + maxVisiblePages - 1);
			
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}
		}
		
		return pages;
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center space-x-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder="Search customers..."
						value=""
						className="pl-10"
						disabled
					/>
					</div>
				</div>
				<div className="rounded-md border">
					<div className="p-8 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
						<p className="mt-2 text-muted-foreground">Loading customers...</p>
					</div>
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
						placeholder="Search customers by name, phone, email, or license plate..."
						value={searchTerm || ""}
						onChange={handleSearchChange}
						className="pl-10"
					/>
				</div>

				{/* Shop Filter - same as admin */}
				{availableShops.length > 0 && (
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
			{searchTerm && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Search className="h-4 w-4" />
					<span>
						Found {totalCount} customer{totalCount !== 1 ? 's' : ''} across organization
						{searchTerm && ` matching "${searchTerm}"`}
						{selectedShopIds.length > 0 && ` in ${selectedShopIds.length} shop${selectedShopIds.length !== 1 ? 's' : ''}`}
					</span>
				</div>
			)}

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>License Plate</TableHead>
							<TableHead>Shop</TableHead>
							<TableHead>Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{customers.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8">
									<div className="flex flex-col items-center gap-2">
										<Search className="h-8 w-8 text-muted-foreground" />
										<p className="text-muted-foreground">
											{searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
										</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							customers.map((customer) => (
								<TableRow
									key={customer.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => handleRowClick(customer)}
								>
									<TableCell className="font-medium">
										<div className="flex items-center gap-2">
											{customer.customer_name}
											{!customer.isFromCurrentShop && customer.shopName && (
												<Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
													<Building2 className="h-3 w-3 mr-1" />
													{customer.shopName}
												</Badge>
											)}
										</div>
									</TableCell>
									<TableCell>{customer.customer_email || "N/A"}</TableCell>
									<TableCell>{formatPhoneNumber(customer.customer_phone)}</TableCell>
									<TableCell>{customer.license_plate || "N/A"}</TableCell>
									<TableCell>
										<span className="text-sm text-muted-foreground">
											{customer.shopName || 'Unknown'}
										</span>
									</TableCell>
									<TableCell>
										{new Date(customer.created_at).toLocaleDateString()}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<div className="text-sm text-muted-foreground">
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
				/>
			)}
		</div>
	);
}
