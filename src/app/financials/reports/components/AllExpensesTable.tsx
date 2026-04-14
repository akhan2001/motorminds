import { Badge } from '@/components/ui/badge';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '../utils';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';
import type { AllExpenseRow, GeneralExpense, WorkOrderExpense, CreditRefundItem } from '../types';

interface AllExpensesTableProps {
	expenses: AllExpenseRow[];
	netTotal: number;
	onExpenseClick: (expense: GeneralExpense | WorkOrderExpense) => void;
}

export const AllExpensesTable = ({ expenses, netTotal, onExpenseClick }: AllExpensesTableProps) => {
	if (expenses.length === 0) {
		return <p className="text-center py-8 text-muted-foreground">No expenses in this period.</p>;
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border text-left">
						<th className="pb-2 font-medium text-muted-foreground">Date</th>
						<th className="pb-2 font-medium text-muted-foreground">Type</th>
						<th className="pb-2 font-medium text-muted-foreground">Vendor / Supplier</th>
						<th className="pb-2 font-medium text-muted-foreground">Description</th>
						<th className="pb-2 font-medium text-muted-foreground text-right">Amount</th>
						<th className="pb-2 font-medium text-muted-foreground text-center">Status</th>
					</tr>
				</thead>
				<tbody>
					{expenses.map((row) => {
						if (row._tab === 'general') {
							const expense = row as GeneralExpense & { _tab: 'general' };
							const isRefunded = (expense.refund_amount && expense.refund_amount > 0) || expense.resolution_type === 'returned';
							const netAmount = expense.amount - (expense.refund_amount || 0);
							return (
								<tr
									key={`general-${expense.id}`}
									className={cn(
										'border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors',
										isRefunded && 'bg-red-50/30 dark:bg-red-500/5'
									)}
									onClick={() => onExpenseClick(expense)}
								>
									<td className="py-3">{formatDate(expense.date)}</td>
									<td className="py-3">
										<Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs">General</Badge>
									</td>
									<td className="py-3">{expense.vendor || '—'}</td>
									<td className="py-3">{expense.description}</td>
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
						}

						if (row._tab === 'work_order') {
							const expense = row as WorkOrderExpense & { _tab: 'work_order' };
							const isRefunded = (expense.refund_amount && expense.refund_amount > 0) || expense.resolution_type === 'returned';
							const netAmount = expense.amount - (expense.refund_amount || 0);
							return (
								<tr
									key={`wo-${expense.id}`}
									className={cn(
										'border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors',
										isRefunded && 'bg-red-50/30 dark:bg-red-500/5'
									)}
									onClick={() => onExpenseClick(expense)}
								>
									<td className="py-3">{formatDate(expense.date)}</td>
									<td className="py-3">
										<div className="flex items-center gap-1 flex-wrap">
											<Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">Work Order</Badge>
											<WorkOrderStatusBadge status={expense.work_order_status} />
										</div>
									</td>
									<td className="py-3">{expense.vendor || '—'}</td>
									<td className="py-3">{expense.description}</td>
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
						}

						if (row._tab === 'parts') {
							const part = row as { id: string; _tab: 'parts'; supplier: string; description: string; date: string; total_cost: number };
							return (
								<tr key={`parts-${part.id}`} className="border-b border-border/50">
									<td className="py-3">{formatDate(part.date)}</td>
									<td className="py-3">
										<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">Parts</Badge>
									</td>
									<td className="py-3">{part.supplier || '—'}</td>
									<td className="py-3">{part.description}</td>
									<td className="py-3 text-right font-medium">{formatCurrency(part.total_cost)}</td>
									<td className="py-3 text-center">
										<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Paid</Badge>
									</td>
								</tr>
							);
						}

						// credits
						const cr = row as CreditRefundItem & { _tab: 'credits' };
						return (
							<tr key={`cr-${cr.id}`} className="border-b border-border/50">
								<td className="py-3">{formatDate(cr.refund_date)}</td>
								<td className="py-3">
									<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Credit/Refund</Badge>
								</td>
								<td className="py-3">{cr.supplier || '—'}</td>
								<td className="py-3">{cr.reason}</td>
								<td className="py-3 text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(cr.amount)}</td>
								<td className="py-3 text-center">
									<Badge variant="outline" className="text-xs capitalize">{cr.status}</Badge>
								</td>
							</tr>
						);
					})}
				</tbody>
				<tfoot>
					<tr className="font-medium">
						<td colSpan={4} className="pt-3 text-right">Net Total:</td>
						<td className="pt-3 text-right">{formatCurrency(netTotal)}</td>
						<td />
					</tr>
				</tfoot>
			</table>
		</div>
	);
};
