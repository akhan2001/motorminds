"use client"

import { Nav } from "@/app/components/nav"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import FinancialsHeader from "./components/FinancialsHeader"
import MainSummaryCards from "./components/MainSummaryCards"
import TransactionsTable from "./cashflow/components/TransactionsTable"

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

export default function Financials() {
    const [user, setUser] = useState<any>(null);
    const [shopId, setShopId] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summaryData, setSummaryData] = useState<SummaryData>({
        totalTransactions: 0,
        totalSent: 0,
        totalReceived: 0,
        sparklineData: []
    });
    const [timeRange, setTimeRange] = useState("30d");

    const router = useRouter();

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

    // Authenticate the user and get the shop ID
    useEffect(() => { 
        async function loadInitialData() {
            try {
                setIsLoading(true);
                const user = await checkUser();
                if (user) {
                    setUser(user);
                    const shopId = await getShopId(user.id);
                    if (shopId) {
                        setShopId(shopId);
                    } else {
                        console.error("No shop ID found");
                        router.push("/login");
                    }
                } else {
                    console.error("No user found");
                    router.push("/login");
                }
            } catch (error) {
                console.error("Authentication error:", error);
                router.push("/login");
            }
        }
        loadInitialData();
    }, [router]);

    useEffect(() => {
        if (!shopId) return;

        async function fetchData() {
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
        }

        fetchData();
    }, [shopId, timeRange]);

    if (isLoading || !user || !shopId) {
        return (
            <div className="flex flex-col min-h-screen bg-black text-white">
                <Nav activeLink="Financials" />
                <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 bg-[#1a1a1a] rounded w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

    // Create compatible data structure for MainSummaryCards
    const cashflowData = {
        revenue: summaryData.totalReceived,
        total_costs: summaryData.totalSent
    };

    const payrollData = {
        total_monthly_payroll: 0, // We'll calculate this from actual payroll API if needed
        employee_count: 0
    };

    const trendData = summaryData.sparklineData.map(d => ({
        revenue: d.value,
        cost_of_goods_sold: d.value * 0.3
    }));

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Financials" />
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <FinancialsHeader 
                    timeRange={timeRange} 
                    onTimeRangeChange={setTimeRange} 
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="relative bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#333] transition-colors">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400 font-medium">Total Transactions</p>
                            <p className="text-2xl font-bold text-white">{summaryData.totalTransactions}</p>
                            <p className="text-xs text-gray-500">{summaryData.totalTransactions} this period</p>
                        </div>
                    </div>
                    
                    <div className="relative bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#333] transition-colors">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400 font-medium">Total Money Sent</p>
                            <p className="text-2xl font-bold text-white">${summaryData.totalSent.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">${(summaryData.totalSent / 30).toFixed(0)} avg daily</p>
                        </div>
                    </div>
                    
                    <div className="relative bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#333] transition-colors">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400 font-medium">Total Money Received</p>
                            <p className="text-2xl font-bold text-white">${summaryData.totalReceived.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">${(summaryData.totalReceived / 30).toFixed(0)} avg daily</p>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <TransactionsTable transactions={transactions} />
            </main>
        </div>
    );
}