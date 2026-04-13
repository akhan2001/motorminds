"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/navigation/nav';
import BreadcrumbNav from './components/BreadcrumbNav';
import { checkUser } from '@/utils/supabase/supabase-auth';
import { getShopId } from '@/utils/supabase/supabase-shop';
import { Calendar, DollarSign, Loader2, Receipt, Car, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceQuickView } from '@/components/shared/quick-view/InvoiceQuickView';
import { WorkOrderQuickView } from '@/components/shared/quick-view/WorkOrderQuickView';
import { formatDateOnly, getTorontoDayBoundsUTC, getTorontoDateString } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';

interface DailyReportData {
	date: string;
	summary: {
		carsCount: number;
		workOrdersCompletedCount: number;
		invoicesCount: number;
		totalRevenue: number;
		totalSubtotal: number;
		totalTax: number;
		advancePaymentsTotal?: number;
		creditsRefundsTotal?: number;
		invoiceRefundsTotal?: number;
	};
	paymentMethods: Array<{
		method: string;
		label: string;
		count: number;
		amount: number;
		percentage: number;
	}>;
	paymentsToday: Array<{
		invoice_id: string;
		invoice_number: string | null;
		invoice_status: string | null;
		invoice_total: number;
		work_order_id: string | null;
		description: string;
		license_plate: string | null;
		customer_name: string;
		payments: Array<{ amount: number; payment_method: string; payment_date: string | null }>;
	}>;
}

