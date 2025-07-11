"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "@/app/components/nav";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { checkUser } from "@/utils/supabase/supabase-auth";
import { getShopId } from "@/utils/supabase/supabase-shop";
import BreadcrumbNav from "./components/BreadcrumbNav";
import FixedCostsTable from "./components/FixedCostsTable";
import AddFixedCostModal from "./components/AddFixedCostModal";
import AddOneTimeCostModal from "./components/AddOneTimeCostModal";
import OneTimeCostsTable from "./components/OneTimeCostsTable";
import SummaryCards from "./components/SummaryCards";
import CostBreakdownChart from "./components/CostBreakdownChart";
import HistoricalChart from "./components/HistoricalChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSkeleton from "./components/LoadingSkeleton";
import { BreakdownDialog } from "./components/BreakdownDialog";

// Correct, simplified data structure
interface EfficiencyData {
  totalRevenue: number;
  totalOperatingExpenses: number;
  netProfit: number;
  historicalData: any[];
  costBreakdown: {
    cogs: number;
    recurring: number;
    oneTime: number;
  };
  breakdown: {
    revenue: any[];
    fixedCosts: any[];
    oneTimeCosts: any[];
  };
}

const Header = ({ value, onTimeRangeChange }: { value: string, onTimeRangeChange: (value: string) => void }) => (
    <div className="flex items-center justify-between my-8">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Efficiency Analysis</h1>
            <p className="text-gray-400">Analyze your shop's revenue, costs, and overall profitability.</p>
        </div>
        <div className="w-40">
           <Select value={value} onValueChange={onTimeRangeChange}>
                <SelectTrigger className="bg-black text-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131313] border-[#222] text-white">
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
);

