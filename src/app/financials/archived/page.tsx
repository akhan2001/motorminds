"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/navigation/nav';
import BreadcrumbNav from './components/BreadcrumbNav';
import { checkUser } from '@/utils/supabase/supabase-auth';
import { getShopId } from '@/utils/supabase/supabase-shop';
import { Archive, Car, FileWarning, Receipt, Loader2 } from 'lucide-react';
import { InvoiceQuickView } from '@/components/shared/quick-view/InvoiceQuickView';
import { WorkOrderQuickView } from '@/components/shared/quick-view/WorkOrderQuickView';

interface ArchivedItem {
	id: string;
	[key: string]: any;
}

interface ArchivedData {
	invoices: ArchivedItem[];
	workOrders: ArchivedItem[];
	expenses: ArchivedItem[];
	summary: {
		invoicesCount: number;
		invoicesTotalAmount: number;
		workOrdersCount: number;
		workOrdersTotalAmount: number;
		expensesCount: number;
		expensesTotalAmount: number;
	};
}

const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
};

export default function ArchivedRecordsPage() {
	const [shopId, setShopId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [archivedData, setArchivedData] = useState<ArchivedData | null>(null);
	const [isFetchingData, setIsFetchingData] = useState(false);
	const router = useRouter();
	
	// Quick view state
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
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
			const params = new URLSearchParams({ shop_id: shopId });
			
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
	}, [shopId]);

	useEffect(() => {
		if (shopId) {
			fetchArchivedData();
		}
	}, [shopId, fetchArchivedData]);

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
						{/* Summary Cards */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 rounded-lg bg-red-100 dark:bg-red-800">
										<FileWarning className="h-5 w-5 text-red-600 dark:text-red-400" />
									</div>
									<h3 className="text-sm font-medium text-red-800 dark:text-red-200">Archived Invoices</h3>
								</div>
								<p className="text-4xl font-bold text-red-900 dark:text-red-100">
									{archivedData.summary.invoicesCount}
								</p>
								<p className="text-sm text-red-600 dark:text-red-400 mt-2">
									Total: {formatCurrency(archivedData.summary.invoicesTotalAmount)}
								</p>
							</div>
							<div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
										<Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									</div>
									<h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Archived Work Orders</h3>
								</div>
								<p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
									{archivedData.summary.workOrdersCount}
								</p>
								<p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
									Records archived
								</p>
							</div>
							<div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-800">
										<Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
									</div>
									<h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">Archived Expenses</h3>
								</div>
								<p className="text-4xl font-bold text-purple-900 dark:text-purple-100">
									{archivedData.summary.expensesCount}
								</p>
								<p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
									Total: {formatCurrency(archivedData.summary.expensesTotalAmount)}
								</p>
							</div>
						</div>

						{/* Archived Invoices List */}
						{archivedData.invoices.length > 0 && (
							<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
								<h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
									<FileWarning className="h-5 w-5 text-red-500" />
									Archived Invoices
								</h3>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-slate-50 dark:bg-slate-900/50">
											<tr>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice #</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicle</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tax</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border">
											{archivedData.invoices.map((invoice) => (
												<tr 
													key={invoice.id} 
													className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
													onClick={() => setSelectedInvoiceId(invoice.invoice_number || invoice.id)}
												>
													<td className="px-4 py-3 text-sm font-medium text-foreground">
														{invoice.display_id || invoice.invoice_number}
													</td>
													<td className="px-4 py-3 text-sm text-muted-foreground">
														{invoice.customer?.customer_name || 'Unknown'}
													</td>
													<td className="px-4 py-3 text-sm text-muted-foreground">
														{invoice.vehicle ? `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}` : '-'}
													</td>
													<td className="px-4 py-3">
														<span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 capitalize">
															{invoice.status}
														</span>
													</td>
													<td className="px-4 py-3 text-sm text-right font-medium text-foreground">
														{formatCurrency(invoice.calculated_total || invoice.total_amount || 0)}
													</td>
													<td className="px-4 py-3 text-sm text-right text-muted-foreground">
														{formatCurrency(invoice.calculated_tax || invoice.tax_amount || 0)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* Archived Work Orders List */}
						{archivedData.workOrders.length > 0 && (
							<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
								<h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
									<Car className="h-5 w-5 text-blue-500" />
									Archived Work Orders
								</h3>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-slate-50 dark:bg-slate-900/50">
											<tr>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicle</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Archived Date</th>
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
														{wo.archived_at ? new Date(wo.archived_at).toLocaleDateString() : '-'}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* Archived Expenses List */}
						{archivedData.expenses.length > 0 && (
							<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
								<h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
									<Receipt className="h-5 w-5 text-purple-500" />
									Archived Expenses
								</h3>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-slate-50 dark:bg-slate-900/50">
											<tr>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendor</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tax</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border">
											{archivedData.expenses.map((exp) => (
												<tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
													<td className="px-4 py-3 text-sm font-medium text-foreground">
														{exp.vendor || '-'}
													</td>
													<td className="px-4 py-3 text-sm text-muted-foreground">
														{exp.cost_name}
													</td>
													<td className="px-4 py-3 text-sm text-muted-foreground">
														{exp.cost_date ? new Date(exp.cost_date).toLocaleDateString() : '-'}
													</td>
													<td className="px-4 py-3 text-sm text-right font-medium text-foreground">
														{formatCurrency(exp.amount || 0)}
													</td>
													<td className="px-4 py-3 text-sm text-right text-muted-foreground">
														{formatCurrency(exp.tax_amount || 0)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* No archived items message */}
						{archivedData.invoices.length === 0 && 
						 archivedData.workOrders.length === 0 && 
						 archivedData.expenses.length === 0 && (
							<div className="bg-white dark:bg-card border border-border rounded-xl p-12 text-center">
								<Archive className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-foreground mb-2">No archived items</h3>
								<p className="text-muted-foreground">
									Items you archive will appear here for record-keeping.
								</p>
							</div>
						)}
					</div>
				) : (
					<div className="bg-white dark:bg-card border border-border rounded-xl p-12 text-center">
						<p className="text-muted-foreground">Unable to load archived data. Please try again.</p>
					</div>
				)}

				{/* Quick View Modals */}
				{selectedInvoiceId && (
					<InvoiceQuickView
						invoiceId={selectedInvoiceId}
						isOpen={!!selectedInvoiceId}
						onClose={() => setSelectedInvoiceId(null)}
					/>
				)}
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
