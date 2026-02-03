"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Nav } from '@/components/navigation/nav';
import BreadcrumbNav from './components/BreadcrumbNav';
import { checkUser } from '@/utils/supabase/supabase-auth';
import { getShopId } from '@/utils/supabase/supabase-shop';
import { dateRangePresets } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
	FileText, 
	Download, 
	Calendar, 
	DollarSign, 
	Loader2, 
	Receipt, 
	Wrench, 
	Package, 
	CheckCircle2, 
	Clock,
	Car,
	Undo2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTorontoDateString } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import { ExpenseDetailDialog } from '@/app/(features)/expenses/components/ExpenseDetailDialog';
import type { ExpenseItem } from '@/app/(features)/expenses/types/expenses';
import { WorkOrderQuickView } from '@/components/shared/quick-view/WorkOrderQuickView';

interface ExpenseReportData {
	generalExpenses: GeneralExpense[];
	workOrderExpenses: WorkOrderExpense[];
	partsExpenses: PartsExpense[];
	summary: {
		generalExpenses: {
			count: number;
			total: number;
			tax: number;
		};
		workOrderExpenses: {
			count: number;
			total: number;
			tax: number;
			paidCount: number;
			paidTotal: number;
		};
		partsExpenses: {
			count: number;
			totalCost: number;
			paidCount: number;
			paidTotalCost: number;
			totalProfit: number;
		};
		grandTotal: number;
	};
	startDate: string;
	endDate: string;
}

interface GeneralExpense {
	id: string;
	type: 'general_expense';
	source_type: 'general' | 'invoice';
	description: string;
	vendor: string;
	invoice_number: string;
	date: string;
	amount: number;
	tax: number;
	category: string;
	payment_method: string;
	notes: string;
	has_invoice: boolean;
	is_paid: boolean;
	refund_amount: number | null;
	resolution_type: string | null;
	invoice_id: string | null;
}

interface WorkOrderExpense {
	id: string;
	type: 'work_order_expense';
	description: string;
	vendor: string;
	invoice_number: string;
	date: string;
	amount: number;
	tax: number;
	payment_method: string;
	work_order_id: string;
	work_order_title: string;
	work_order_status: string;
	vehicle: string | null;
	license_plate: string | null;
	has_invoice: boolean;
	is_paid: boolean;
	refund_amount: number | null;
	resolution_type: string | null;
}

interface PartsExpense {
	id: string;
	type: 'parts_cost';
	description: string;
	part_number: string;
	supplier: string;
	date: string;
	quantity: number;
	unit_cost: number;
	total_cost: number;
	sale_price: number;
	profit: number;
	work_order_id: string;
	work_order_title: string;
	work_order_status: string;
	vehicle: string | null;
	license_plate: string | null;
	has_invoice: boolean;
	is_paid: boolean;
}

