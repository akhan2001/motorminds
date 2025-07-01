"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CostBreakdownChartProps {
    data: {
        totalCogs: number;
        totalPayroll: number;
        totalFixedCosts: number;
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
}).format(value);

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1a1a] p-2 border border-[#333] rounded-md text-white">
                <p className="label">{`${payload[0].name} : ${formatCurrency(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};

export default function CostBreakdownChart({ data }: CostBreakdownChartProps) {
    if (!data) return null;

    const chartData = [
        { name: 'Parts & COGS', value: data.totalCogs },
        { name: 'Payroll', value: data.totalPayroll },
        { name: 'Fixed Costs', value: data.totalFixedCosts },
    ].filter(item => item.value > 0);

    return (
        <Card className="bg-[#0A0A0A] border-[#222] text-white h-full">
            <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
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
                            nameKey="name"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
} 