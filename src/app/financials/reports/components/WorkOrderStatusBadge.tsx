import { Badge } from '@/components/ui/badge';

const labels: Record<string, string> = {
	in_progress: 'In Progress',
	completed: 'Completed',
	cancelled: 'Cancelled',
};

const classNames: Record<string, string> = {
	in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
	completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
	cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

/** Secondary context badge showing the associated work order's status. */
export const WorkOrderStatusBadge = ({ status }: { status: string | null }) => {
	if (!status || !labels[status]) return null;
	return (
		<Badge className={`text-xs ${classNames[status]}`}>
			{labels[status]}
		</Badge>
	);
};
