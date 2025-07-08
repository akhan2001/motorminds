"use client"

import { ArrowDownRight, ArrowUpRight, DollarSign, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/app/financials/utils/formatting";

interface SummaryCardsProps {
    data: {
        totalRevenue: number;
        totalCogs: number;
        totalPayroll: number;
        totalFixedCosts: number;
        grossProfit: number;
        netProfit: number;
    };
    onCardClick: (metric: string) => void;
}

const SummaryCard = ({ title, value, icon, isProfit, onClick }: { title: string, value: string, icon: React.ReactNode, isProfit?: boolean, onClick: () => void }) => {
    const profitColor = isProfit ? (value.startsWith('-') ? 'text-red-500' : 'text-green-500') : 'text-white';
    const profitIcon = isProfit ? (value.startsWith('-') ? <ArrowDownRight className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>) : icon;
    
    return (
        <button onClick={onClick} className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg p-5 flex items-center space-x-4 text-left hover:bg-[#111] transition-colors">
            <div className={`bg-[#1a1a1a] p-3 rounded-full ${profitColor}`}>
                {profitIcon}
            </div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <p className={`text-2xl font-bold ${profitColor}`}>{value}</p>
            </div>
        </button>
    );
};


export default function SummaryCards({ data, onCardClick }: SummaryCardsProps) {
    if (!data) return null;

    const totalCosts = data.totalFixedCosts;

    const cards = [
        { key: 'revenue', title: 'Total Revenue', value: data.totalRevenue, icon: <TrendingUp className="w-5 h-5"/> },
        { key: 'costs', title: 'Total Costs', value: totalCosts, icon: <TrendingDown className="w-5 h-5"/> },
        { key: 'grossProfit', title: 'Gross Profit', value: data.grossProfit, icon: <DollarSign className="w-5 h-5"/> },
        { key: 'netProfit', title: 'Net Profit', value: data.netProfit, icon: <Scale className="w-5 h-5"/>, isProfit: true },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map(card => (
                <SummaryCard 
                    key={card.key}
                    title={card.title} 
                    value={formatCurrency(card.value)} 
                    icon={card.icon} 
                    isProfit={card.isProfit}
                    onClick={() => onCardClick(card.key)}
                />
            ))}
        </div>
    );
} 