const formatDate = (dateString: string): string => {
	// Handle date-only strings (YYYY-MM-DD) to avoid timezone issues
	// Date-only strings are treated as UTC by JavaScript, which causes off-by-one day issues in EST
	if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
		// Parse as local date by appending time
		const [year, month, day] = dateString.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString('en-CA', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	// For full datetime strings, display in local timezone
	return new Date(dateString).toLocaleDateString('en-CA', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
};

const SummaryCard = ({ 
	title, 
	count, 
	total, 
	icon: Icon, 
	subtext,
	className 
}: { 
	title: string; 
	count: number;
	total: number;
	icon: React.ElementType;
	subtext?: string;
	className?: string;
}) => (
	<Card className={cn("bg-white dark:bg-card border-border", className)}>
		<CardContent className="p-4">
			<div className="flex items-start gap-3">
				<div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
					<Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm text-muted-foreground truncate">{title}</p>
					<p className="text-xl font-bold text-foreground">{formatCurrency(total)}</p>
					<p className="text-xs text-muted-foreground">{count} expense{count !== 1 ? 's' : ''}{subtext ? ` • ${subtext}` : ''}</p>
				</div>
			</div>
		</CardContent>
	</Card>
);

const ReportsPage = () => {
	const [shopId, setShopId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isFetchingData, setIsFetchingData] = useState(false);
	const [reportData, setReportData] = useState<ExpenseReportData | null>(null);
	const [activeTab, setActiveTab] = useState<'general' | 'work_order' | 'parts'>('general');
	const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
	const [isWorkOrderQuickViewOpen, setIsWorkOrderQuickViewOpen] = useState(false);
	const router = useRouter();

	// Convert report expense to ExpenseItem format for the dialog
	const openExpenseDetail = (expense: GeneralExpense | WorkOrderExpense) => {
		const expenseItem: ExpenseItem = {
			id: expense.id,
			shop_id: shopId || '',
			work_order_id: 'work_order_id' in expense ? expense.work_order_id : null,
			invoice_id: null,
			source_type: expense.type === 'general_expense' ? 'general' : 'work_order',
			description: expense.description,
			category: 'category' in expense ? expense.category : '',
			subtotal: expense.amount - expense.tax,
			tax_amount: expense.tax,
			tax_rate: 0.13,
			tax_included: true,
			total: expense.amount,
			vendor: expense.vendor,
			invoice_number: expense.invoice_number,
			payment_method: expense.payment_method,
			parts_description: null,
			expense_date: expense.date,
			warranty_period: null,
			notes: 'notes' in expense ? expense.notes : null,
			receipt_url: null,
			is_billable: false,
			created_at: expense.date,
			updated_at: expense.date,
			archived: false,
			archived_at: null,
			resolution_type: (expense.resolution_type || null) as ExpenseItem['resolution_type'],
			resolution_note: null,
			resolved_at: null,
			original_work_order_id: null,
			refund_amount: expense.refund_amount || null,
		};
		setSelectedExpense(expenseItem);
		setIsDetailDialogOpen(true);
	};

	// Default to current month
	const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
		const to = new Date();
		const from = new Date(to.getFullYear(), to.getMonth(), 1);
		return { from, to };
	});

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

	const fetchExpenseData = useCallback(async () => {
		if (!shopId || !dateRange?.from || !dateRange?.to) {
			setReportData(null);
			return;
		}

		setIsFetchingData(true);
		try {
			const response = await fetch(
				`/api/financials/reports/expenses?startDate=${getTorontoDateString(dateRange.from)}&endDate=${getTorontoDateString(dateRange.to)}&shopId=${shopId}`
			);
			if (!response.ok) {
				throw new Error('Failed to fetch expense data');
			}
			const data = await response.json();
			setReportData(data);
		} catch (error) {
			console.error('Error fetching expense data:', error);
			setReportData(null);
		} finally {
			setIsFetchingData(false);
		}
	}, [shopId, dateRange]);

	// Fetch data when date range or shop changes
	useEffect(() => {
		if (shopId && dateRange?.from && dateRange?.to) {
			fetchExpenseData();
		}
	}, [shopId, dateRange, fetchExpenseData]);

	const handlePresetClick = (preset: typeof dateRangePresets[0]) => {
		setDateRange(preset.getValue());
	};

	const handleDateRangeChange = (range: DateRange | undefined) => {
		setDateRange(range);
	};

	const handleExportCSV = () => {
		if (!reportData) return;

		const rows: string[][] = [];
		rows.push(['EXPENSE REPORT']);
		rows.push([`Period: ${formatDate(reportData.startDate)} to ${formatDate(reportData.endDate)}`]);
		rows.push([]);

		// General Expenses
		rows.push(['GENERAL EXPENSES']);
		rows.push(['Date', 'Vendor', 'Description', 'Invoice #', 'Amount', 'Tax', 'Category', 'Refund Amount', 'Net Amount']);
		reportData.generalExpenses.forEach(e => {
			const refund = e.refund_amount || 0;
			const netAmount = Math.max(0, e.amount - refund);
			rows.push([
				formatDate(e.date),
				e.vendor,
				e.description,
				e.invoice_number,
				e.amount.toFixed(2),
				e.tax.toFixed(2),
				e.category,
				refund > 0 ? refund.toFixed(2) : '',
				refund > 0 ? netAmount.toFixed(2) : e.amount.toFixed(2)
			]);
		});
		rows.push(['', '', '', 'TOTAL', reportData.summary.generalExpenses.total.toFixed(2), reportData.summary.generalExpenses.tax.toFixed(2), '']);
		rows.push([]);

		// Work Order Expenses
		rows.push(['WORK ORDER EXPENSES']);
		rows.push(['Date', 'Vendor', 'Description', 'Invoice #', 'Amount', 'Tax', 'Work Order', 'Vehicle', 'Paid', 'Refund Amount', 'Net Amount']);
		reportData.workOrderExpenses.forEach(e => {
			const refund = e.refund_amount || 0;
			const netAmount = Math.max(0, e.amount - refund);
			rows.push([
				formatDate(e.date),
				e.vendor,
				e.description,
				e.invoice_number,
				e.amount.toFixed(2),
				e.tax.toFixed(2),
				e.work_order_title,
				e.vehicle || '',
				e.is_paid ? 'Yes' : 'No',
				refund > 0 ? refund.toFixed(2) : '',
				refund > 0 ? netAmount.toFixed(2) : e.amount.toFixed(2)
			]);
		});
		rows.push(['', '', '', 'TOTAL', reportData.summary.workOrderExpenses.total.toFixed(2), reportData.summary.workOrderExpenses.tax.toFixed(2), '', '', '']);
		rows.push([]);

		// Parts Expenses
		rows.push(['PARTS COSTS (COGS)']);
		rows.push(['Date', 'Part', 'Part #', 'Supplier', 'Qty', 'Unit Cost', 'Total Cost', 'Sale Price', 'Profit', 'Paid']);
		reportData.partsExpenses.forEach(e => {
			rows.push([
				formatDate(e.date),
				e.description,
				e.part_number,
				e.supplier,
				e.quantity.toString(),
				e.unit_cost.toFixed(2),
				e.total_cost.toFixed(2),
				e.sale_price.toFixed(2),
				e.profit.toFixed(2),
				e.is_paid ? 'Yes' : 'No'
			]);
		});
		rows.push(['', '', '', '', '', 'TOTAL', reportData.summary.partsExpenses.totalCost.toFixed(2), '', reportData.summary.partsExpenses.totalProfit.toFixed(2), '']);
		rows.push([]);

		// Summary
		rows.push(['SUMMARY']);
		rows.push(['General Expenses', reportData.summary.generalExpenses.total.toFixed(2)]);
		rows.push(['Work Order Expenses', reportData.summary.workOrderExpenses.total.toFixed(2)]);
		rows.push(['Parts Costs', reportData.summary.partsExpenses.totalCost.toFixed(2)]);
		rows.push(['GRAND TOTAL', reportData.summary.grandTotal.toFixed(2)]);

		const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `Expense_Report_${dateRange?.from ? getTorontoDateString(dateRange.from) : ''}_to_${dateRange?.to ? getTorontoDateString(dateRange.to) : ''}.csv`;
		link.click();
	};

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
						<h1 className="text-3xl font-bold text-foreground mb-2">Expense Reports</h1>
						<p className="text-muted-foreground">Track and review all your shop expenses.</p>
					</div>
					{reportData && (
						<Button onClick={handleExportCSV} variant="outline">
							<Download className="h-4 w-4 mr-2" />
							Export CSV
						</Button>
					)}
				</div>
				
				<div className="grid gap-6">
					{/* Date Range Selection Card */}
					<Card className="bg-white dark:bg-card border-border">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-lg">
								<Calendar className="h-5 w-5 text-blue-500" />
								Select Report Period
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Date Range Inputs */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="text-sm text-muted-foreground mb-2 block">From Date</label>
									<Input
										type="date"
										value={dateRange?.from ? getTorontoDateString(dateRange.from) : ''}
										onChange={(e) => {
											const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
											handleDateRangeChange({
												from: date,
												to: dateRange?.to
											});
										}}
										className="bg-white dark:bg-background border-border text-foreground"
									/>
								</div>
								<div>
									<label className="text-sm text-muted-foreground mb-2 block">To Date</label>
									<Input
										type="date"
										value={dateRange?.to ? getTorontoDateString(dateRange.to) : ''}
										onChange={(e) => {
											const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
											handleDateRangeChange({
												from: dateRange?.from,
												to: date
											});
										}}
										min={dateRange?.from ? getTorontoDateString(dateRange.from) : undefined}
										className="bg-white dark:bg-background border-border text-foreground"
									/>
								</div>
							</div>

							{/* Quick Presets */}
							<div>
								<label className="text-sm text-muted-foreground mb-2 block">Quick Select</label>
								<div className="flex flex-wrap gap-2">
									{dateRangePresets.map((preset) => (
										<Button
											key={preset.label}
											variant="outline"
											size="sm"
											onClick={() => handlePresetClick(preset)}
											className="bg-white dark:bg-background border-border text-foreground hover:bg-muted"
										>
											{preset.label}
										</Button>
									))}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Report Content */}
					{dateRange?.from && dateRange?.to && (
						<>
							{isFetchingData ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
									<span className="text-muted-foreground">Loading expense data...</span>
								</div>
							) : reportData ? (
								<>
									{/* Summary Cards */}
									<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
										<SummaryCard
											title="General Expenses"
											count={reportData.summary.generalExpenses.count}
											total={reportData.summary.generalExpenses.total}
											icon={Receipt}
											subtext={`+${formatCurrency(reportData.summary.generalExpenses.tax)} tax`}
										/>
										<SummaryCard
											title="Work Order Expenses"
											count={reportData.summary.workOrderExpenses.count}
											total={reportData.summary.workOrderExpenses.total}
											icon={Wrench}
											subtext={`${reportData.summary.workOrderExpenses.paidCount} paid`}
										/>
										<SummaryCard
											title="Parts Costs (COGS)"
											count={reportData.summary.partsExpenses.count}
											total={reportData.summary.partsExpenses.totalCost}
											icon={Package}
											subtext={`${formatCurrency(reportData.summary.partsExpenses.totalProfit)} profit`}
										/>
										<SummaryCard
											title="Total Expenses"
											count={
												reportData.summary.generalExpenses.count +
												reportData.summary.workOrderExpenses.count +
												reportData.summary.partsExpenses.count
											}
											total={reportData.summary.grandTotal}
											icon={DollarSign}
											className="bg-slate-100 dark:bg-slate-800"
										/>
									</div>

									{/* Expense Tables */}
									<Card className="bg-white dark:bg-card border-border">
										<CardHeader className="pb-2">
											{/* Tabs */}
											<div className="flex gap-1 border-b border-border">
												<button
													onClick={() => setActiveTab('general')}
													className={cn(
														"px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
														activeTab === 'general'
															? "border-blue-500 text-blue-600"
															: "border-transparent text-muted-foreground hover:text-foreground"
													)}
												>
													General Expenses ({reportData.generalExpenses.length})
												</button>
												<button
													onClick={() => setActiveTab('work_order')}
													className={cn(
														"px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
														activeTab === 'work_order'
															? "border-blue-500 text-blue-600"
															: "border-transparent text-muted-foreground hover:text-foreground"
													)}
												>
													Work Order Expenses ({reportData.workOrderExpenses.length})
												</button>
												<button
													onClick={() => setActiveTab('parts')}
													className={cn(
														"px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
														activeTab === 'parts'
															? "border-blue-500 text-blue-600"
															: "border-transparent text-muted-foreground hover:text-foreground"
													)}
												>
													Parts Costs ({reportData.partsExpenses.length})
												</button>
											</div>
										</CardHeader>
										<CardContent className="pt-4">
											{/* General Expenses Table */}
											{activeTab === 'general' && (
												<div className="overflow-x-auto">
													{reportData.generalExpenses.length > 0 ? (
														<table className="w-full text-sm">
															<thead>
																<tr className="border-b border-border text-left">
																	<th className="pb-2 font-medium text-muted-foreground">Date</th>
																	<th className="pb-2 font-medium text-muted-foreground">Vendor</th>
																	<th className="pb-2 font-medium text-muted-foreground">Invoice #</th>
																	<th className="pb-2 font-medium text-muted-foreground">Description</th>
																	<th className="pb-2 font-medium text-muted-foreground text-right">Amount</th>
																	<th className="pb-2 font-medium text-muted-foreground text-right">Tax</th>
																	<th className="pb-2 font-medium text-muted-foreground text-center">Status</th>
																</tr>
															</thead>
															<tbody>
																{reportData.generalExpenses.map((expense) => {
																	const isRefunded = (expense.refund_amount && expense.refund_amount > 0) || expense.resolution_type === 'returned';
																	const netAmount = expense.amount - (expense.refund_amount || 0);
																	return (
																		<tr 
																			key={expense.id} 
																			className={cn(
																				"border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors",
																				isRefunded && "bg-red-50/30 dark:bg-red-500/5"
																			)}
																			onClick={() => openExpenseDetail(expense)}
																		>
																			<td className="py-3">{formatDate(expense.date)}</td>
																			<td className="py-3">
																				<div className="flex items-center gap-2">
																					{expense.vendor}
																					{expense.source_type === 'invoice' && (
																						<Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 flex items-center gap-1">
																							<FileText className="h-3 w-3" />
																							Invoice
																						</Badge>
																					)}
																					{isRefunded && (
																						<Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 flex items-center gap-1">
																							<Undo2 className="h-3 w-3" />
																							Refunded
																						</Badge>
																					)}
																				</div>
																			</td>
																			<td className="py-3 text-muted-foreground">{expense.invoice_number || '-'}</td>
																			<td className="py-3">{expense.description}</td>
																			<td className="py-3 text-right">
																				<div className="flex flex-col items-end">
																					<span className={cn("font-medium", isRefunded && "line-through text-muted-foreground")}>
																						{formatCurrency(expense.amount)}
																					</span>
																					{isRefunded && expense.refund_amount && expense.refund_amount > 0 && (
																						<span className="text-xs text-green-600 dark:text-green-400">
																							Net: {formatCurrency(Math.max(0, netAmount))}
																						</span>
																					)}
																				</div>
																			</td>
																			<td className="py-3 text-right text-muted-foreground">{formatCurrency(expense.tax)}</td>
																			<td className="py-3 text-center">
																				{isRefunded ? (
																					<Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 flex items-center gap-1">
																						<Undo2 className="h-3 w-3" />
																						Refunded
																					</Badge>
																				) : expense.is_paid ? (
																					<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
																						<CheckCircle2 className="h-3 w-3 mr-1" />
																						Paid
																					</Badge>
																				) : expense.has_invoice ? (
																					<Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
																						<Clock className="h-3 w-3 mr-1" />
																						Invoiced
																					</Badge>
																				) : (
																					<Badge variant="outline" className="text-muted-foreground">
																						<Clock className="h-3 w-3 mr-1" />
																						Pending
																					</Badge>
																				)}
																			</td>
																		</tr>
																	);
																})}
															</tbody>
															<tfoot>
																<tr className="font-medium">
																	<td colSpan={4} className="pt-3 text-right">Total:</td>
																	<td className="pt-3 text-right">{formatCurrency(reportData.summary.generalExpenses.total)}</td>
																	<td className="pt-3 text-right text-muted-foreground">{formatCurrency(reportData.summary.generalExpenses.tax)}</td>
																	<td></td>
																</tr>
															</tfoot>
														</table>
													) : (
														<p className="text-center py-8 text-muted-foreground">No general expenses in this period.</p>
													)}
												</div>
											)}

											{/* Work Order Expenses Table */}
											{activeTab === 'work_order' && (
												<div className="overflow-x-auto">
													{reportData.workOrderExpenses.length > 0 ? (
														<table className="w-full text-sm">
															<thead>
																<tr className="border-b border-border text-left">
																	<th className="pb-2 font-medium text-muted-foreground">Date</th>
																	<th className="pb-2 font-medium text-muted-foreground">Vendor</th>
																	<th className="pb-2 font-medium text-muted-foreground">Description</th>
																	<th className="pb-2 font-medium text-muted-foreground">Work Order</th>
																	<th className="pb-2 font-medium text-muted-foreground">Vehicle</th>
																	<th className="pb-2 font-medium text-muted-foreground text-right">Amount</th>
																	<th className="pb-2 font-medium text-muted-foreground text-center">Status</th>
																</tr>
															</thead>
															<tbody>
																{reportData.workOrderExpenses.map((expense) => {
																	const isRefunded = (expense.refund_amount && expense.refund_amount > 0) || expense.resolution_type === 'returned';
																	const netAmount = expense.amount - (expense.refund_amount || 0);
																	return (
																		<tr 
																			key={expense.id} 
																			className={cn(
																				"border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors",
																				isRefunded && "bg-red-50/30 dark:bg-red-500/5"
																			)}
																			onClick={() => openExpenseDetail(expense)}
																		>
																		<td className="py-3">{formatDate(expense.date)}</td>
																		<td className="py-3">
																			<div className="flex items-center gap-2">
																				{expense.vendor}
																			</div>
																		</td>
																		<td className="py-3">{expense.description}</td>
																		<td className="py-3 text-muted-foreground">{expense.work_order_title}</td>
																		<td className="py-3">
																			{expense.vehicle && (
																				<div className="flex items-center gap-1">
																					<Car className="h-3 w-3 text-muted-foreground" />
																					<span className="text-xs">{expense.vehicle}</span>
																				</div>
																			)}
																		</td>
																		<td className="py-3 text-right">
																			<div className="flex flex-col items-end">
																				<span className={cn("font-medium", isRefunded && "line-through text-muted-foreground")}>
																					{formatCurrency(expense.amount)}
																				</span>
																				{isRefunded && expense.refund_amount && expense.refund_amount > 0 && (
																					<span className="text-xs text-green-600 dark:text-green-400">
																						Net: {formatCurrency(Math.max(0, netAmount))}
																					</span>
																				)}
																			</div>
																		</td>
																		<td className="py-3 text-center">
																			{isRefunded ? (
																				<Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 flex items-center gap-1">
																					<Undo2 className="h-3 w-3" />
																					Refunded
																				</Badge>
																			) : expense.is_paid ? (
																				<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
																					<CheckCircle2 className="h-3 w-3 mr-1" />
																					Paid
																				</Badge>
																			) : expense.has_invoice ? (
																				<Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
																					<Clock className="h-3 w-3 mr-1" />
																					Invoiced
																				</Badge>
																			) : (
																				<Badge variant="outline" className="text-muted-foreground">
																					<Clock className="h-3 w-3 mr-1" />
																					Pending
																				</Badge>
																			)}
																		</td>
																	</tr>
																	);
																})}
															</tbody>
															<tfoot>
																<tr className="font-medium">
																	<td colSpan={5} className="pt-3 text-right">Total:</td>
																	<td className="pt-3 text-right">{formatCurrency(reportData.summary.workOrderExpenses.total)}</td>
																	<td></td>
																</tr>
															</tfoot>
														</table>
													) : (
														<p className="text-center py-8 text-muted-foreground">No work order expenses in this period.</p>
													)}
												</div>
											)}

											{/* Parts Costs Table */}
											{activeTab === 'parts' && (
												<div className="overflow-x-auto">
													{reportData.partsExpenses.length > 0 ? (
														<table className="w-full text-sm">
															<thead>
																<tr className="border-b border-border text-left">
																	<th className="pb-2 font-medium text-muted-foreground">Date</th>
																	<th className="pb-2 font-medium text-muted-foreground">Part</th>
																	<th className="pb-2 font-medium text-muted-foreground">Supplier</th>
																	<th className="pb-2 font-medium text-muted-foreground text-center">Qty</th>
																	<th className="pb-2 font-medium text-muted-foreground text-right">Unit Cost</th>
																	<th className="pb-2 font-medium text-muted-foreground text-right">Total Cost</th>
																	<th className="pb-2 font-medium text-muted-foreground text-right">Sale Price</th>
																	<th className="pb-2 font-medium text-muted-foreground text-right">Profit</th>
																	<th className="pb-2 font-medium text-muted-foreground text-center">Status</th>
																</tr>
															</thead>
															<tbody>
																{reportData.partsExpenses.map((part) => (
																	<tr key={part.id} className="border-b border-border/50">
																		<td className="py-3">{formatDate(part.date)}</td>
																		<td className="py-3">
																			<div>{part.description}</div>
																			{part.part_number && (
																				<div className="text-xs text-muted-foreground">#{part.part_number}</div>
																			)}
																		</td>
																		<td className="py-3">{part.supplier}</td>
																		<td className="py-3 text-center">{part.quantity}</td>
																		<td className="py-3 text-right">{formatCurrency(part.unit_cost)}</td>
																		<td className="py-3 text-right font-medium">{formatCurrency(part.total_cost)}</td>
																		<td className="py-3 text-right">{formatCurrency(part.sale_price)}</td>
																		<td className={cn(
																			"py-3 text-right font-medium",
																			part.profit >= 0 ? "text-green-600" : "text-red-600"
																		)}>
																			{formatCurrency(part.profit)}
																		</td>
																		<td className="py-3 text-center">
																			{part.is_paid ? (
																				<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
																					<CheckCircle2 className="h-3 w-3 mr-1" />
																					Paid
																				</Badge>
																			) : part.has_invoice ? (
																				<Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
																					<Clock className="h-3 w-3 mr-1" />
																					Invoiced
																				</Badge>
																			) : (
																				<Badge variant="outline" className="text-muted-foreground">
																					<Clock className="h-3 w-3 mr-1" />
																					Pending
																				</Badge>
																			)}
																		</td>
																	</tr>
																))}
															</tbody>
															<tfoot>
																<tr className="font-medium">
																	<td colSpan={5} className="pt-3 text-right">Total:</td>
																	<td className="pt-3 text-right">{formatCurrency(reportData.summary.partsExpenses.totalCost)}</td>
																	<td></td>
																	<td className={cn(
																		"pt-3 text-right",
																		reportData.summary.partsExpenses.totalProfit >= 0 ? "text-green-600" : "text-red-600"
																	)}>
																		{formatCurrency(reportData.summary.partsExpenses.totalProfit)}
																	</td>
																	<td></td>
																</tr>
															</tfoot>
														</table>
													) : (
														<p className="text-center py-8 text-muted-foreground">No parts costs in this period.</p>
													)}
												</div>
											)}
										</CardContent>
									</Card>

									{/* Legend */}
									<div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-sm text-muted-foreground">
										<h3 className="font-medium text-foreground mb-2">Understanding the Status</h3>
										<div className="flex flex-wrap gap-4">
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 flex items-center gap-1">
													<Undo2 className="h-3 w-3" />
													Refunded
												</Badge>
												<span>Expense has been refunded</span>
											</div>
											<div className="flex items-center gap-2">
												<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
													<CheckCircle2 className="h-3 w-3 mr-1" />
													Paid
												</Badge>
												<span>Invoice has been paid by customer</span>
											</div>
											<div className="flex items-center gap-2">
												<Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
													<Clock className="h-3 w-3 mr-1" />
													Invoiced
												</Badge>
												<span>Invoice generated but not yet paid</span>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="text-muted-foreground">
													<Clock className="h-3 w-3 mr-1" />
													Pending
												</Badge>
												<span>No invoice generated yet</span>
											</div>
										</div>
									</div>
								</>
							) : (
								<div className="flex items-center justify-center py-12">
									<p className="text-muted-foreground">Unable to load expense data. Please try again.</p>
								</div>
							)}
						</>
					)}
				</div>
			</main>

			{/* Expense Detail Dialog */}
			<ExpenseDetailDialog
				expense={selectedExpense}
				isOpen={isDetailDialogOpen}
				onClose={() => {
					setIsDetailDialogOpen(false);
					setSelectedExpense(null);
				}}
				shopId={shopId || ''}
				onViewWorkOrder={(workOrderId) => {
					setSelectedWorkOrderId(workOrderId);
					setIsWorkOrderQuickViewOpen(true);
				}}
			/>

			{/* Work Order Quick View */}
			{selectedWorkOrderId && (
				<WorkOrderQuickView
					workOrderId={selectedWorkOrderId}
					isOpen={isWorkOrderQuickViewOpen}
					onClose={() => {
						setIsWorkOrderQuickViewOpen(false);
						setSelectedWorkOrderId(null);
					}}
				/>
			)}
		</div>
	);
};

export default ReportsPage;
