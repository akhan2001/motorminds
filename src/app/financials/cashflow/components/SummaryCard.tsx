interface SummaryCardProps {
  title: string;
  amount: number;
  positive?: boolean;
}

export default function SummaryCard({ title, amount, positive }: SummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="bg-[#131313] border border-[#222] rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <p className={`text-2xl font-bold ${
        positive === undefined 
          ? "text-white" 
          : positive 
            ? "text-green-400" 
            : "text-red-400"
      }`}>
        {formatCurrency(amount)}
      </p>
    </div>
  );
} 