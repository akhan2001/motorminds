import { Card, CardContent } from '@/components/ui/card';
import { Receipt, Wrench, Package, DollarSign, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import type { ExpenseReportData } from '../types';

interface SummaryCardProps {
	title: string;
	count: number;
	total: number;
	icon: React.ElementType;
	subtext?: string;
	className?: string;
}

const SummaryCard = ({ title, count, total, icon: Icon, subtext, className }: SummaryCardProps) => (
	<Card className={cn('bg-white dark:bg-card border-border', className)}>
		<CardContent className="p-4">
			<div className="flex items-start gap-3">
				<div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
					<Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm text-muted-foreground truncate">{title}</p>
					<p className="text-xl font-bold text-foreground">{formatCurrency(total)}</p>
					<p className="text-xs text-muted-foreground">
						{count} expense{count !== 1 ? 's' : ''}{subtext ? ` • ${subtext}` : ''}
					</p>
				</div>
			</div>
		</CardContent>
	</Card>
);

interface SummaryCardsProps {
	summary: ExpenseReportData['summary'];
}

export const SummaryCards = ({ summary }: SummaryCardsProps) => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
		<SummaryCard
			title="General Expenses"
			count={summary.generalExpenses.count}
			total={summary.generalExpenses.total}
			icon={Receipt}
			subtext={`+${formatCurrency(summary.generalExpenses.tax)} tax`}
		/>
		<SummaryCard
			title="Work Order Expenses"
			count={summary.workOrderExpenses.count}
			total={summary.workOrderExpenses.total}
			icon={Wrench}
			subtext={`+${formatCurrency(summary.workOrderExpenses.tax)} tax`}
		/>
		<SummaryCard
			title="Parts Costs (COGS)"
			count={summary.partsExpenses.count}
			total={summary.partsExpenses.totalCost}
			icon={Package}
			subtext={`${formatCurrency(summary.partsExpenses.totalProfit)} profit`}
		/>
		{summary.creditsRefunds && summary.creditsRefunds.count > 0 && (
			<SummaryCard
				title="Credits & Refunds"
				count={summary.creditsRefunds.count}
				total={summary.creditsRefunds.total}
				icon={Undo2}
				subtext="inflow"
				className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
			/>
		)}
		<SummaryCard
			title={summary.netExpenses !== undefined ? 'Net Expenses' : 'Total Expenses'}
			count={
				summary.generalExpenses.count +
				summary.workOrderExpenses.count +
				summary.partsExpenses.count
			}
			total={summary.netExpenses ?? summary.grandTotal}
			icon={DollarSign}
			className="bg-slate-100 dark:bg-slate-800"
		/>
	</div>
);
