"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EfficiencyData {
  totalOperatingExpenses: number;
  costBreakdown: {
    recurring: number;
    oneTime: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function CostBreakdownChart({ data }: { data: EfficiencyData }) {
    if (!data || !data.costBreakdown) {
        return <div>No data available</div>;
    }
    
    const chartData = [
        { name: 'Recurring Fixed Costs', value: data.costBreakdown.recurring },
        { name: 'One-Time Costs', value: data.costBreakdown.oneTime },
    ];
    
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
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#131313', 
                            border: '1px solid #222',
                            color: 'white'
                        }}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
} 