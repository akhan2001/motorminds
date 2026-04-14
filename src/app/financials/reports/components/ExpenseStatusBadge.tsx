import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Undo2 } from 'lucide-react';

/**
 * Three-state expense status badge.
 * Expenses are pre-paid costs — status reflects what happened after recording.
 * Paid (default) | Refunded (money came back) | Void (written off / reassigned / inventory)
 */
export const ExpenseStatusBadge = ({
	resolution_type,
	refund_amount,
}: {
	resolution_type: string | null;
	refund_amount: number | null;
}) => {
	const isRefunded =
		resolution_type === 'returned' ||
		resolution_type === 'credited' ||
		resolution_type === 'restocking_fee' ||
		(refund_amount !== null && refund_amount > 0);

	const isVoid =
		resolution_type === 'written_off' ||
		resolution_type === 'reassigned' ||
		resolution_type === 'inventory';

	if (isRefunded) {
		return (
			<Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
				<Undo2 className="h-3 w-3 mr-1" />Refunded
			</Badge>
		);
	}
	if (isVoid) {
		return (
			<Badge variant="outline" className="text-muted-foreground">
				Void
			</Badge>
		);
	}
	return (
		<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
			<CheckCircle2 className="h-3 w-3 mr-1" />Paid
		</Badge>
	);
};
