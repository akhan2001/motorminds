"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AggregatedDay {
  date: string;
  revenue: number;
  cost: number;
  inventory: number;
  fixed: number;
  other: number;
}

interface CashflowLineChartProps {
  data: AggregatedDay[];
}

export default function CashflowLineChart({ data }: CashflowLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey="date" 
          stroke="#666"
          fontSize={12}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          stroke="#666"
          fontSize={12}
          tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#131313",
            border: "1px solid #222",
            borderRadius: "8px",
            color: "#fff"
          }}
          formatter={(value: number, name: string) => [
            `$${value.toLocaleString()}`,
            name === "revenue" ? "Revenue" : "Costs"
          ]}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="cost" 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 