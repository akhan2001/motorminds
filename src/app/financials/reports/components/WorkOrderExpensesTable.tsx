import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '../utils';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';
import type { WorkOrderExpense, ExpenseReportData } from '../types';

interface WorkOrderExpensesTableProps {
	expenses: WorkOrderExpense[];
	summary: ExpenseReportData['summary']['workOrderExpenses'];
	onExpenseClick: (expense: WorkOrderExpense) => void;
}

export const WorkOrderExpensesTable = ({ expenses, summary, onExpenseClick }: WorkOrderExpensesTableProps) => {
	if (expenses.length === 0) {
		return <p className="text-center py-8 text-muted-foreground">No work order expenses in this period.</p>;
	}

	return (
		<div className="overflow-x-auto">
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
					{expenses.map((expense) => {
						const isRefunded = (expense.refund_amount && expense.refund_amount > 0) || expense.resolution_type === 'returned';
						const netAmount = expense.amount - (expense.refund_amount || 0);
						return (
							<tr
								key={expense.id}
								className={cn(
									'border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors',
									isRefunded && 'bg-red-50/30 dark:bg-red-500/5'
								)}
								onClick={() => onExpenseClick(expense)}
							>
								<td className="py-3">{formatDate(expense.date)}</td>
								<td className="py-3">
									<div className="flex items-center gap-2 flex-wrap">
										<span>{expense.vendor}</span>
										<WorkOrderStatusBadge status={expense.work_order_status} />
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
										<span className={cn('font-medium', isRefunded && 'line-through text-muted-foreground')}>
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
									<ExpenseStatusBadge resolution_type={expense.resolution_type} refund_amount={expense.refund_amount} />
								</td>
							</tr>
						);
					})}
				</tbody>
				<tfoot>
					<tr className="font-medium">
						<td colSpan={5} className="pt-3 text-right">Total:</td>
						<td className="pt-3 text-right">{formatCurrency(summary.total)}</td>
						<td />
					</tr>
				</tfoot>
			</table>
		</div>
	);
};
