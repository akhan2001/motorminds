"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { checkUser } from "@/utils/supabase/supabase-auth";
import { getShopId } from "@/utils/supabase/supabase-shop";
import BreadcrumbNav from "./components/BreadcrumbNav";
import FixedCostsTable from "./components/FixedCostsTable";
import AddFixedCostModal from "./components/AddFixedCostModal";
import AddExpenseModal from "./components/AddExpenseModal";
import ExpensesTable from "./components/ExpensesTable";
import SummaryCards from "./components/SummaryCards";
import CostBreakdownChart from "./components/CostBreakdownChart";
import HistoricalChart from "./components/HistoricalChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSkeleton from "./components/LoadingSkeleton";
import { BreakdownDialog } from "./components/BreakdownDialog";

// Correct, simplified data structure
interface EfficiencyData {
	totalRevenue: number;
	totalOperatingExpenses: number;
	netProfit: number;
	historicalData: any[];
	costBreakdown: {
		cogs: number;
		recurring: number;
		oneTime: number;
	};
	breakdown: {
		revenue: any[];
		fixedCosts: any[];
		oneTimeCosts: any[];
	};
}

const Header = ({ value, onTimeRangeChange }: { value: string, onTimeRangeChange: (value: string) => void }) => (
	<div className="flex items-center justify-between my-8">
		<div>
			<h1 className="text-3xl font-bold text-foreground mb-2">Efficiency Analysis</h1>
			<p className="text-muted-foreground">Analyze your shop's revenue, costs, and overall profitability.</p>
		</div>
		<div className="w-40">
			<Select value={value} onValueChange={onTimeRangeChange}>
				<SelectTrigger className="bg-white dark:bg-background border-border text-foreground">
					<SelectValue />
				</SelectTrigger>
				<SelectContent className="bg-popover text-popover-foreground border-border">
					<SelectItem value="today">Today</SelectItem>
					<SelectItem value="7d">Last 7 Days</SelectItem>
					<SelectItem value="30d">Last 30 Days</SelectItem>
					<SelectItem value="90d">Last 90 Days</SelectItem>
					<SelectItem value="1y">Last Year</SelectItem>
				</SelectContent>
			</Select>
		</div>
	</div>
);

