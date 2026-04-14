import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '../utils';
import type { CreditRefundItem, ExpenseReportData } from '../types';

interface CreditsRefundsTableProps {
	items: CreditRefundItem[];
	summary: ExpenseReportData['summary']['creditsRefunds'];
}

export const CreditsRefundsTable = ({ items, summary }: CreditsRefundsTableProps) => {
	if (items.length === 0) {
		return <p className="text-center py-8 text-muted-foreground">No credits or refunds in this period.</p>;
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border text-left">
						<th className="pb-2 font-medium text-muted-foreground">Date</th>
						<th className="pb-2 font-medium text-muted-foreground">Supplier</th>
						<th className="pb-2 font-medium text-muted-foreground">Reason</th>
						<th className="pb-2 font-medium text-muted-foreground text-right">Amount</th>
						<th className="pb-2 font-medium text-muted-foreground text-center">Status</th>
					</tr>
				</thead>
				<tbody>
					{items.map((cr) => (
						<tr key={cr.id} className="border-b border-border/50">
							<td className="py-3">{formatDate(cr.refund_date)}</td>
							<td className="py-3">{cr.supplier}</td>
							<td className="py-3">{cr.reason}</td>
							<td className="py-3 text-right font-medium text-green-600 dark:text-green-400">
								{formatCurrency(cr.amount)}
							</td>
							<td className="py-3 text-center">
								<Badge variant="outline" className="text-xs capitalize">{cr.status}</Badge>
							</td>
						</tr>
					))}
				</tbody>
				<tfoot>
					<tr className="font-medium">
						<td colSpan={3} className="pt-3 text-right">Total:</td>
						<td className="pt-3 text-right text-green-600 dark:text-green-400">
							{formatCurrency(summary?.total ?? 0)}
						</td>
						<td />
					</tr>
				</tfoot>
			</table>
		</div>
	);
};
