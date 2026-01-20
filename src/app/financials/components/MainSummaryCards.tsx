import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { SparkLineChart } from '@tremor/react';

// Simple sparkline component
function Sparkline({ data, positive }: { data: number[]; positive?: boolean }) {
	if (!data || data.length === 0) return null;

	const maxValue = Math.max(...data);
	const minValue = Math.min(...data);
	const range = maxValue - minValue || 1;

	const points = data.map((value, i) => {
		const x = (i / (data.length - 1)) * 76;
		const y = 18 - ((value - minValue) / range) * 16;
		return `${x + 2},${y + 2}`;
	}).join(' ');

	return (
		<svg width="80" height="20" className="absolute bottom-3 right-4">
			<polyline
				points={points}
				fill="none"
				stroke={positive ? "#22c55e" : "#ef4444"}
				strokeWidth="1.5"
				className="opacity-80"
			/>
		</svg>
	);
}

// Individual summary card component
function SummaryCard({
	title,
	value,
	subtitle,
	icon: Icon,
	sparklineData = [],
	positive = true,
	className = ""
}: {
	title: string;
	value: string;
	subtitle: string;
	icon: any;
	sparklineData?: number[];
	positive?: boolean;
	className?: string;
}) {
	return (
		<div className={`relative bg-white dark:bg-card border border-border rounded-xl p-6 hover:border-red-600 dark:hover:border-red-500 transition-colors ${className}`}>
			<div className="flex items-start justify-between">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Icon className="w-4 h-4 text-muted-foreground" />
						<p className="text-sm text-muted-foreground font-medium">{title}</p>
					</div>
					<p className="text-2xl font-bold text-foreground">{value}</p>
					<p className="text-xs text-muted-foreground">{subtitle}</p>
				</div>
			</div>
			<Sparkline data={sparklineData} positive={positive} />
		</div>
	);
}

interface TrendData {
	revenue: number;
	cost_of_goods_sold: number;
}

interface MainSummaryCardsProps {
	cashflowData: any;
	trendData: TrendData[];
}

export default function MainSummaryCards({ cashflowData, trendData }: MainSummaryCardsProps) {
	// Calculate sparkline data from trend data
	const revenueSparkline = trendData ? trendData.slice(-7).map(d => d.revenue || 0) : [];

	// Prepare daily metrics
	const dailyRevenue = (cashflowData?.revenue || 0) / 30;

	// Calculate net profit
	const netProfit = (cashflowData?.revenue || 0) - (cashflowData?.total_costs || 0);

	return (
		<div className="flex md:grid md:grid-cols-3 gap-6 mb-8 overflow-x-auto snap-x">
			<SummaryCard
				title="Net Profit"
				value={`$${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
				subtitle="Revenue - Operating Costs"
				icon={TrendingUp}
				positive={netProfit >= 0}
				className="min-w-[260px] snap-start"
			/>

			<SummaryCard
				title="Total Revenue"
				value={`$${(cashflowData?.revenue || 0).toLocaleString()}`}
				subtitle={`Daily avg: $${Math.round(dailyRevenue).toLocaleString()}`}
				icon={DollarSign}
				sparklineData={revenueSparkline}
				positive={true}
				className="min-w-[260px] snap-start"
			/>

			<SummaryCard
				title="Total Costs"
				value={`$${(cashflowData?.total_costs || 0).toLocaleString()}`}
				subtitle={`COGS: $${(cashflowData?.cogs || 0).toLocaleString()}`}
				icon={TrendingDown}
				positive={false}
				className="min-w-[260px] snap-start"
			/>
		</div>
	);
} 