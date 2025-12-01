"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { CustomerSheet } from "./customer-sheet";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, Building2, Filter } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { OrganizationCustomersService, type OrganizationCustomer } from "../lib/organization-customers-service";
import { shouldEnableOrganizationWideSearch } from "@/lib/utils/organization-utils";

interface OrganizationCustomerTableProps {
    shopId: string;
    user: any;
    refreshIndex: number;
}

export function OrganizationCustomerTable({ shopId, user, refreshIndex }: OrganizationCustomerTableProps) {
	const [customers, setCustomers] = useState<OrganizationCustomer[]>([]);
	const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [searchScope, setSearchScope] = useState<'shop' | 'organization'>('shop');
	const [organizationStatus, setOrganizationStatus] = useState<{
        canAccessOrganizationCustomers: boolean;
        organizationId: string | null;
    }>({ canAccessOrganizationCustomers: false, organizationId: null });

	const ITEMS_PER_PAGE = 10;

	// Check organization status on mount
	useEffect(() => {
		const checkOrganizationStatus = async () => {
			if (user?.id) {
				const status = await OrganizationCustomersService.getOrganizationStatus(user.id);
				const canAccess = shouldEnableOrganizationWideSearch(status.adminType, status.organizationId);
				setOrganizationStatus({
					canAccessOrganizationCustomers: canAccess,
					organizationId: status.organizationId
				});
				
				// Default to organization-wide for MSO shops
				if (canAccess) {
					setSearchScope('organization');
				}
			}
		};
		checkOrganizationStatus();
	}, [user?.id]);

	const fetchCustomers = async (search?: string, page: number = 1) => {
		setIsLoading(true);
		try {
			const organizationWide = searchScope === 'organization' && organizationStatus.canAccessOrganizationCustomers;

			const result = await OrganizationCustomersService.getCustomers(shopId, {
				organizationWide,
				search: search || searchQuery,
				limit: ITEMS_PER_PAGE,
				page
			});

			setCustomers(result.customers);
			setTotalCount(result.total);
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
	}, [shopId, refreshIndex, searchScope]);

	// Debounced search function
	const debouncedSearch = useMemo(
		() =>
			debounce((query: string) => {
				setCurrentPage(1);
				fetchCustomers(query, 1);
			}, 300),
		[shopId, searchScope, organizationStatus.canAccessOrganizationCustomers]
	);

	// Handle search input changes
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);
		debouncedSearch(query);
	};

	// Handle search scope change
	const handleSearchScopeChange = (scope: 'shop' | 'organization') => {
		setSearchScope(scope);
		setCurrentPage(1);
		// Refetch with new scope
		setTimeout(() => fetchCustomers(searchQuery, 1), 100);
	};

	// Clean up debounce on unmount
	useEffect(() => {
		return () => {
			debouncedSearch.cancel();
		};
	}, [debouncedSearch]);

	const handleRowClick = (customer: OrganizationCustomer) => {
		setSelectedCustomer(customer);
		setIsSheetOpen(true);
	};

	const handleSheetClose = () => {
		setIsSheetOpen(false);
		setSelectedCustomer(null);
		// Refresh the table when sheet closes (in case customer was updated)
		fetchCustomers(searchQuery, currentPage);
	};

	// Handle page changes
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		fetchCustomers(searchQuery, page);
	};

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
						value={searchQuery}
						onChange={handleSearchChange}
						className="pl-10"
					/>
				</div>

				{/* Organization/Shop Scope Toggle */}
				{organizationStatus.canAccessOrganizationCustomers && (
					<div className="flex items-center gap-2">
						<Label className="text-xs text-muted-foreground whitespace-nowrap">Search scope:</Label>
						<Select value={searchScope} onValueChange={handleSearchScopeChange}>
							<SelectTrigger className="w-auto h-9 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="shop">Current Shop Only</SelectItem>
								<SelectItem value="organization">Entire Organization</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			{/* Results Summary */}
			{searchQuery && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Search className="h-4 w-4" />
					<span>
						Found {totalCount} customer{totalCount !== 1 ? 's' : ''} 
						{searchScope === 'organization' ? ' across organization' : ' in current shop'}
						{searchQuery && ` matching "${searchQuery}"`}
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
							{searchScope === 'organization' && <TableHead>Shop</TableHead>}
							<TableHead>Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{customers.length === 0 ? (
							<TableRow>
								<TableCell colSpan={searchScope === 'organization' ? 6 : 5} className="text-center py-8">
									<div className="flex flex-col items-center gap-2">
										<Search className="h-8 w-8 text-muted-foreground" />
										<p className="text-muted-foreground">
											{searchQuery ? 'No customers found matching your search.' : 'No customers found.'}
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
									{searchScope === 'organization' && (
										<TableCell>
											<span className="text-sm text-muted-foreground">
												{customer.shopName || 'Unknown'}
											</span>
										</TableCell>
									)}
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
				<CustomerSheet
					customer={selectedCustomer}
					isOpen={isSheetOpen}
					onClose={handleSheetClose}
				/>
			)}
		</div>
	);
}
