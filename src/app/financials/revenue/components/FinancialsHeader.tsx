"use client"
import SummaryCard from "../../liquidity/components/SummaryCard"

export default function FinancialsHeader({ statements }: { statements: any[] }) {
  if (!statements || statements.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1a1a] rounded-xl p-6 text-center text-gray-400 col-span-4">
          <p>No financial data available for the latest period. Generate a statement to see summary metrics.</p>
        </div>
      </div>
    )
  }

  const latest = statements[0]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SummaryCard title="Total Revenue" value={latest.total_revenue} isCurrency={true} />
      <SummaryCard title="Gross Profit" value={latest.gross_profit} isCurrency={true} />
      <SummaryCard
        title="Gross Profit Margin"
        value={(latest.gross_profit / latest.total_revenue) * 100}
        isCurrency={false}
        unit="%"
      />
      <SummaryCard title="Net Profit" value={latest.net_profit} isCurrency={true} />
    </div>
  )
} 