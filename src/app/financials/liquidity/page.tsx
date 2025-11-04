"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Nav } from "@/app/components/nav"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart, FileText, Info } from "lucide-react"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId, getShopName } from "@/utils/supabase/supabase-shop"
import SummaryCard from "@/app/financials/liquidity/components/SummaryCard"
import AgingScheduleTable from "@/app/financials/liquidity/components/AgingScheduleTable"
import BreadcrumbNav from "@/app/financials/liquidity/components/BreadcrumbNav"
import { generateArAgingReport, generateArAgingCsv } from "../utils/report-generator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Define the data structure from our API
interface LiquidityData {
	totalAR: number;
	agingBuckets: {
		current: { total: number; invoices: any[] };
		thirtyOneToSixty: { total: number; invoices: any[] };
		sixtyOneToNinety: { total: number; invoices: any[] };
		ninetyPlus: { total: number; invoices: any[] };
	};
}

export default function LiquidityPage() {
	const [data, setData] = useState<LiquidityData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isGeneratingReport, setIsGeneratingReport] = useState(false)
	const [shopId, setShopId] = useState<string | null>(null)
	const [shopName, setShopName] = useState<string>('Your Shop')
	const router = useRouter()

	// Authenticate and get shop_id
	useEffect(() => {
		async function getShop() {
			try {
				const user = await checkUser()
				if (user) {
					const id = await getShopId(user.id)
					if (id) {
						setShopId(id)
						const name = await getShopName(id)
						setShopName(name || 'Your Shop')
					} else {
						console.error("Shop ID not found for user.")
						router.push("/dashboard")
					}
				} else {
					router.push("/login")
				}
			} catch (error) {
				console.error("Error fetching user or shop:", error)
				router.push("/login")
			}
		}
		getShop()
	}, [router])

	// Fetch liquidity data
	useEffect(() => {
		if (!shopId) return

		async function fetchData() {
			setIsLoading(true)
			try {
				const response = await fetch(`/api/financials/liquidity?shop_id=${shopId}`)
				if (!response.ok) throw new Error("Failed to fetch liquidity data")
				const result = await response.json()
				setData(result)
			} catch (error) {
				console.error(error)
			} finally {
				setIsLoading(false)
			}
		}
		fetchData()
	}, [shopId])

	const allInvoices = data ? [
		...data.agingBuckets.current.invoices,
		...data.agingBuckets.thirtyOneToSixty.invoices,
		...data.agingBuckets.sixtyOneToNinety.invoices,
		...data.agingBuckets.ninetyPlus.invoices
	] : [];

	const handleExport = (format: 'pdf' | 'csv') => {
		if (!data) return;
		setIsGeneratingReport(true);
		try {
			if (format === 'pdf') {
				generateArAgingReport(data, allInvoices, shopName);
			} else {
				generateArAgingCsv(allInvoices);
			}
		} catch (error) {
			console.error("Failed to generate report:", error);
			alert("There was an error generating the report. Please try again.");
		} finally {
			setIsGeneratingReport(false);
		}
	};

	// Skeleton loader
	if (isLoading || !data) {
		return (
			<div className="flex flex-col min-h-screen bg-slate-50 dark:bg-background text-foreground">
				<Nav />
				<main className="flex-1 p-8 max-w-7xl mx-auto w-full">
					<div className="animate-pulse space-y-8">
						<div className="h-8 bg-slate-50 dark:bg-muted rounded w-1/3"></div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="h-28 bg-slate-50 dark:bg-muted rounded-xl"></div>
							))}
						</div>
						<div className="h-96 bg-slate-50 dark:bg-muted rounded-xl"></div>
					</div>
				</main>
			</div>
		)
	}

	return (
		<div className="flex flex-col min-h-screen bg-slate-50 dark:bg-background text-foreground">
			<Nav />
			<main className="flex-1 p-8 max-w-7xl mx-auto w-full">
				<BreadcrumbNav />

				{/* Header */}
				<div className="flex items-center justify-between my-8">
					<div>
						<h1 className="text-3xl font-bold text-foreground mb-2">Liquidity Analysis</h1>
						<p className="text-muted-foreground">Accounts receivable and invoice aging.</p>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button disabled={isGeneratingReport} className="bg-red-600 hover:bg-red-700 text-white">
								<FileText className="w-4 h-4 mr-2" />
								{isGeneratingReport ? 'Generating...' : 'Export Report'}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="bg-popover text-popover-foreground border-border">
							<DropdownMenuItem onClick={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<SummaryCard title="Total Accounts Receivable" value={data.totalAR} isCurrency={true} />
					<SummaryCard title="Current (0-30 Days)" value={data.agingBuckets.current.total} isCurrency={true} />
					<SummaryCard title="31-60 Days" value={data.agingBuckets.thirtyOneToSixty.total} isCurrency={true} />
					<SummaryCard title="61+ Days" value={data.agingBuckets.sixtyOneToNinety.total + data.agingBuckets.ninetyPlus.total} isCurrency={true} />
				</div>

				{/* Aging Schedule Table */}
				<AgingScheduleTable invoices={allInvoices} />
			</main>
		</div>
	)
}
