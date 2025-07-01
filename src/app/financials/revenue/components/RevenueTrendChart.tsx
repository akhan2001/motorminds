"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const formatPercent = (value: number) => `${value.toFixed(0)}%`;

export default function RevenueTrendChart({ data: apiData }: { data: any }) {
    if (!apiData || !apiData.trend || apiData.trend.length === 0) return null;

    const chartData = apiData.trend.map((d: any) => {
        const grossProfit = d.total_revenue - (d.total_cogs || 0);
        const grossMargin = d.total_revenue > 0 ? (grossProfit / d.total_revenue) * 100 : 0;
        return {
            month: new Date(d.month).toLocaleString('default', { month: 'short', year: '2-digit' }),
            Revenue: d.total_revenue,
            'Gross Margin': grossMargin
        }
    });

    return (
        <div className="bg-[#1a1a1a] rounded-xl p-6 h-full">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue & Gross Margin Trend</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="month" stroke="#888" fontSize={12} />
                        <YAxis yAxisId="left" stroke="#888" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                        <YAxis yAxisId="right" orientation="right" stroke="#FFC107" fontSize={12} tickFormatter={(value) => formatPercent(value)} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value: number, name: string) => {
                                if (name === 'Revenue') return formatCurrency(value);
                                if (name === 'Gross Margin') return formatPercent(value);
                                return value;
                            }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="Revenue" fill="#4CAF50" />
                        <Line yAxisId="right" type="monotone" dataKey="Gross Margin" stroke="#FFC107" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
} 