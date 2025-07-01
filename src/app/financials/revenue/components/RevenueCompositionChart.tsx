"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const COLORS = ['#0088FE', '#00C49F']; // Blue for Parts, Green for Labor

export default function RevenueCompositionChart({ statements }: { statements: any[] }) {
    if (!statements || statements.length === 0) {
        return null; // Don't render if there's no data
    }

    const latestStatement = statements[0]; // The API returns them sorted descending
    const { total_parts_revenue, total_labor_revenue } = latestStatement;

    const data = [
        { name: 'Parts Revenue', value: total_parts_revenue || 0 },
        { name: 'Labor Revenue', value: total_labor_revenue || 0 },
    ];
    
    // Don't render chart if there's no revenue data
    if(!total_parts_revenue && !total_labor_revenue) {
        return (
             <div className="bg-[#1a1a1a] rounded-xl p-6 h-full flex flex-col justify-center items-center">
                <h3 className="text-lg font-semibold text-white mb-2">Revenue Composition</h3>
                <p className="text-gray-400">No parts or labor revenue recorded for the latest period.</p>
            </div>
        )
    }

    return (
        <div className="bg-[#1a1a1a] rounded-xl p-6 h-full">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Composition (Latest Month)</h3>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                             contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                             formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
} 