function formatPaymentMethodLabel(method: string): string {
	const labels: Record<string, string> = {
		credit_card: 'Credit Card',
		debit_card: 'Debit Card',
		debit: 'Debit',
		cash: 'Cash',
		check: 'Check',
		bank_transfer: 'Bank Transfer',
		e_transfer: 'E-Transfer',
		other: 'Other',
	};
	return labels[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function InvoiceStatusBadge({ status }: { status: string | null }) {
	if (!status) return <span className="text-muted-foreground">—</span>;
	const map: Record<string, { label: string; className: string }> = {
		paid:           { label: 'Paid',     className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
		partially_paid: { label: 'Partial',  className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
		unpaid:         { label: 'Unpaid',   className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
		sent:           { label: 'Sent',     className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
		overdue:        { label: 'Overdue',  className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
	};
	const config = map[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
	return (
		<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
			{config.label}
		</span>
	);
}

const formatPercent = (value: number): string => {
	return `${value.toFixed(1)}%`;
};

export default function DailyReportsPage() {
	const [shopId, setShopId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [dailyReportData, setDailyReportData] = useState<DailyReportData | null>(null);
	const [isFetchingReport, setIsFetchingReport] = useState(false);
	const [selectedDate, setSelectedDate] = useState<string>(() => 
		getTorontoDateString()
	);
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

	// Convert selected date (YYYY-MM-DD) to Toronto timezone UTC bounds for API
	const getDayBoundsUTC = useCallback((dateStr: string) => {
		// Use centralized Toronto timezone conversion for consistent date boundaries
		const bounds = getTorontoDayBoundsUTC(dateStr);
		return { iso_timestamp_start: bounds.start, iso_timestamp_end: bounds.end };
	}, []);

	const fetchDailyReport = useCallback(async () => {
		if (!shopId) return;

		setIsFetchingReport(true);
		try {
			const { iso_timestamp_start, iso_timestamp_end } = getDayBoundsUTC(selectedDate);
			const params = new URLSearchParams({
				shop_id: shopId,
				date: selectedDate,
				iso_timestamp_start,
				iso_timestamp_end,
			});

			const response = await fetch(`/api/financials/reports/daily?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch daily report data');
			}
			const data = await response.json();
			setDailyReportData(data);
		} catch (error) {
			console.error('Error fetching daily report:', error);
			setDailyReportData(null);
		} finally {
			setIsFetchingReport(false);
		}
	}, [shopId, selectedDate]);

	useEffect(() => {
		if (shopId) {
			fetchDailyReport();
		}
	}, [shopId, selectedDate, fetchDailyReport]);

	const goToPreviousDay = () => {
		const date = new Date(selectedDate + 'T00:00:00');
		date.setDate(date.getDate() - 1);
		setSelectedDate(getTorontoDateString(date));
	};

	const goToNextDay = () => {
		const date = new Date(selectedDate + 'T00:00:00');
		date.setDate(date.getDate() + 1);
		const today = getTorontoDateString();
		const nextDateStr = getTorontoDateString(date);
		if (nextDateStr <= today) {
			setSelectedDate(nextDateStr);
		}
	};

	const goToToday = () => {
		setSelectedDate(getTorontoDateString());
	};

	const isToday = selectedDate === getTorontoDateString();

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
						<h1 className="text-3xl font-bold text-foreground mb-2">Daily Reports</h1>
						<p className="text-muted-foreground">View cars serviced and payment method breakdown by day.</p>
					</div>
				</div>

				{/* Date Navigation */}
				<div className="bg-white dark:bg-card border border-border rounded-xl p-6 mb-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button 
								variant="outline" 
								size="icon"
								onClick={goToPreviousDay}
								className="border-border"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<div className="flex items-center gap-3">
								<Calendar className="h-5 w-5 text-blue-500" />
								<div>
									<p className="text-lg font-semibold text-foreground">
										{formatDateOnly(selectedDate)}
									</p>
									{isToday && (
										<span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Today</span>
									)}
								</div>
							</div>
							<Button 
								variant="outline" 
								size="icon"
								onClick={goToNextDay}
								disabled={isToday}
								className="border-border"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
						<div className="flex items-center gap-3">
							<input
								type="date"
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								max={getTorontoDateString()}
								className="px-3 py-2 border border-border rounded-lg bg-white dark:bg-background text-foreground text-sm"
							/>
							{!isToday && (
								<Button 
									variant="outline" 
									size="sm"
									onClick={goToToday}
									className="border-border"
								>
									Go to Today
								</Button>
							)}
						</div>
					</div>
				</div>

				{isFetchingReport ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
						<span className="text-muted-foreground">Loading daily report...</span>
					</div>
				) : dailyReportData ? (
					<div className="space-y-6">
						{/* Summary Cards */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
										<Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									</div>
									<h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Cars Serviced</h3>
								</div>
								<p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
									{dailyReportData.summary.carsCount}
								</p>
								<p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
									{dailyReportData.summary.workOrdersCompletedCount} work order{dailyReportData.summary.workOrdersCompletedCount !== 1 ? 's' : ''} completed
								</p>
							</div>
							<div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 rounded-lg bg-green-100 dark:bg-green-800">
										<DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
									</div>
									<h3 className="text-sm font-medium text-green-800 dark:text-green-200">Total Revenue</h3>
								</div>
								<p className="text-4xl font-bold text-green-900 dark:text-green-100">
									{formatCurrency(dailyReportData.summary.totalRevenue)}
								</p>
								<p className="text-sm text-green-600 dark:text-green-400 mt-2">
									Tax: {formatCurrency(dailyReportData.summary.totalTax)}
									{(dailyReportData.summary.advancePaymentsTotal ?? 0) > 0 && (
										<span className="block mt-1">
											Includes {formatCurrency(dailyReportData.summary.advancePaymentsTotal!)} from advance payments
										</span>
									)}
									{(dailyReportData.summary.invoiceRefundsTotal ?? 0) > 0 && (
										<span className="block mt-1 text-orange-600 dark:text-orange-400">
											Refunds issued: {formatCurrency(dailyReportData.summary.invoiceRefundsTotal!)}
										</span>
									)}
								</p>
							</div>
							<div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-800">
										<Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
									</div>
									<h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">Pre-Tax Total</h3>
								</div>
								<p className="text-4xl font-bold text-purple-900 dark:text-purple-100">
									{formatCurrency(dailyReportData.summary.totalSubtotal)}
								</p>
							</div>
						</div>

						{/* Payment Method Breakdown */}
						{dailyReportData.paymentMethods.length > 0 && (
							<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
								<h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
									<Receipt className="h-5 w-5 text-blue-500" />
									Payment Method Breakdown
								</h3>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-slate-50 dark:bg-slate-900/50">
											<tr>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Method</th>
												<th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Transactions</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">% of Total</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border">
											{dailyReportData.paymentMethods.map((pm) => (
												<tr key={pm.method} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
													<td className="px-4 py-3 text-sm font-medium text-foreground">
														{pm.label}
													</td>
													<td className="px-4 py-3 text-sm text-center text-muted-foreground">
														{pm.count}
													</td>
													<td className="px-4 py-3 text-sm text-right font-medium text-foreground">
														{formatCurrency(pm.amount)}
													</td>
													<td className="px-4 py-3 text-sm text-right text-muted-foreground">
														{formatPercent(pm.percentage)}
													</td>
												</tr>
											))}
										</tbody>
										<tfoot className="bg-slate-100 dark:bg-slate-800">
											<tr>
												<td className="px-4 py-3 text-sm font-bold text-foreground">Total</td>
												<td className="px-4 py-3 text-sm text-center font-medium text-foreground">
													{dailyReportData.paymentMethods.reduce((sum, pm) => sum + pm.count, 0)}
												</td>
												<td className="px-4 py-3 text-sm text-right font-bold text-foreground">
													{formatCurrency(dailyReportData.paymentMethods.reduce((sum, pm) => sum + pm.amount, 0))}
												</td>
												<td className="px-4 py-3 text-sm text-right font-medium text-foreground">
													100%
												</td>
											</tr>
										</tfoot>
									</table>
								</div>
							</div>
						)}

						{/* Payments Received */}
						{dailyReportData.paymentsToday.length > 0 && (
							<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
								<h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
									<Receipt className="h-5 w-5 text-green-500" />
									Payments Received
								</h3>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-slate-50 dark:bg-slate-900/50">
											<tr>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicle</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Payments Today</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border">
											{dailyReportData.paymentsToday.map((row, idx) => (
												<tr
													key={`${row.invoice_id}-${idx}`}
													className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${row.work_order_id ? 'cursor-pointer' : ''}`}
													onClick={() => row.work_order_id && setSelectedWorkOrderId(row.work_order_id)}
												>
													<td className="px-4 py-3 text-sm">
														<div className="font-medium text-foreground">{row.description}</div>
														<div className="text-xs text-muted-foreground mt-0.5">{row.license_plate || '—'}</div>
													</td>
													<td className="px-4 py-3 text-sm text-muted-foreground">
														{row.customer_name}
													</td>
													<td className="px-4 py-3 text-sm">
														<button
															className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs"
															onClick={(e) => { e.stopPropagation(); setSelectedInvoiceId(row.invoice_number); }}
														>
															{row.invoice_number || 'View Invoice'}
														</button>
														<div className="text-xs text-muted-foreground mt-0.5">
															Total: {formatCurrency(row.invoice_total)}
														</div>
													</td>
													<td className="px-4 py-3 text-sm">
														<InvoiceStatusBadge status={row.invoice_status} />
													</td>
													<td className="px-4 py-3 text-sm">
														<div className="space-y-1">
															{row.payments.map((p, i) => (
																<div key={i} className="flex items-center gap-2 text-xs">
																	<span className="font-medium text-foreground">{formatCurrency(p.amount)}</span>
																	<span className="text-muted-foreground">{formatPaymentMethodLabel(p.payment_method)}</span>
																</div>
															))}
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* No data message */}
						{dailyReportData.paymentsToday.length === 0 && (
							<div className="bg-white dark:bg-card border border-border rounded-xl p-12 text-center">
								<Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-foreground mb-2">No payments received</h3>
								<p className="text-muted-foreground">
									There are no payments recorded for {formatDateOnly(selectedDate)}.
								</p>
							</div>
						)}
					</div>
				) : (
					<div className="bg-white dark:bg-card border border-border rounded-xl p-12 text-center">
						<p className="text-muted-foreground">Unable to load daily report. Please try again.</p>
					</div>
				)}

				{/* Invoice Quick View Modal */}
				{selectedInvoiceId && (
					<InvoiceQuickView
						invoiceId={selectedInvoiceId}
						isOpen={!!selectedInvoiceId}
						onClose={() => setSelectedInvoiceId(null)}
					/>
				)}

				{/* Work Order Quick View Modal */}
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
