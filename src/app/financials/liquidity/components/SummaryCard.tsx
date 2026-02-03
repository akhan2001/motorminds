import { formatCurrency } from "@/lib/utils/currency";

interface SummaryCardProps {
    title: string;
    value: number;
    isCurrency?: boolean;
    unit?: string;
}

export default function SummaryCard({ title, value, isCurrency = false, unit }: SummaryCardProps) {

    let formattedValue = '';
    if (isCurrency) {
        formattedValue = formatCurrency(value || 0);
    } else if (unit) {
        formattedValue = `${value.toFixed(2)}${unit}`;
    } else {
        formattedValue = value.toLocaleString();
    }

    return (
        <div className="relative bg-slate-50 dark:bg-card border border-border rounded-xl p-6 hover:border-red-600 dark:hover:border-red-500 transition-colors">
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <p className="text-2xl font-bold text-foreground">{formattedValue}</p>
            </div>
        </div>
    );
} 