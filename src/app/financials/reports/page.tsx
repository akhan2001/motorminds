"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Nav } from '@/components/navigation/nav';
import BreadcrumbNav from './components/BreadcrumbNav';
import { generateIncomeStatementPDF } from './components/IncomeStatementPDF';
import { checkUser } from '@/utils/supabase/supabase-auth';
import { getShopId } from '@/utils/supabase/supabase-shop';
import { DateRangePicker, dateRangePresets } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, DollarSign, Loader2, Receipt, Wrench, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncomeStatementPreview {
	totalRevenue: number;
	totalCOGS: number;
	grossProfit: number;
	totalOperatingExpenses: number;
	netProfit: number;
	totalPartsRevenue?: number;
	totalLaborRevenue?: number;
	totalServicesRevenue?: number;
	totalFeesRevenue?: number;
	invoiceCount?: number;
	statementId?: string | null;
}

const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
};

const formatPercent = (value: number): string => {
	return `${value.toFixed(1)}%`;
};

const MetricCard = ({ 
	label, 
	value, 
	subValue, 
	icon: Icon, 
	trend,
	className 
}: { 
	label: string; 
	value: string; 
	subValue?: string; 
	icon: React.ElementType;
	trend?: 'up' | 'down' | 'neutral';
	className?: string;
}) => (
	<div className={cn(
		"bg-white dark:bg-card border border-border rounded-xl p-4 flex items-start gap-3",
		className
	)}>
		<div className={cn(
			"p-2 rounded-lg",
			trend === 'up' ? 'bg-green-100 dark:bg-green-900/30' :
			trend === 'down' ? 'bg-red-100 dark:bg-red-900/30' :
			'bg-slate-100 dark:bg-slate-800'
		)}>
			<Icon className={cn(
				"h-5 w-5",
				trend === 'up' ? 'text-green-600' :
				trend === 'down' ? 'text-red-600' :
				'text-slate-600 dark:text-slate-400'
			)} />
		</div>
		<div className="flex-1 min-w-0">
			<p className="text-sm text-muted-foreground truncate">{label}</p>
			<p className={cn(
				"text-xl font-bold",
				trend === 'up' ? 'text-green-600' :
				trend === 'down' ? 'text-red-600' :
				'text-foreground'
			)}>{value}</p>
			{subValue && (
				<p className="text-xs text-muted-foreground">{subValue}</p>
			)}
		</div>
	</div>
);

const RevenueBreakdownBar = ({ data }: { data: IncomeStatementPreview }) => {
	const total = data.totalRevenue || 1;
	const segments = [
		{ label: 'Labor', value: data.totalLaborRevenue || 0, color: 'bg-blue-500' },
		{ label: 'Parts', value: data.totalPartsRevenue || 0, color: 'bg-green-500' },
		{ label: 'Services', value: data.totalServicesRevenue || 0, color: 'bg-purple-500' },
		{ label: 'Fees', value: data.totalFeesRevenue || 0, color: 'bg-orange-500' },
	].filter(s => s.value > 0);

	if (segments.length === 0) return null;

	return (
		<div className="space-y-2">
			<div className="h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700">
				{segments.map((segment, i) => (
					<div
						key={segment.label}
						className={cn(segment.color, "transition-all")}
						style={{ width: `${(segment.value / total) * 100}%` }}
					/>
				))}
			</div>
			<div className="flex flex-wrap gap-x-4 gap-y-1">
				{segments.map(segment => (
					<div key={segment.label} className="flex items-center gap-1.5 text-xs">
						<div className={cn("w-2.5 h-2.5 rounded-full", segment.color)} />
						<span className="text-muted-foreground">{segment.label}:</span>
						<span className="font-medium">{formatCurrency(segment.value)}</span>
						<span className="text-muted-foreground">({formatPercent((segment.value / total) * 100)})</span>
					</div>
				))}
			</div>
		</div>
	);
};

