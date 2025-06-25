"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AggregatedDay {
  date: string;
  revenue: number;
  cost: number;
  inventory: number;
  fixed: number;
  other: number;
}

interface CostPieChartProps {
  data: AggregatedDay[];
}

const COLORS = {
  inventory: "#3b82f6",
  fixed: "#f59e0b",
  other: "#8b5cf6"
};

export default function CostPieChart({ data }: CostPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No cost data available
      </div>
    );
  }

  const totalInventory = data.reduce((sum, d) => sum + d.inventory, 0);
  const totalFixed = data.reduce((sum, d) => sum + d.fixed, 0);
  const totalOther = data.reduce((sum, d) => sum + d.other, 0);

  const pieData = [
    { name: "Inventory", value: totalInventory, color: COLORS.inventory },
    { name: "Fixed Costs", value: totalFixed, color: COLORS.fixed },
    { name: "Other", value: totalOther, color: COLORS.other },
  ].filter(item => item.value > 0);

  if (pieData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No cost breakdown available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#131313",
            border: "1px solid #222",
            borderRadius: "8px",
            color: "#fff"
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
        />
        <Legend
          wrapperStyle={{ color: "#fff" }}
          formatter={(value) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  );
} 