"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';

interface HistoricalChartProps {
    data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const costPayload = payload.find((p: any) => p.dataKey === 'Costs');
        const revenuePayload = payload.find((p: any) => p.dataKey === 'Revenue');

        return (
            <div className="bg-white dark:bg-card p-3 border border-border rounded-md text-foreground shadow-lg">
                <p className="label font-bold">{`${label}`}</p>
                {revenuePayload && <p className="text-green-600 dark:text-green-400">{`Revenue : ${formatCurrency(revenuePayload.value)}`}</p>}
                {costPayload && <p className="text-red-600 dark:text-red-400">{`Costs : ${formatCurrency(costPayload.value)}`}</p>}
            </div>
        );
    }
    return null;
};

export default function HistoricalChart({ data }: HistoricalChartProps) {
    if (!data) return null;

    return (
        <Card className="bg-slate-50 dark:bg-card border-border text-foreground h-full">
            <CardHeader>
                <CardTitle className="text-foreground">Historical Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart
                        data={data}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }}/>
                        <Legend />
                        <Bar dataKey="Revenue" fill="#22c55e" barSize={20} />
                        <Line type="monotone" dataKey="Costs" stroke="#ef4444" strokeWidth={2} />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
} 