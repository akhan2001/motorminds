"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EfficiencyData {
  totalOperatingExpenses: number;
  costBreakdown: {
    recurring: number;
    oneTime: number;
  };
  breakdown?: {
    fixedCosts: { amount: number; category?: string }[];
    oneTimeCosts: { amount: number; category?: string }[];
  };
}
// Extend palette for multiple categories (up to 10)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6699', '#33CCCC', '#FF9933', '#66FF66', '#FF6666'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const { name, value, color } = payload[0].payload;
        return (
            <div style={{ backgroundColor: '#131313', border: '1px solid #222', padding: '6px', color: 'white' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: 10, height: 10, backgroundColor: color, borderRadius: '50%', marginRight: 6 }} />
                    {name}: ${value.toFixed(2)}
                </span>
            </div>
        );
    }
    return null;
};

export default function CostBreakdownChart({ data }: { data: EfficiencyData }) {
    if (!data || !data.costBreakdown) {
        return <div>No data available</div>;
    }
    
    // If detailed cost arrays are available, break down by category for richer insight
    let chartData: { name: string; value: number; color?: string }[] = [];

    if (data.breakdown && data.breakdown.fixedCosts && data.breakdown.oneTimeCosts) {
        const categoryTotals: Record<string, number> = {};
        data.breakdown.fixedCosts.forEach((c) => {
            const cat = c.category || 'Fixed Cost';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + (c.amount || 0);
        });
        data.breakdown.oneTimeCosts.forEach((c) => {
            const cat = c.category || 'One-Time Cost';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + (c.amount || 0);
        });
        chartData = Object.entries(categoryTotals).map(([name, value], idx) => ({ name, value, color: COLORS[idx % COLORS.length] }));
    } else {
        chartData = [
            { name: 'Recurring Fixed Costs', value: data.costBreakdown.recurring, color: COLORS[0] },
            { name: 'One-Time Costs', value: data.costBreakdown.oneTime, color: COLORS[1] },
        ];
    }
    
    if (data.totalOperatingExpenses === 0) {
        return (
             <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 h-full flex flex-col items-center justify-center">
                 <h2 className="text-xl font-semibold text-white mb-4">Cost Breakdown</h2>
                 <p className="text-gray-400">No cost data available for this period.</p>
            </div>
        )
    }

    return (
        <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 h-full flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-4">Cost Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color ?? COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
} 