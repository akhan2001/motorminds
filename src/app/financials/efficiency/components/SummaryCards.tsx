"use client";

import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

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
        className={`bg-slate-50 dark:bg-card border border-border rounded-xl p-6 ${onClick ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-muted hover:border-red-600 dark:hover:border-red-500 transition-colors' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-muted-foreground">{title}</h3>
            {icon}
        </div>
        <p className={`text-3xl font-bold mt-2 ${className || 'text-foreground'}`}>
            {formatCurrency(value)}
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
                icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
                onClick={() => onCardClick('revenue')}
            />
            <SummaryCard 
                title="Cost of Goods Sold"
                value={data.costBreakdown?.cogs || 0}
                icon={<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
                onClick={() => onCardClick('cogs')}
            />
            <SummaryCard 
                title="Operating Expenses"
                value={operatingExpenses}
                icon={<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
                onClick={() => onCardClick('costs')}
            />
            <SummaryCard 
                title="Net Profit"
                value={data.netProfit}
                icon={data.netProfit >= 0 ? <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /> : <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
                className={data.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
            />
        </div>
    );
} 