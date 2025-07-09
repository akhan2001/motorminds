import { TrendingUp, TrendingDown, DollarSign, Users, BarChart3 } from "lucide-react";
import { SparkLineChart } from '@tremor/react';

// Simple sparkline component
function Sparkline({ data, positive }: { data: number[]; positive?: boolean }) {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 76;
    const y = 18 - ((value - minValue) / range) * 16;
    return `${x + 2},${y + 2}`;
  }).join(' ');
  
  return (
    <svg width="80" height="20" className="absolute bottom-3 right-4">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        className="opacity-80"
      />
    </svg>
  );
}

// Individual summary card component
function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  sparklineData = [],
  positive = true 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: any;
  sparklineData?: number[];
  positive?: boolean;
}) {
  return (
    <div className="relative bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#333] transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-400 font-medium">{title}</p>
          </div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <Sparkline data={sparklineData} positive={positive} />
    </div>
  );
}

interface TrendData {
    revenue: number;
    cost_of_goods_sold: number;
}

interface MainSummaryCardsProps {
  cashflowData: any;
  payrollData: any;
  trendData: TrendData[];
}

export default function MainSummaryCards({ cashflowData, payrollData, trendData }: MainSummaryCardsProps) {
  // Calculate sparkline data from trend data
  const revenueSparkline = trendData ? trendData.slice(-7).map(d => d.revenue || 0) : [];
  const expenseSparkline = trendData ? trendData.slice(-7).map(d => d.cost_of_goods_sold || 0) : [];
  
  // Calculate net cash flow
  const netCashFlow = (cashflowData?.total_inflow || 0) - (cashflowData?.total_outflow || 0);
  const isPositive = netCashFlow >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <SummaryCard
        title="Net Cash Flow"
        value={`$${Math.abs(netCashFlow).toLocaleString()}`}
        subtitle={isPositive ? "Positive cash flow" : "Negative cash flow"}
        icon={isPositive ? TrendingUp : TrendingDown}
        sparklineData={revenueSparkline}
        positive={isPositive}
      />
      
      <SummaryCard
        title="Monthly Revenue"
        value={`$${(cashflowData?.revenue || 0).toLocaleString()}`}
        subtitle={`$${Math.round((cashflowData?.revenue || 0) / 30)} avg daily`}
        icon={DollarSign}
        sparklineData={revenueSparkline}
        positive={true}
      />
      
      <SummaryCard
        title="Monthly Payroll"
        value={`$${(payrollData?.total_monthly_payroll || 0).toLocaleString()}`}
        subtitle={`${payrollData?.employee_count || 0} employees`}
        icon={Users}
        sparklineData={expenseSparkline}
        positive={false}
      />
    </div>
  );
} 