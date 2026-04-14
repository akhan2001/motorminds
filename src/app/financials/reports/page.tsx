"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Nav } from '@/components/navigation/nav';
import { Loader2, Download, CheckCircle2, Undo2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { dateRangePresets } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';
import { getTorontoDateString } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import { checkUser } from '@/utils/supabase/supabase-auth';
import { getShopId } from '@/utils/supabase/supabase-shop';
import { ExpenseDetailDialog } from '@/app/(features)/expenses/components/ExpenseDetailDialog';
import type { ExpenseItem } from '@/app/(features)/expenses/types/expenses';
import { WorkOrderQuickView } from '@/components/shared/quick-view/WorkOrderQuickView';

import BreadcrumbNav from './components/BreadcrumbNav';
import { DateRangeCard } from './components/DateRangeCard';
import { SummaryCards } from './components/SummaryCards';
import { AllExpensesTable } from './components/AllExpensesTable';
import { GeneralExpensesTable } from './components/GeneralExpensesTable';
import { WorkOrderExpensesTable } from './components/WorkOrderExpensesTable';
import { PartsExpensesTable } from './components/PartsExpensesTable';
import { CreditsRefundsTable } from './components/CreditsRefundsTable';

import type {
	ExpenseReportData,
	GeneralExpense,
	WorkOrderExpense,
	AllExpenseRow,
} from './types';
import { formatDate } from './utils';

// ─────────────────────────────────────────────────────────────────────────────

const ReportsPage = () => {
	const [shopId, setShopId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isFetchingData, setIsFetchingData] = useState(false);
	const [reportData, setReportData] = useState<ExpenseReportData | null>(null);
	const [activeTab, setActiveTab] = useState<'all' | 'general' | 'work_order' | 'parts' | 'credits'>('all');
	const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
	const [isWorkOrderQuickViewOpen, setIsWorkOrderQuickViewOpen] = useState(false);
	const router = useRouter();

	const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
		const to = new Date();
		const from = new Date(to.getFullYear(), to.getMonth(), 1);
		return { from, to };
	});

	// ── Auth ──────────────────────────────────────────────────────────────────
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
			} catch {
				router.push('/login');
			} finally {
				setIsLoading(false);
			}
		}
		fetchUserData();
	}, [router]);

	// ── Data fetch ────────────────────────────────────────────────────────────
	const fetchExpenseData = useCallback(async () => {
		if (!shopId || !dateRange?.from || !dateRange?.to) {
			setReportData(null);
			return;
		}
		setIsFetchingData(true);
		try {
			const res = await fetch(
				`/api/financials/reports/expenses?startDate=${getTorontoDateString(dateRange.from)}&endDate=${getTorontoDateString(dateRange.to)}&shopId=${shopId}`
			);
			if (!res.ok) throw new Error('Failed to fetch');
			setReportData(await res.json());
		} catch {
			setReportData(null);
		} finally {
			setIsFetchingData(false);
		}
	}, [shopId, dateRange]);

	useEffect(() => {
		if (shopId && dateRange?.from && dateRange?.to) fetchExpenseData();
	}, [shopId, dateRange, fetchExpenseData]);

	// ── Handlers ──────────────────────────────────────────────────────────────
	const openExpenseDetail = (expense: GeneralExpense | WorkOrderExpense) => {
		const item: ExpenseItem = {
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
		setSelectedExpense(item);
		setIsDetailDialogOpen(true);
	};

	// ── CSV Export ────────────────────────────────────────────────────────────
	const handleExportCSV = () => {
		if (!reportData) return;

		const rows: string[][] = [];
		rows.push(['EXPENSE REPORT']);
		rows.push([`Period: ${formatDate(reportData.startDate)} to ${formatDate(reportData.endDate)}`]);
		rows.push([]);

		rows.push(['GENERAL EXPENSES']);
		rows.push(['Date', 'Vendor', 'Description', 'Invoice #', 'Amount', 'Tax', 'Category', 'Refund Amount', 'Net Amount']);
		reportData.generalExpenses.forEach((e) => {
			const refund = e.refund_amount || 0;
			rows.push([
				formatDate(e.date), e.vendor, e.description, e.invoice_number,
				e.amount.toFixed(2), e.tax.toFixed(2), e.category,
				refund > 0 ? refund.toFixed(2) : '',
				refund > 0 ? Math.max(0, e.amount - refund).toFixed(2) : e.amount.toFixed(2),
			]);
		});
		rows.push(['', '', '', 'TOTAL', reportData.summary.generalExpenses.total.toFixed(2), reportData.summary.generalExpenses.tax.toFixed(2), '']);
		rows.push([]);

		rows.push(['WORK ORDER EXPENSES']);
		rows.push(['Date', 'Vendor', 'Description', 'Invoice #', 'Amount', 'Tax', 'Work Order', 'Vehicle', 'Refund Amount', 'Net Amount']);
		reportData.workOrderExpenses.forEach((e) => {
			const refund = e.refund_amount || 0;
			rows.push([
				formatDate(e.date), e.vendor, e.description, e.invoice_number,
				e.amount.toFixed(2), e.tax.toFixed(2), e.work_order_title, e.vehicle || '',
				refund > 0 ? refund.toFixed(2) : '',
				refund > 0 ? Math.max(0, e.amount - refund).toFixed(2) : e.amount.toFixed(2),
			]);
		});
		rows.push(['', '', '', 'TOTAL', reportData.summary.workOrderExpenses.total.toFixed(2), reportData.summary.workOrderExpenses.tax.toFixed(2), '', '']);
		rows.push([]);

		rows.push(['PARTS COSTS (COGS)']);
		rows.push(['Date', 'Part', 'Part #', 'Supplier', 'Qty', 'Unit Cost', 'Total Cost', 'Sale Price', 'Profit']);
		reportData.partsExpenses.forEach((e) => {
			rows.push([
				formatDate(e.date), e.description, e.part_number, e.supplier,
				e.quantity.toString(), e.unit_cost.toFixed(2), e.total_cost.toFixed(2),
				e.sale_price.toFixed(2), e.profit.toFixed(2),
			]);
		});
		rows.push(['', '', '', '', '', 'TOTAL', reportData.summary.partsExpenses.totalCost.toFixed(2), '', reportData.summary.partsExpenses.totalProfit.toFixed(2)]);
		rows.push([]);

		if (reportData.creditsRefunds && reportData.creditsRefunds.length > 0) {
			rows.push(['CREDITS & REFUNDS']);
			rows.push(['Date', 'Supplier', 'Reason', 'Amount', 'Status']);
			reportData.creditsRefunds.forEach((cr) => {
				rows.push([formatDate(cr.refund_date), cr.supplier, cr.reason, cr.amount.toFixed(2), cr.status]);
			});
			rows.push(['', '', 'TOTAL', (reportData.summary.creditsRefunds?.total ?? 0).toFixed(2), '']);
			rows.push([]);
		}

		rows.push(['SUMMARY']);
		rows.push(['General Expenses', reportData.summary.generalExpenses.total.toFixed(2)]);
		rows.push(['Work Order Expenses', reportData.summary.workOrderExpenses.total.toFixed(2)]);
		rows.push(['Parts Costs', reportData.summary.partsExpenses.totalCost.toFixed(2)]);
		rows.push(['GRAND TOTAL', reportData.summary.grandTotal.toFixed(2)]);
		if (reportData.summary.creditsRefunds && reportData.summary.creditsRefunds.total > 0) {
			rows.push(['Credits & Refunds', `-${reportData.summary.creditsRefunds.total.toFixed(2)}`]);
			rows.push(['NET EXPENSES', (reportData.summary.netExpenses ?? reportData.summary.grandTotal).toFixed(2)]);
		}

		const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `Expense_Report_${dateRange?.from ? getTorontoDateString(dateRange.from) : ''}_to_${dateRange?.to ? getTorontoDateString(dateRange.to) : ''}.csv`;
		link.click();
	};

	// ── Computed ──────────────────────────────────────────────────────────────
	const allExpenses: AllExpenseRow[] = reportData
		? [
			...reportData.generalExpenses.map((e) => ({ ...e, _tab: 'general' as const })),
			...reportData.workOrderExpenses.map((e) => ({ ...e, _tab: 'work_order' as const })),
			...reportData.partsExpenses.map((e) => ({ ...e, _tab: 'parts' as const })),
			...(reportData.creditsRefunds ?? []).map((e) => ({ ...e, _tab: 'credits' as const })),
		  ].sort((a, b) => {
			const dateA = a._tab === 'credits' ? (a as any).refund_date : (a as any).date;
			const dateB = b._tab === 'credits' ? (b as any).refund_date : (b as any).date;
			return dateB.localeCompare(dateA);
		  })
		: [];

	const netTotal = reportData ? (reportData.summary.netExpenses ?? reportData.summary.grandTotal) : 0;

	// ── Loading ───────────────────────────────────────────────────────────────
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

	// ── Tab config ────────────────────────────────────────────────────────────
	const tabs = [
		{ key: 'all' as const, label: `All Expenses (${allExpenses.length})` },
		{ key: 'general' as const, label: `General Expenses (${reportData?.generalExpenses.length ?? 0})` },
		{ key: 'work_order' as const, label: `Work Order Expenses (${reportData?.workOrderExpenses.length ?? 0})` },
		{ key: 'parts' as const, label: `Parts Costs (${reportData?.partsExpenses.length ?? 0})` },
		{ key: 'credits' as const, label: `Credits & Refunds (${reportData?.creditsRefunds?.length ?? 0})` },
	];

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
					<DateRangeCard
						dateRange={dateRange}
						onDateRangeChange={setDateRange}
						onPresetClick={(p) => setDateRange(p.getValue())}
					/>

					{dateRange?.from && dateRange?.to && (
						<>
							{isFetchingData ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
									<span className="text-muted-foreground">Loading expense data...</span>
								</div>
							) : reportData ? (
								<>
									<SummaryCards summary={reportData.summary} />

									{/* Tabbed Tables */}
									<Card className="bg-white dark:bg-card border-border">
										<CardHeader className="pb-2">
											<div className="flex gap-1 border-b border-border overflow-x-auto">
												{tabs.map((tab) => (
													<button
														key={tab.key}
														onClick={() => setActiveTab(tab.key)}
														className={cn(
															'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
															activeTab === tab.key
																? 'border-blue-500 text-blue-600'
																: 'border-transparent text-muted-foreground hover:text-foreground'
														)}
													>
														{tab.label}
													</button>
												))}
											</div>
										</CardHeader>
										<CardContent className="pt-4">
											{activeTab === 'all' && (
												<AllExpensesTable
													expenses={allExpenses}
													netTotal={netTotal}
													onExpenseClick={openExpenseDetail}
												/>
											)}
											{activeTab === 'general' && (
												<GeneralExpensesTable
													expenses={reportData.generalExpenses}
													summary={reportData.summary.generalExpenses}
													onExpenseClick={openExpenseDetail}
												/>
											)}
											{activeTab === 'work_order' && (
												<WorkOrderExpensesTable
													expenses={reportData.workOrderExpenses}
													summary={reportData.summary.workOrderExpenses}
													onExpenseClick={openExpenseDetail}
												/>
											)}
											{activeTab === 'parts' && (
												<PartsExpensesTable
													expenses={reportData.partsExpenses}
													summary={reportData.summary.partsExpenses}
												/>
											)}
											{activeTab === 'credits' && (
												<CreditsRefundsTable
													items={reportData.creditsRefunds ?? []}
													summary={reportData.summary.creditsRefunds}
												/>
											)}
										</CardContent>
									</Card>

									{/* Legend */}
									<div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-sm text-muted-foreground">
										<h3 className="font-medium text-foreground mb-2">Understanding the Status</h3>
										<div className="flex flex-wrap gap-4">
											<div className="flex items-center gap-2">
												<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
													<CheckCircle2 className="h-3 w-3 mr-1" />Paid
												</Badge>
												<span>Expense paid to the vendor — default state</span>
											</div>
											<div className="flex items-center gap-2">
												<Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
													<Undo2 className="h-3 w-3 mr-1" />Refunded
												</Badge>
												<span>Expense was returned, credited, or refunded</span>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="text-muted-foreground">Void</Badge>
												<span>Expense written off, reassigned, or moved to inventory</span>
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
