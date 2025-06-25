"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Nav } from "@/app/components/nav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BreadcrumbNav from "./components/BreadcrumbNav";
import SummaryCard from "./components/SummaryCard";
import CashflowLineChart from "./components/CashflowLineChart";
import CostPieChart from "./components/CostPieChart";
import AddEntryModal from "./components/AddEntryModal";

interface AggregatedDay {
  date: string;
  revenue: number;
  cost: number;
  inventory: number;
  fixed: number;
  other: number;
}

export default function CashflowDashboard() {
  const [data, setData] = useState<AggregatedDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch revenue
      const { data: revRows, error: revError } = await supabase
        .from("revenue")
        .select("date, amount")
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);

      if (revError) throw revError;

      // Fetch costs
      const { data: costRows, error: costError } = await supabase
        .from("cost")
        .select("date, amount, type")
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);

      if (costError) throw costError;

      // Aggregate per day
      const map: Record<string, AggregatedDay> = {};

      revRows?.forEach((r) => {
        if (!map[r.date])
          map[r.date] = {
            date: r.date,
            revenue: 0,
            cost: 0,
            inventory: 0,
            fixed: 0,
            other: 0,
          };
        map[r.date].revenue += r.amount;
      });

      costRows?.forEach((c) => {
        if (!map[c.date])
          map[c.date] = {
            date: c.date,
            revenue: 0,
            cost: 0,
            inventory: 0,
            fixed: 0,
            other: 0,
          };
        map[c.date].cost += c.amount;
        map[c.date][c.type as "inventory" | "fixed" | "other"] += c.amount;
      });

      setData(Object.values(map).sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error("Error fetching cashflow data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalCost = data.reduce((s, d) => s + d.cost, 0);
  const net = totalRevenue - totalCost;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <Nav activeLink="Financials" />
        <main className="flex-1 p-4 sm:p-8 max-w-[1300px] mx-auto w-full">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Nav activeLink="Financials" />
      <main className="flex-1 p-4 sm:p-8 max-w-[1300px] mx-auto w-full space-y-6">
        {/* Back Button and Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link href="/financials">
            <Button variant="outline" size="sm" className="border-[#222] hover:bg-[#222]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Financials
            </Button>
          </Link>
          <BreadcrumbNav />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Cash Flow Analytics</h1>
            <p className="text-gray-400">Detailed view of your revenue and expenses</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard title="Total Revenue" amount={totalRevenue} positive />
          <SummaryCard title="Total Costs" amount={totalCost} />
          <SummaryCard title="Net Cash Flow" amount={net} positive={net >= 0} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#131313] border border-[#222] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Revenue vs Costs Trend</h2>
            <CashflowLineChart data={data} />
          </div>
          <div className="bg-[#131313] border border-[#222] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Cost Breakdown</h2>
            <CostPieChart data={data} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button 
            onClick={() => setOpenModal(true)} 
            className="bg-red-600 hover:bg-red-700"
          >
            Add New Entry
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchData}
            className="border-[#222] hover:bg-[#222]"
          >
            Refresh Data
          </Button>
        </div>

        <AddEntryModal 
          open={openModal} 
          onClose={() => setOpenModal(false)} 
          onAdded={fetchData} 
        />
      </main>
    </div>
  );
} 