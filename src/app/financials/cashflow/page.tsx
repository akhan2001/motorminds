"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Nav } from "@/app/components/nav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileText, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transaction {
  id: string;
  date: string;
  description: string;
  payee: string;
  category: string;
  amount: number;
  type: 'revenue' | 'cost';
}

interface SummaryData {
  totalTransactions: number;
  totalSent: number;
  totalReceived: number;
  sparklineData: { date: string; value: number }[];
}

// Simple sparkline component
function Sparkline({ data, positive }: { data: { date: string; value: number }[]; positive?: boolean }) {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 80;
    const y = 20 - ((d.value - minValue) / range) * 18;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="80" height="20" className="absolute bottom-3 right-4">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        className="opacity-80"
      />
    </svg>
  );
}

// Summary card component
function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  sparklineData, 
  positive = true 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  sparklineData: { date: string; value: number }[];
  positive?: boolean;
}) {
  return (
    <div className="relative bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#333] transition-colors">
      <div className="space-y-2">
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <Sparkline data={sparklineData} positive={positive} />
    </div>
  );
}

// Transaction row component
function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isPositive = transaction.type === 'revenue';
  
  return (
    <div className="grid grid-cols-5 gap-4 py-4 px-6 hover:bg-[#0A0A0A] transition-colors border-b border-[#1a1a1a] last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
          <span className="text-xs font-medium text-gray-300">
            {transaction.payee.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">{transaction.id}</p>
          <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div>
        <p className="text-sm text-white">{transaction.description}</p>
      </div>
      
      <div>
        <p className="text-sm text-white">{transaction.payee}</p>
      </div>
      
      <div>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300">
          {transaction.category}
        </span>
      </div>
      
      <div className="text-right">
        <p className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function CashflowDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalTransactions: 0,
    totalSent: 0,
    totalReceived: 0,
    sparklineData: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }
    
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10)
    };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange(timeRange);
      
      // Fetch revenue transactions
      const { data: revRows, error: revError } = await supabase
        .from("revenue")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      if (revError) throw revError;

      // Fetch cost transactions
      const { data: costRows, error: costError } = await supabase
        .from("cost")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      if (costError) throw costError;

      // Transform data into transactions
      const revenueTransactions: Transaction[] = (revRows || []).map(r => ({
        id: `REV-${r.id}`,
        date: r.date,
        description: r.notes || 'Revenue',
        payee: r.source || 'Customer',
        category: 'Revenue',
        amount: r.amount,
        type: 'revenue' as const
      }));

      const costTransactions: Transaction[] = (costRows || []).map(c => ({
        id: `CST-${c.id}`,
        date: c.date,
        description: c.notes || 'Expense',
        payee: 'Vendor',
        category: c.type || 'Other',
        amount: c.amount,
        type: 'cost' as const
      }));

      const allTransactions = [...revenueTransactions, ...costTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);

      // Calculate summary data
      const totalReceived = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalSent = costTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Generate sparkline data (last 7 days)
      const sparklineData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        
        const dayRevenue = revenueTransactions
          .filter(t => t.date === dateStr)
          .reduce((sum, t) => sum + t.amount, 0);
        
        sparklineData.push({ date: dateStr, value: dayRevenue });
      }

      setSummaryData({
        totalTransactions: allTransactions.length,
        totalSent,
        totalReceived,
        sparklineData
      });

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <Nav activeLink="Financials" />
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-[#1a1a1a] rounded w-1/3"></div>
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-[#1a1a1a] rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-[#1a1a1a] rounded-xl"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Nav activeLink="Financials" />
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/financials">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-[#1a1a1a] -ml-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Financials
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Financial Analytics</h1>
            <p className="text-gray-400">Track your revenue, expenses, and cash flow</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 bg-[#0A0A0A] border-[#1a1a1a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-[#1a1a1a]">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="bg-[#E53935] hover:bg-[#c62828] text-white">
              <FileText className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <SummaryCard
            title="Total Transactions"
            value={summaryData.totalTransactions.toString()}
            subtitle={`${summaryData.totalTransactions} this period`}
            sparklineData={summaryData.sparklineData}
            positive={true}
          />
          <SummaryCard
            title="Total Money Sent"
            value={`$${summaryData.totalSent.toLocaleString()}`}
            subtitle={`$${(summaryData.totalSent / 30).toFixed(0)} avg daily`}
            sparklineData={summaryData.sparklineData.map(d => ({ ...d, value: d.value * 0.3 }))}
            positive={false}
          />
          <SummaryCard
            title="Total Money Received"
            value={`$${summaryData.totalReceived.toLocaleString()}`}
            subtitle={`$${(summaryData.totalReceived / 30).toFixed(0)} avg daily`}
            sparklineData={summaryData.sparklineData}
            positive={true}
          />
        </div>

        {/* Transactions Table */}
        <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1a1a1a]">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 py-3 px-6 bg-[#0f0f0f] border-b border-[#1a1a1a]">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Transaction ID / Date
            </div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Description
            </div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Payee/From
            </div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Category
            </div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide text-right">
              Amount
            </div>
          </div>
          
          {/* Table Body */}
          <div className="max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <p>No transactions found for the selected period</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 