const ReportsPage = () => {
	const [shopId, setShopId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isFetchingPreview, setIsFetchingPreview] = useState(false);
	const [previewData, setPreviewData] = useState<IncomeStatementPreview | null>(null);
	const [fullData, setFullData] = useState<any>(null);
	const router = useRouter();

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

	const fetchPreviewData = useCallback(async () => {
		if (!shopId || !dateRange?.from || !dateRange?.to) {
			setPreviewData(null);
			return;
		}

		setIsFetchingPreview(true);
		try {
			const response = await fetch(
				`/api/financials/reports/income-statement?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}&shopId=${shopId}`
			);
			if (!response.ok) {
				throw new Error('Failed to fetch income statement data');
			}
			const data = await response.json();
			setPreviewData(data);
			setFullData(data);
		} catch (error) {
			console.error('Error fetching preview:', error);
			setPreviewData(null);
			setFullData(null);
		} finally {
			setIsFetchingPreview(false);
		}
	}, [shopId, dateRange]);

	// Fetch preview when date range or shop changes
	useEffect(() => {
		if (shopId && dateRange?.from && dateRange?.to) {
			fetchPreviewData();
		}
	}, [shopId, dateRange, fetchPreviewData]);

	const handleGenerateReport = async () => {
		if (!shopId || !fullData) {
			alert('Please wait for the preview to load.');
			return;
		}

		setIsGenerating(true);
		try {
			generateIncomeStatementPDF(fullData, shopId, fullData.statementId);
		} catch (error) {
			console.error('Error generating report:', error);
			alert('Failed to generate report. See console for details.');
		} finally {
			setIsGenerating(false);
		}
	};

	const handlePresetClick = (preset: typeof dateRangePresets[0]) => {
		setDateRange(preset.getValue());
	};

	const handleDateRangeChange = (range: DateRange | undefined) => {
		setDateRange(range);
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

	const grossMargin = previewData && previewData.totalRevenue > 0 
		? (previewData.grossProfit / previewData.totalRevenue) * 100 
		: 0;
	const netMargin = previewData && previewData.totalRevenue > 0 
		? (previewData.netProfit / previewData.totalRevenue) * 100 
		: 0;

	return (
		<div className="flex flex-col min-h-screen bg-background text-foreground">
			<Nav />
			<main className="flex-1 p-8 max-w-7xl mx-auto w-full">
				<BreadcrumbNav />
				
				<div className="flex items-center justify-between my-8">
					<div>
						<h1 className="text-3xl font-bold text-foreground mb-2">Financial Reports</h1>
						<p className="text-muted-foreground">Generate and review your shop's financial statements.</p>
					</div>
				</div>
				
				<div className="grid gap-6">
					{/* Date Range Selection Card */}
					<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
						<div className="flex items-center gap-2 mb-4">
							<Calendar className="h-5 w-5 text-blue-500" />
							<h2 className="text-xl font-semibold text-foreground">Select Report Period</h2>
						</div>
						
						<div className="space-y-4">
							<div className="flex flex-col sm:flex-row gap-4">
								<div className="flex-1">
									<label className="text-sm text-muted-foreground mb-2 block">Date Range</label>
									<DateRangePicker
										dateRange={dateRange}
										onDateRangeChange={handleDateRangeChange}
										placeholder="Select start and end dates"
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
						</div>
					</div>

					{/* Preview Section */}
					{dateRange?.from && dateRange?.to && (
						<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									<FileText className="h-5 w-5 text-green-500" />
									<h2 className="text-xl font-semibold text-foreground">Income Statement Preview</h2>
								</div>
								<div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5">
									<p className="text-sm text-muted-foreground">
										{dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {dateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
									</p>
								</div>
							</div>
							
							{isFetchingPreview ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
									<span className="text-muted-foreground">Loading financial data...</span>
								</div>
							) : previewData ? (
								<div className="space-y-6">
									{/* Key Metrics Grid */}
									<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
										<MetricCard
											label="Total Revenue"
											value={formatCurrency(previewData.totalRevenue)}
											subValue={`${previewData.invoiceCount || 0} invoices`}
											icon={DollarSign}
											trend="neutral"
										/>
										<MetricCard
											label="Gross Profit"
											value={formatCurrency(previewData.grossProfit)}
											subValue={`${formatPercent(grossMargin)} margin`}
											icon={TrendingUp}
											trend={previewData.grossProfit >= 0 ? 'up' : 'down'}
										/>
										<MetricCard
											label="Operating Expenses"
											value={formatCurrency(previewData.totalOperatingExpenses)}
											subValue="Fixed + One-time costs"
											icon={Receipt}
											trend="neutral"
										/>
										<MetricCard
											label="Net Profit"
											value={formatCurrency(previewData.netProfit)}
											subValue={`${formatPercent(netMargin)} margin`}
											icon={previewData.netProfit >= 0 ? TrendingUp : TrendingDown}
											trend={previewData.netProfit >= 0 ? 'up' : 'down'}
										/>
									</div>

									{/* Revenue Breakdown */}
									{previewData.totalRevenue > 0 && (
										<div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
											<h3 className="text-sm font-medium text-muted-foreground mb-3">Revenue Breakdown</h3>
											<RevenueBreakdownBar data={previewData} />
										</div>
									)}

									{/* Cost Breakdown */}
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
											<div className="flex items-center gap-2 mb-2">
												<Package className="h-4 w-4 text-red-500" />
												<h3 className="text-sm font-medium text-muted-foreground">Cost of Goods Sold</h3>
											</div>
											<p className="text-2xl font-bold text-foreground">{formatCurrency(previewData.totalCOGS)}</p>
											<p className="text-xs text-muted-foreground">Parts costs from invoices</p>
										</div>
										<div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
											<div className="flex items-center gap-2 mb-2">
												<Wrench className="h-4 w-4 text-blue-500" />
												<h3 className="text-sm font-medium text-muted-foreground">Operating Expenses</h3>
											</div>
											<p className="text-2xl font-bold text-foreground">{formatCurrency(previewData.totalOperatingExpenses)}</p>
											<p className="text-xs text-muted-foreground">Recurring + one-time costs</p>
										</div>
										<div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
											<div className="flex items-center gap-2 mb-2">
												<TrendingUp className="h-4 w-4 text-green-500" />
												<h3 className="text-sm font-medium text-muted-foreground">Gross Margin</h3>
											</div>
											<p className="text-2xl font-bold text-foreground">{formatPercent(grossMargin)}</p>
											<p className="text-xs text-muted-foreground">Revenue after COGS</p>
										</div>
									</div>

									{/* No data warning */}
									{previewData.totalRevenue === 0 && (
										<div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
											<AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
											<div>
												<p className="font-medium text-amber-800 dark:text-amber-200">No revenue data found</p>
												<p className="text-sm text-amber-700 dark:text-amber-300">
													There are no paid invoices in this date range. Try selecting a different period.
												</p>
											</div>
										</div>
									)}

									{/* Download Button */}
									<div className="flex items-center justify-between pt-4 border-t border-border">
										<p className="text-sm text-muted-foreground">
											{previewData.statementId 
												? `Statement #${previewData.statementId}` 
												: 'Draft statement - will be saved on download'}
										</p>
										<Button 
											className="bg-red-600 hover:bg-red-700 text-white" 
											onClick={handleGenerateReport}
											disabled={isGenerating}
										>
											{isGenerating ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													Generating...
												</>
											) : (
												<>
													<Download className="h-4 w-4 mr-2" />
													Download Income Statement PDF
												</>
											)}
										</Button>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-center py-12">
									<p className="text-muted-foreground">Unable to load financial data. Please try again.</p>
								</div>
							)}
						</div>
					)}

					{/* Help Text */}
					<div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-sm text-muted-foreground">
						<h3 className="font-medium text-foreground mb-2">What's included in the Income Statement?</h3>
						<ul className="space-y-1 list-disc list-inside">
							<li><strong>Revenue:</strong> Total from paid invoices (labor, parts, services, fees)</li>
							<li><strong>Cost of Goods Sold (COGS):</strong> Parts costs based on unit cost from invoice items</li>
							<li><strong>Operating Expenses:</strong> Both recurring fixed costs (rent, utilities) and one-time expenses</li>
							<li><strong>Gross Profit:</strong> Revenue minus COGS</li>
							<li><strong>Net Profit:</strong> Gross Profit minus Operating Expenses</li>
						</ul>
					</div>
				</div>
			</main>
		</div>
	);
};

export default ReportsPage;
