import { formatCurrency } from "@/app/financials/utils/formatting";

interface SummaryCardProps {
    title: string;
    value: number;
    isCurrency?: boolean;
}

export default function SummaryCard({ title, value, isCurrency = false }: SummaryCardProps) {

    const formattedValue = isCurrency 
        ? formatCurrency(value)
        : value.toLocaleString();

    return (
        <div className="relative bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#333] transition-colors">
            <div className="space-y-2">
                <p className="text-sm text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-white">{formattedValue}</p>
            </div>
        </div>
    );
} 