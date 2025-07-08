"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from "@/app/financials/utils/formatting";

interface HistoricalChartProps {
    data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1a1a] p-3 border border-[#333] rounded-md text-white shadow-lg">
                <p className="label font-bold">{`${label}`}</p>
                <p className="text-blue-400">{`Revenue : ${formatCurrency(payload[0].value)}`}</p>
                <p className="text-orange-400">{`Costs : ${formatCurrency(payload[1].value)}`}</p>
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
                        <Bar dataKey="Revenue" fill="#0088FE" barSize={20} />
                        <Line type="monotone" dataKey="Costs" stroke="#ff7300" strokeWidth={2} />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
} 