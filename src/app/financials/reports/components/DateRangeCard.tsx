import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { dateRangePresets } from '@/components/ui/date-range-picker';
import { getTorontoDateString } from '@/lib/utils/date';

interface DateRangeCardProps {
	dateRange: DateRange | undefined;
	onDateRangeChange: (range: DateRange | undefined) => void;
	onPresetClick: (preset: (typeof dateRangePresets)[0]) => void;
}

export const DateRangeCard = ({ dateRange, onDateRangeChange, onPresetClick }: DateRangeCardProps) => (
	<Card className="bg-white dark:bg-card border-border">
		<CardHeader className="pb-4">
			<CardTitle className="flex items-center gap-2 text-lg">
				<Calendar className="h-5 w-5 text-blue-500" />
				Select Report Period
			</CardTitle>
		</CardHeader>
		<CardContent className="space-y-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label className="text-sm text-muted-foreground mb-2 block">From Date</label>
					<Input
						type="date"
						value={dateRange?.from ? getTorontoDateString(dateRange.from) : ''}
						onChange={(e) => {
							const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
							onDateRangeChange({ from: date, to: dateRange?.to });
						}}
						className="bg-white dark:bg-background border-border text-foreground"
					/>
				</div>
				<div>
					<label className="text-sm text-muted-foreground mb-2 block">To Date</label>
					<Input
						type="date"
						value={dateRange?.to ? getTorontoDateString(dateRange.to) : ''}
						onChange={(e) => {
							const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
							onDateRangeChange({ from: dateRange?.from, to: date });
						}}
						min={dateRange?.from ? getTorontoDateString(dateRange.from) : undefined}
						className="bg-white dark:bg-background border-border text-foreground"
					/>
				</div>
			</div>
			<div>
				<label className="text-sm text-muted-foreground mb-2 block">Quick Select</label>
				<div className="flex flex-wrap gap-2">
					{dateRangePresets.map((preset) => (
						<Button
							key={preset.label}
							variant="outline"
							size="sm"
							onClick={() => onPresetClick(preset)}
							className="bg-white dark:bg-background border-border text-foreground hover:bg-muted"
						>
							{preset.label}
						</Button>
					))}
				</div>
			</div>
		</CardContent>
	</Card>
);
