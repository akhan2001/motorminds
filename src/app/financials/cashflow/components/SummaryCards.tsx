import Sparkline from "./Sparkline";

interface SummaryData {
  totalTransactions: number;
  totalSent: number;
  totalReceived: number;
  sparklineData: { date: string; value: number }[];
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  sparklineData: { date: string; value: number }[];
  positive?: boolean;
}

function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  sparklineData, 
  positive = true 
}: SummaryCardProps) {
  return (
    <div className="relative bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#333] transition-colors">
      <div className="space-y-2">
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <Sparkline data={sparklineData} positive={positive} />
    </div>
  );
}

interface SummaryCardsProps {
  summaryData: SummaryData;
}

export default function SummaryCards({ summaryData }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <SummaryCard
        title="Total Transactions"
        value={summaryData.totalTransactions.toString()}
        subtitle={`${summaryData.totalTransactions} this period`}
        sparklineData={summaryData.sparklineData}
        positive={true}
      />
      <SummaryCard
        title="Total Money Sent"
        value={`$${summaryData.totalSent.toLocaleString()}`}
        subtitle={`$${(summaryData.totalSent / 30).toFixed(0)} avg daily`}
        sparklineData={summaryData.sparklineData.map(d => ({ ...d, value: d.value * 0.3 }))}
        positive={false}
      />
      <SummaryCard
        title="Total Money Received"
        value={`$${summaryData.totalReceived.toLocaleString()}`}
        subtitle={`$${(summaryData.totalReceived / 30).toFixed(0)} avg daily`}
        sparklineData={summaryData.sparklineData}
        positive={true}
      />
    </div>
  );
} 