import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '../utils';
import type { PartsExpense, ExpenseReportData } from '../types';

interface PartsExpensesTableProps {
	expenses: PartsExpense[];
	summary: ExpenseReportData['summary']['partsExpenses'];
}

export const PartsExpensesTable = ({ expenses, summary }: PartsExpensesTableProps) => {
	if (expenses.length === 0) {
		return <p className="text-center py-8 text-muted-foreground">No parts costs in this period.</p>;
	}

	return (
		<div className="overflow-x-auto">
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
					{expenses.map((part) => (
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
							<td className={cn('py-3 text-right font-medium', part.profit >= 0 ? 'text-green-600' : 'text-red-600')}>
								{formatCurrency(part.profit)}
							</td>
							<td className="py-3 text-center">
								<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
									<CheckCircle2 className="h-3 w-3 mr-1" />Paid
								</Badge>
							</td>
						</tr>
					))}
				</tbody>
				<tfoot>
					<tr className="font-medium">
						<td colSpan={5} className="pt-3 text-right">Total:</td>
						<td className="pt-3 text-right">{formatCurrency(summary.totalCost)}</td>
						<td />
						<td className={cn('pt-3 text-right', summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
							{formatCurrency(summary.totalProfit)}
						</td>
						<td />
					</tr>
				</tfoot>
			</table>
		</div>
	);
};