export default function EfficiencyClient() {
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyData | null>(null);
  const [fixedCosts, setFixedCosts] = useState([]); // For the raw data table
  const [oneTimeCosts, setOneTimeCosts] = useState([]); // For the raw data table
  const [isLoading, setIsLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeRange = searchParams?.get("timeRange") || "30d";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogData, setDialogData] = useState<any[]>([]);
  const [dialogColumns, setDialogColumns] = useState<any[]>([]);

  const handleTimeRangeChange = (newValue: string) => {
    router.push(`/financials/efficiency?timeRange=${newValue}`);
  };

  const handleCardClick = (metric: string) => {
    if (!efficiencyData || !efficiencyData.breakdown) return;
    
    let title = "";
    let data: any[] = [];
    let columns: any[] = [];
    const { breakdown } = efficiencyData;

    switch(metric) {
        case 'revenue':
            title = "Revenue Breakdown";
            data = breakdown.revenue;
            columns = [
                { key: 'paid_at', header: 'Date', render: (d: any) => new Date(d).toLocaleDateString("en-US", { timeZone: "UTC" }) },
                { key: 'invoice_number', header: 'Invoice #', render: (v: any) => <span className="text-blue-400 font-medium">{v}</span> },
                { key: 'amount', header: 'Amount', render: (v: any) => `$${v.toFixed(2)}` },
            ];
            break;
        case 'cogs':
            title = "Cost of Goods Sold Breakdown";
            data = breakdown.revenue.flatMap((inv: any) => inv.parts_items || []);
            columns = [
                { key: 'description', header: 'Part/Item' },
                { key: 'quantity', header: 'Qty', render: (v: any) => v || 1 },
                { key: 'shop_cost', header: 'Unit Cost', render: (v: any) => `$${(v || 0).toFixed(2)}` },
                { key: 'total_cost', header: 'Total Cost', render: (v: any, item: any) => `$${((item.shop_cost || 0) * (item.quantity || 1)).toFixed(2)}` },
            ];
            break;
        case 'costs':
            title = "Operating Expenses Breakdown";
            const fixedItems = breakdown.fixedCosts.map(i => ({ source: 'Fixed Cost', date: i.date, name: i.cost_name, amount: i.amount }));
            const oneTimeItems = breakdown.oneTimeCosts.map(i => ({ source: 'One-Time Cost', date: i.cost_date, name: i.cost_name, amount: i.amount }));
            data = [...fixedItems, ...oneTimeItems];
            columns = [
                { key: 'source', header: 'Source' },
                { key: 'date', header: 'Date', render: (d: any) => d && d !== 'N/A' ? new Date(d).toLocaleDateString("en-US", { timeZone: "UTC" }) : 'N/A' },
                { key: 'name', header: 'Details' },
                { key: 'amount', header: 'Amount', render: (v: any) => `$${v.toFixed(2)}` },
            ];
            break;
    }
    setDialogTitle(title);
    setDialogData(data);
    setDialogColumns(columns);
    setDialogOpen(true);
  }

  const fetchData = async (range: string) => {
    if (!shopId) return;
    setIsLoading(true);
    
    try {
        const toLocalISOString = (date: Date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        const endDate = new Date();
        const startDate = new Date();
        switch (range) {
            case "today": startDate.setDate(endDate.getDate()); break;
            case "7d": startDate.setDate(endDate.getDate() - 7); break;
            case "90d": startDate.setDate(endDate.getDate() - 90); break;
            case "1y": startDate.setFullYear(endDate.getFullYear() - 1); break;
            default: startDate.setDate(endDate.getDate() - 30); break;
        }
        const start = toLocalISOString(startDate);
        const end = toLocalISOString(endDate);

        const [fixedCostsRes, oneTimeCostsRes, efficiencyRes] = await Promise.all([
            fetch(`/api/financials/efficiency?shop_id=${shopId}`),
            fetch(`/api/financials/one-time?shop_id=${shopId}`),
            fetch(`/api/financials/efficiency?shop_id=${shopId}&start_date=${start}&end_date=${end}`)
        ]);

        if (!fixedCostsRes.ok || !oneTimeCostsRes.ok || !efficiencyRes.ok) {
            throw new Error(`Failed to fetch financial data`);
        }
        
        setFixedCosts(await fixedCostsRes.json());
        setOneTimeCosts(await oneTimeCostsRes.json());
        setEfficiencyData(await efficiencyRes.json());

    } catch (error) {
      console.error(error);
      setEfficiencyData(null); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function getShop() {
      const user = await checkUser();
      if (user) {
        const id = await getShopId(user.id);
        if (id) setShopId(id);
        else router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
    getShop();
  }, [router]);

  useEffect(() => {
    if (shopId) {
      fetchData(timeRange);
    }
  }, [shopId, timeRange]);

  if (isLoading) {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav />
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                <BreadcrumbNav />
                <LoadingSkeleton />
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Nav />
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <BreadcrumbNav />
        <Header value={timeRange} onTimeRangeChange={handleTimeRangeChange} />
        
        {efficiencyData ? (
          <>
            <SummaryCards data={efficiencyData} onCardClick={handleCardClick} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 my-8">
                <div className="lg:col-span-3">
                    <HistoricalChart data={efficiencyData.historicalData} />
                </div>
                <div className="lg:col-span-2">
                    <CostBreakdownChart data={efficiencyData} />
                </div>
            </div>
          </>
        ) : (
            <div className="text-center py-16 bg-[#0A0A0A] border border-[#222] rounded-lg">
                <h2 className="text-xl font-semibold">Could not load efficiency data.</h2>
                <p className="text-gray-400 mt-2">There might be an issue with the server or your connection.</p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recurring Fixed Costs</h2>
                {shopId && (
                  <AddFixedCostModal shopId={shopId} onCostAdded={() => fetchData(timeRange)}>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Fixed Cost
                    </Button>
                  </AddFixedCostModal>
                )}
              </div>
              <FixedCostsTable costs={fixedCosts} onCostUpdated={() => fetchData(timeRange)} onCostDeleted={() => fetchData(timeRange)} />
            </div>

            <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">One-Time Costs</h2>
                {shopId && (
                  <AddOneTimeCostModal shopId={shopId} onCostAdded={() => fetchData(timeRange)}>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Cost
                    </Button>
                  </AddOneTimeCostModal>
                )}
              </div>
              <OneTimeCostsTable costs={oneTimeCosts} onCostUpdated={() => fetchData(timeRange)} onCostDeleted={() => fetchData(timeRange)}/>
            </div>
        </div>
      </main>
      <BreakdownDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        data={dialogData}
        columns={dialogColumns}
      />
    </div>
  );
} 