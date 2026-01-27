"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/navigation/nav';
import BreadcrumbNav from './components/BreadcrumbNav';
import { checkUser } from '@/utils/supabase/supabase-auth';
import { getShopId } from '@/utils/supabase/supabase-shop';
import { Archive, Car, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkOrderQuickView } from '@/components/shared/quick-view/WorkOrderQuickView';
import { Button } from '@/components/ui/button';

interface ArchivedItem {
	id: string;
	[key: string]: any;
}

interface ArchivedData {
	workOrders: ArchivedItem[];
	summary: {
		workOrdersCount: number;
		workOrdersTotalCount: number;
	};
	pagination: {
		page: number;
		limit: number;
		totalPages: number;
		hasMore: boolean;
	};
}

export default function ArchivedRecordsPage() {
	const [shopId, setShopId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [archivedData, setArchivedData] = useState<ArchivedData | null>(null);
	const [isFetchingData, setIsFetchingData] = useState(false);
	const router = useRouter();
	
	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(20);
	
	// Quick view state
	const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);

	useEffect(() => {
		async function fetchUserData() {
			setIsLoading(true);
			try {
				const user = await checkUser();
				if (user) {
					const shop = await getShopId(user.id);
					setShopId(shop);
				} else {
					router.push('/login');
				}
			} catch (error) {
				console.error('Error fetching user data:', error);
				router.push('/login');
			} finally {
				setIsLoading(false);
			}
		}

		fetchUserData();
	}, [router]);

	const fetchArchivedData = useCallback(async () => {
		if (!shopId) return;

		setIsFetchingData(true);
		try {
			const params = new URLSearchParams({ 
				shop_id: shopId,
				page: currentPage.toString(),
				limit: itemsPerPage.toString()
			});
			
			const response = await fetch(`/api/financials/reports/archived?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch archived data');
			}
			const data = await response.json();
			setArchivedData(data);
		} catch (error) {
			console.error('Error fetching archived data:', error);
			setArchivedData(null);
		} finally {
			setIsFetchingData(false);
		}
	}, [shopId, currentPage, itemsPerPage]);

	useEffect(() => {
		if (shopId) {
			fetchArchivedData();
		}
	}, [shopId, fetchArchivedData]);

	// Pagination handlers
	const handlePreviousPage = () => {
		if (currentPage > 1) {
			setCurrentPage(prev => prev - 1);
		}
	};

	const handleNextPage = () => {
		const totalPages = archivedData?.pagination?.totalPages || 1;
		if (currentPage < totalPages) {
			setCurrentPage(prev => prev + 1);
		}
	};

	const totalPages = archivedData?.pagination?.totalPages || 1;

	if (isLoading) {
		return (
			<div className="flex flex-col min-h-screen bg-background text-foreground">
				<Nav />
				<main className="flex-1 p-8 max-w-7xl mx-auto w-full">
					<BreadcrumbNav />
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-screen bg-background text-foreground">
			<Nav />
			<main className="flex-1 p-8 max-w-7xl mx-auto w-full">
				<BreadcrumbNav />
				
				<div className="flex items-center justify-between my-8">
					<div>
						<h1 className="text-3xl font-bold text-foreground mb-2">Deleted Records</h1>
						<p className="text-muted-foreground">View archived invoices, work orders, and expenses.</p>
					</div>
				</div>

				{isFetchingData ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
						<span className="text-muted-foreground">Loading archived data...</span>
					</div>
				) : archivedData ? (
					<div className="space-y-6">
						{/* Summary Card */}
						<div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
							<div className="flex items-center gap-3 mb-3">
								<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
									<Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
								<h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Deleted Work Orders</h3>
							</div>
							<p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
								{archivedData.summary.workOrdersTotalCount || archivedData.summary.workOrdersCount}
							</p>
							<p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
								Total records deleted
							</p>
						</div>

						{/* Deleted Work Orders List */}
						{archivedData.workOrders.length > 0 ? (
							<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
								<div className="flex items-center justify-between mb-4">
									<h3 className="font-semibold text-foreground flex items-center gap-2">
										<Car className="h-5 w-5 text-blue-500" />
										Deleted Work Orders
									</h3>
									{/* Pagination Controls */}
									{totalPages > 1 && (
										<div className="flex items-center gap-4">
											<span className="text-sm text-muted-foreground">
												Page {currentPage} of {totalPages}
											</span>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={handlePreviousPage}
													disabled={currentPage <= 1 || isFetchingData}
												>
													<ChevronLeft className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={handleNextPage}
													disabled={currentPage >= totalPages || isFetchingData}
												>
													<ChevronRight className="h-4 w-4" />
												</Button>
											</div>
										</div>
									)}
								</div>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-slate-50 dark:bg-slate-900/50">
											<tr>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicle</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Deleted On</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border">
											{archivedData.workOrders.map((wo) => (
												<tr 
													key={wo.id} 
													className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
													onClick={() => setSelectedWorkOrderId(wo.id)}
												>
													<td className="px-4 py-3 text-sm font-medium text-foreground">
														{wo.title || 'Untitled'}
													</td>
													<td className="px-4 py-3 text-sm text-muted-foreground">
														{wo.customer?.customer_name || 'Unknown'}
													</td>
													<td className="px-4 py-3 text-sm text-muted-foreground">
														{wo.vehicle ? `${wo.vehicle.year} ${wo.vehicle.make} ${wo.vehicle.model}` : '-'}
													</td>
													<td className="px-4 py-3">
														<span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
															{wo.status || 'unknown'}
														</span>
													</td>
													<td className="px-4 py-3 text-sm text-muted-foreground">
														{wo.updated_at ? new Date(wo.updated_at).toLocaleDateString() : '-'}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						) : (
							<div className="bg-white dark:bg-card border border-border rounded-xl p-12 text-center">
								<Archive className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-foreground mb-2">No deleted work orders</h3>
								<p className="text-muted-foreground">
									Work orders you delete will appear here for record-keeping.
								</p>
							</div>
						)}
					</div>
				) : (
					<div className="bg-white dark:bg-card border border-border rounded-xl p-12 text-center">
						<p className="text-muted-foreground">Unable to load archived data. Please try again.</p>
					</div>
				)}

				{/* Quick View Modal */}
				{selectedWorkOrderId && (
					<WorkOrderQuickView
						workOrderId={selectedWorkOrderId}
						isOpen={!!selectedWorkOrderId}
						onClose={() => setSelectedWorkOrderId(null)}
					/>
				)}
			</main>
		</div>
	);
}
