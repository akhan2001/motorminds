"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import BreadcrumbNav from './components/BreadcrumbNav';
import { generateIncomeStatementPDF } from './components/IncomeStatementPDF';
import { checkUser } from '@/utils/supabase/supabase-auth';
import { getShopId } from '@/utils/supabase/supabase-shop';
import { DateRangePicker, dateRangePresets } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { FileText, Download, Calendar } from 'lucide-react';

const ReportsPage = () => {
	const [shopId, setShopId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isGenerating, setIsGenerating] = useState(false);
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

	const handleGenerateReport = async () => {
		if (!shopId) {
			alert('Shop information not found. Unable to generate report.');
			return;
		}

		if (!dateRange?.from || !dateRange?.to) {
			alert('Please select a date range.');
			return;
		}

		setIsGenerating(true);
		try {
			const response = await fetch(
				`/api/financials/reports/income-statement?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}&shopId=${shopId}`
			);
			if (!response.ok) {
				throw new Error('Failed to fetch income statement data');
			}
			const data = await response.json();
			generateIncomeStatementPDF(data, shopId, data.statementId);
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

	const Header = () => (
		<div className="flex items-center justify-between my-8">
			<div>
				<h1 className="text-3xl font-bold text-foreground mb-2">Financial Reports</h1>
				<p className="text-muted-foreground">Generate and review your shop's financial statements.</p>
			</div>
		</div>
	);

	if (isLoading) {
		return (
			<div className="flex flex-col h-full bg-background text-foreground">
				<main className="flex-1 p-8 max-w-7xl mx-auto w-full">
					<BreadcrumbNav />
					<p className="text-muted-foreground">Loading...</p>
				</main>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-background text-foreground">
			<main className="flex-1 p-8 max-w-7xl mx-auto w-full">
				<BreadcrumbNav />
				<Header />
				
				<div className="grid gap-6">
					{/* Date Range Selection Card */}
					<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
						<div className="flex items-center gap-2 mb-4">
							<Calendar className="h-5 w-5 text-blue-500" />
							<h2 className="text-xl font-semibold text-foreground">Select Date Range</h2>
						</div>
						
						<div className="space-y-4">
							{/* Custom Date Range Picker */}
							<div>
								<label className="text-sm text-muted-foreground mb-2 block">Custom Range</label>
								<DateRangePicker
									dateRange={dateRange}
									onDateRangeChange={setDateRange}
									placeholder="Select start and end dates"
								/>
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

					{/* Generate Report Card */}
					<div className="bg-white dark:bg-card border border-border rounded-xl p-6">
						<div className="flex items-center gap-2 mb-4">
							<FileText className="h-5 w-5 text-green-500" />
							<h2 className="text-xl font-semibold text-foreground">Income Statement</h2>
						</div>
						
						<p className="text-muted-foreground mb-4">
							Generate a comprehensive income statement for the selected period showing revenue, 
							expenses, and net profit.
						</p>

						{dateRange?.from && dateRange?.to && (
							<div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-3 mb-4">
								<p className="text-sm text-muted-foreground">
									Report Period: <span className="text-foreground font-medium">
										{dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
									</span>
								</p>
							</div>
						)}

						<Button 
							className="bg-red-600 hover:bg-red-700 text-white" 
							onClick={handleGenerateReport}
							disabled={isGenerating || !dateRange?.from || !dateRange?.to}
						>
							{isGenerating ? (
								<>Generating...</>
							) : (
								<>
									<Download className="h-4 w-4 mr-2" />
									Generate Income Statement PDF
								</>
							)}
						</Button>
					</div>
				</div>
			</main>
		</div>
	);
};

export default ReportsPage;