export default function EfficiencyClient() {
	const [efficiencyData, setEfficiencyData] = useState<EfficiencyData | null>(null);
	const [fixedCosts, setFixedCosts] = useState([]); // For the raw data table
	const [expenses, setExpenses] = useState([]); // For the raw data table
	const [isLoading, setIsLoading] = useState(true);
	const [shopId, setShopId] = useState<string | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const timeRange = searchParams?.get("timeRange") || "30d";

	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogTitle, setDialogTitle] = useState("");
	const [dialogData, setDialogData] = useState<any[]>([]);
	const [dialogColumns, setDialogColumns] = useState<any[]>([]);

	const handleTimeRangeChange = (newValue: string) => {
		router.push(`/financials/efficiency?timeRange=${newValue}`);
	};

	const handleCardClick = (metric: string) => {
		if (!efficiencyData || !efficiencyData.breakdown) return;

		let title = "";
		let data: any[] = [];
		let columns: any[] = [];
		const { breakdown } = efficiencyData;

		switch (metric) {
			case 'revenue':
				title = "Revenue Breakdown";
				data = breakdown.revenue;
				columns = [
					{ key: 'paid_date', header: 'Date', render: (d: any) => d ? new Date(d).toLocaleDateString("en-US", { timeZone: "UTC" }) : 'N/A' },
					{ key: 'invoice_number', header: 'Invoice #', render: (v: any, item: any) => (
						<a 
							href={`/financials/invoices?invoice_number=${v}`} 
							target="_blank"
							className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
							onClick={(e) => e.stopPropagation()}
						>
							{v}
						</a>
					)},
					{ key: 'total_amount', header: 'Total', render: (v: any) => `$${(v || 0).toFixed(2)}` },
					{ key: 'labor_total', header: 'Labor', render: (v: any) => `$${(v || 0).toFixed(2)}` },
					{ key: 'parts_total', header: 'Parts', render: (v: any) => `$${(v || 0).toFixed(2)}` },
					{ key: 'services_total', header: 'Services', render: (v: any) => `$${(v || 0).toFixed(2)}` },
				];
				break;
			case 'cogs':
				title = "Cost of Goods Sold Breakdown";
				// Extract parts from invoice_items in each invoice (new structure)
				data = breakdown.revenue.flatMap((inv: any) => {
					const items = inv.invoice_items || [];
					return items
						.filter((item: any) => item.item_type === 'part' && item.unit_cost)
						.map((item: any) => ({
							...item,
							invoice_number: inv.invoice_number,
							paid_date: inv.paid_date
						}));
				});
				columns = [
					{ key: 'invoice_number', header: 'Invoice #', render: (v: any) => (
						<a 
							href={`/financials/invoices?invoice_number=${v}`} 
							className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
							onClick={(e) => e.stopPropagation()}
						>
							{v}
						</a>
					)},
					{ key: 'paid_date', header: 'Date', render: (d: any) => d ? new Date(d).toLocaleDateString("en-US", { timeZone: "UTC" }) : 'N/A' },
					{ key: 'description', header: 'Part/Item' },
					{ key: 'part_number', header: 'Part #', render: (v: any) => v || '-' },
					{ key: 'supplier', header: 'Supplier', render: (v: any) => v || '-' },
					{ key: 'quantity', header: 'Qty', render: (v: any) => v || 1 },
					{ key: 'unit_cost', header: 'Unit Cost', render: (v: any) => `$${(v || 0).toFixed(2)}` },
					{ key: 'total_cost', header: 'Total Cost', render: (v: any, item: any) => `$${((item.unit_cost || 0) * (item.quantity || 1)).toFixed(2)}` },
				];
				break;
			case 'costs':
				title = "Operating Expenses Breakdown";
				const fixedItems = breakdown.fixedCosts.map((i: any) => ({ source: 'Fixed Cost', date: i.date, name: i.cost_name, amount: i.amount }));
				const oneTimeItems = breakdown.oneTimeCosts.map((i: any) => ({ source: 'Expense', date: i.cost_date, name: i.cost_name, amount: i.amount }));
				data = [...fixedItems, ...oneTimeItems];
				columns = [
					{ key: 'source', header: 'Source' },
					{ key: 'date', header: 'Date', render: (d: any) => d && d !== 'N/A' ? new Date(d).toLocaleDateString("en-US", { timeZone: "UTC" }) : 'N/A' },
					{ key: 'name', header: 'Details' },
					{ key: 'amount', header: 'Amount', render: (v: any) => `$${v.toFixed(2)}` },
				];
				break;
		}
		setDialogTitle(title);
		setDialogData(data);
		setDialogColumns(columns);
		setDialogOpen(true);
	}

	const fetchData = async (range: string) => {
		if (!shopId) return;
		setIsLoading(true);

		try {
			const toLocalISOString = (date: Date) => {
				const year = date.getFullYear();
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const day = date.getDate().toString().padStart(2, '0');
				return `${year}-${month}-${day}`;
			}

			const endDate = new Date();
			const startDate = new Date();
			switch (range) {
				case "today": startDate.setDate(endDate.getDate()); break;
				case "7d": startDate.setDate(endDate.getDate() - 7); break;
				case "90d": startDate.setDate(endDate.getDate() - 90); break;
				case "1y": startDate.setFullYear(endDate.getFullYear() - 1); break;
				default: startDate.setDate(endDate.getDate() - 30); break;
			}
			const start = toLocalISOString(startDate);
			const end = toLocalISOString(endDate);

			const [fixedCostsRes, oneTimeCostsRes, efficiencyRes] = await Promise.all([
				fetch(`/api/financials/efficiency?shop_id=${shopId}`),
				fetch(`/api/financials/one-time?shop_id=${shopId}`),
				fetch(`/api/financials/efficiency?shop_id=${shopId}&start_date=${start}&end_date=${end}`)
			]);

			if (!fixedCostsRes.ok || !oneTimeCostsRes.ok || !efficiencyRes.ok) {
				throw new Error(`Failed to fetch financial data`);
			}

			setFixedCosts(await fixedCostsRes.json());
			setExpenses(await oneTimeCostsRes.json());
			setEfficiencyData(await efficiencyRes.json());

		} catch (error) {
			console.error(error);
			setEfficiencyData(null);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		async function getShop() {
			const user = await checkUser();
			if (user) {
				const id = await getShopId(user.id);
				if (id) setShopId(id);
				else router.push("/dashboard");
			} else {
				router.push("/login");
			}
		}
		getShop();
	}, [router]);

	useEffect(() => {
		if (shopId) {
			fetchData(timeRange);
		}
	}, [shopId, timeRange]);

	if (isLoading) {
		return (
			<div className="p-8 max-w-7xl mx-auto w-full">
				<BreadcrumbNav />
				<LoadingSkeleton />
			</div>
		);
	}

	return (
		<>
			<div className="p-8 max-w-7xl mx-auto w-full">
				<BreadcrumbNav />
				<Header value={timeRange} onTimeRangeChange={handleTimeRangeChange} />

				{efficiencyData ? (
					<>
						<SummaryCards data={efficiencyData} onCardClick={handleCardClick} />

						<div className="grid grid-cols-1 lg:grid-cols-5 gap-8 my-8">
							<div className="lg:col-span-3">
								<HistoricalChart data={efficiencyData.historicalData} />
							</div>
							<div className="lg:col-span-2">
								<CostBreakdownChart data={efficiencyData} />
							</div>
						</div>
					</>
				) : (
					<div className="text-center py-16 bg-slate-50 dark:bg-card border border-border rounded-lg">
						<h2 className="text-xl font-semibold text-foreground">Could not load efficiency data.</h2>
						<p className="text-muted-foreground mt-2">There might be an issue with the server or your connection.</p>
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
					<div className="bg-slate-50 dark:bg-card border border-border rounded-xl p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-foreground">Recurring Fixed Costs</h2>
							{shopId && (
								<AddFixedCostModal shopId={shopId} onCostAdded={() => fetchData(timeRange)}>
									<Button className="bg-red-600 hover:bg-red-700 text-white">
										<PlusCircle className="w-4 h-4 mr-2" />
										Add Fixed Cost
									</Button>
								</AddFixedCostModal>
							)}
						</div>
						<FixedCostsTable costs={fixedCosts} onCostUpdated={() => fetchData(timeRange)} onCostDeleted={() => fetchData(timeRange)} />
					</div>

					<div className="bg-slate-50 dark:bg-card border border-border rounded-xl p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-foreground">Expenses</h2>
							{shopId && (
								<AddExpenseModal shopId={shopId} onExpenseAdded={() => fetchData(timeRange)}>
									<Button className="bg-red-600 hover:bg-red-700 text-white">
										<PlusCircle className="w-4 h-4 mr-2" />
										Add Expense
									</Button>
								</AddExpenseModal>
							)}
						</div>
						<ExpensesTable expenses={expenses} onExpenseUpdated={() => fetchData(timeRange)} onExpenseDeleted={() => fetchData(timeRange)} />
					</div>
				</div>
			</div>
			<BreakdownDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				title={dialogTitle}
				data={dialogData}
				columns={dialogColumns}
			/>
		</>
	);
} 