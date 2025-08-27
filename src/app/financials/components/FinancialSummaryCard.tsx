"use client"

interface FinancialSummaryCardProps {
  data: {
    totalRevenue: number
    totalCogs: number
    totalFixedCosts: number
    netCashflow: number
  }
}

export function FinancialSummaryCard({ data }: FinancialSummaryCardProps) {
  if (!data) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0)
  }

  return (
    <div className="h-full rounded-lg border border-[#222] bg-[#131313] p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">
        Cash Flow Summary
      </h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Total Revenue</span>
          <span className="font-medium text-green-500">
            {formatCurrency(data.totalRevenue)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Parts & Labor Costs (COGS)</span>
          <span className="font-medium text-red-500">
            ({formatCurrency(data.totalCogs)})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Fixed Costs</span>
          <span className="font-medium text-red-500">
            ({formatCurrency(data.totalFixedCosts)})
          </span>
        </div>
        <hr className="my-3 border-gray-700" />
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold text-white">Net Cashflow</span>
          <span
            className={`font-bold ${
              data.netCashflow >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {formatCurrency(data.netCashflow)}
          </span>
        </div>
      </div>
    </div>
  )
} 