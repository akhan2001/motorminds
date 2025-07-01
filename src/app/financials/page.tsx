"use client"

import { Nav } from "@/app/components/nav"
import FinancialsHeader from "./components/FinancialsHeader"
import MainSummaryCards from "./components/MainSummaryCards"
import QuickActions from "./components/QuickActions"

export default function Financials() {

  // Placeholder data for skeleton layout
  const placeholderData = {
    cashflowData: { revenue: 0, total_costs: 0 },
    payrollData: { total_monthly_payroll: 0, employee_count: 0 },
    trendData: [],
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Nav activeLink="Financials" />
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <span className="font-semibold text-white">Financials Dashboard</span>
        </nav>

        {/* The Header component is static and doesn't need live data */}
        <FinancialsHeader timeRange={"30d"} onTimeRangeChange={() => {}} />

        {/* We pass placeholder data to the summary cards to maintain the layout */}
        <MainSummaryCards
          cashflowData={placeholderData.cashflowData}
          payrollData={placeholderData.payrollData}
          trendData={placeholderData.trendData}
        />
        
        {/* The QuickActions component provides the navigation */}
        <QuickActions />

      </main>
    </div>
  )
}