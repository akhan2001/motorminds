interface SummaryCardProps {
    title: string;
    value: number;
    isCurrency?: boolean;
    unit?: string;
}

export default function SummaryCard({ title, value, isCurrency = false, unit }: SummaryCardProps) {

    let formattedValue = '';
    if (isCurrency) {
        formattedValue = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(value || 0);
    } else if (unit) {
        formattedValue = `${value.toFixed(2)}${unit}`;
    } else {
        formattedValue = value.toLocaleString();
    }

    return (
        <div className="relative bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#333] transition-colors">
            <div className="space-y-2">
                <p className="text-sm text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-white">{formattedValue}</p>
            </div>
        </div>
    );
} 