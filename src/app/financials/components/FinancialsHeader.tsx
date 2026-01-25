import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FinancialsHeaderProps {
	timeRange: string;
	onTimeRangeChange: (value: string) => void;
}

export default function FinancialsHeader({ timeRange, onTimeRangeChange }: FinancialsHeaderProps) {
	return (
		<div className="flex items-center justify-between mb-8">
			<div>
				<h1 className="text-3xl font-bold text-foreground mb-2">Financial Dashboard</h1>
				<p className="text-muted-foreground">Complete overview of your shop's financial performance</p>
			</div>

			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Calendar className="w-4 h-4" />
					<Select value={timeRange} onValueChange={onTimeRangeChange}>
						<SelectTrigger className="w-32 bg-white dark:bg-background border-border text-foreground">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="bg-popover text-popover-foreground border-border">
							<SelectItem value="7d">Last 7 days</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="90d">Last 90 days</SelectItem>
							<SelectItem value="1y">Last year</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
} 