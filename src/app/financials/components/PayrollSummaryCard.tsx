"use client"

interface PayrollSummaryCardProps {
  data: {
    totalMonthlyPayroll: number
    numberOfEmployees: number
  }
}

export function PayrollSummaryCard({ data }: PayrollSummaryCardProps) {
  if (!data) return null
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0)
  }

  const averagePayrollPerEmployee =
    data.numberOfEmployees > 0
      ? data.totalMonthlyPayroll / data.numberOfEmployees
      : 0

  return (
    <div className="h-full rounded-lg border border-[#222] bg-[#131313] p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">
        Payroll Summary
      </h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Total Monthly Payroll</span>
          <span className="font-medium text-orange-500">
            {formatCurrency(data.totalMonthlyPayroll)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Number of Employees</span>
          <span className="font-medium text-white">
            {data.numberOfEmployees}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Average Per Employee</span>
          <span className="font-medium text-white">
            {formatCurrency(averagePayrollPerEmployee)}
          </span>
        </div>
      </div>
    </div>
  )
} 