"use client";

import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface EfficiencyData {
    totalRevenue: number;
    totalOperatingExpenses: number;
    netProfit: number;
}

interface SummaryCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

const SummaryCard = ({ title, value, icon, onClick, className }: SummaryCardProps) => (
    <div 
        className={`bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 ${onClick ? 'cursor-pointer hover:bg-[#1a1a1a]' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-400">{title}</h3>
            {icon}
        </div>
        <p className={`text-3xl font-bold mt-2 ${className}`}>
            {value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </p>
    </div>
);

interface EfficiencyDataWithBreakdown extends EfficiencyData {
    costBreakdown: {
        cogs: number;
        recurring: number;
        oneTime: number;
    }
}

export default function SummaryCards({ data, onCardClick }: { data: EfficiencyDataWithBreakdown, onCardClick: (metric: string) => void }) {
    const operatingExpenses = data.totalOperatingExpenses - (data.costBreakdown?.cogs || 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SummaryCard 
                title="Total Revenue"
                value={data.totalRevenue}
                icon={<DollarSign className="h-5 w-5 text-gray-500" />}
                onClick={() => onCardClick('revenue')}
            />
            <SummaryCard 
                title="Cost of Goods Sold"
                value={data.costBreakdown?.cogs || 0}
                icon={<TrendingDown className="h-5 w-5 text-gray-500" />}
                onClick={() => onCardClick('cogs')}
            />
            <SummaryCard 
                title="Operating Expenses"
                value={operatingExpenses}
                icon={<TrendingDown className="h-5 w-5 text-gray-500" />}
                onClick={() => onCardClick('costs')}
            />
            <SummaryCard 
                title="Net Profit"
                value={data.netProfit}
                icon={data.netProfit >= 0 ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
                className={data.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}
            />
        </div>
    );
} 