"use client"

import { ArrowDownRight, ArrowUpRight, DollarSign, Scale, TrendingDown, TrendingUp } from "lucide-react";

interface SummaryCardsProps {
    data: {
        totalRevenue: number;
        totalCogs: number;
        totalPayroll: number;
        totalFixedCosts: number;
        grossProfit: number;
        netProfit: number;
    };
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
}).format(value);

const SummaryCard = ({ title, value, icon, isProfit }: { title: string, value: string, icon: React.ReactNode, isProfit?: boolean }) => {
    const profitColor = isProfit ? (value.startsWith('-') ? 'text-red-500' : 'text-green-500') : 'text-white';
    const profitIcon = isProfit ? (value.startsWith('-') ? <ArrowDownRight className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>) : icon;
    
    return (
        <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-5 flex items-center space-x-4">
            <div className={`bg-[#1a1a1a] p-3 rounded-full ${profitColor}`}>
                {profitIcon}
            </div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <p className={`text-2xl font-bold ${profitColor}`}>{value}</p>
            </div>
        </div>
    );
};


export default function SummaryCards({ data }: SummaryCardsProps) {
    if (!data) return null;

    const totalCosts = data.totalCogs + data.totalPayroll + data.totalFixedCosts;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard 
                title="Total Revenue" 
                value={formatCurrency(data.totalRevenue)} 
                icon={<TrendingUp className="w-5 h-5"/>} 
            />
            <SummaryCard 
                title="Total Costs" 
                value={formatCurrency(totalCosts)} 
                icon={<TrendingDown className="w-5 h-5"/>} 
            />
            <SummaryCard 
                title="Gross Profit" 
                value={formatCurrency(data.grossProfit)} 
                icon={<DollarSign className="w-5 h-5"/>} 
            />
            <SummaryCard 
                title="Net Profit" 
                value={formatCurrency(data.netProfit)} 
                icon={<Scale className="w-5 h-5"/>}
                isProfit={true}
            />
        </div>
    );
} 