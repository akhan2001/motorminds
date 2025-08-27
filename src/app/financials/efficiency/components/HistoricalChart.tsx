"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HistoricalChartProps {
    data: any[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
}).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const costPayload = payload.find((p: any) => p.dataKey === 'Costs');
        const revenuePayload = payload.find((p: any) => p.dataKey === 'Revenue');

        return (
            <div className="bg-[#1a1a1a] p-3 border border-[#333] rounded-md text-white shadow-lg">
                <p className="label font-bold">{`${label}`}</p>
                {revenuePayload && <p className="text-green-400">{`Revenue : ${formatCurrency(revenuePayload.value)}`}</p>}
                {costPayload && <p className="text-orange-400">{`Costs : ${formatCurrency(costPayload.value)}`}</p>}
            </div>
        );
    }
    return null;
};

export default function HistoricalChart({ data }: HistoricalChartProps) {
    if (!data) return null;

    return (
        <Card className="bg-[#0A0A0A] border-[#222] text-white h-full">
            <CardHeader>
                <CardTitle>Historical Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart
                        data={data}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff10' }}/>
                        <Legend />
                        <Bar dataKey="Revenue" fill="#22c55e" barSize={20} />
                        <Line type="monotone" dataKey="Costs" stroke="#ff7300" strokeWidth={2} />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
} 