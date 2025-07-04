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

interface EfficiencyData {
  totalRevenue: number;
  totalCogs: number;
  totalPayroll: number;
  totalFixedCosts: number;
  grossProfit: number;
  netProfit: number;
  historicalData: any[];
}

const Header = ({ value, onTimeRangeChange }: { value: string, onTimeRangeChange: (value: string) => void }) => (
    <div className="flex items-center justify-between my-8">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Efficiency Analysis</h1>
            <p className="text-gray-400">Analyze your shop's revenue, costs, and overall profitability.</p>
        </div>
        <div className="w-40">
           <Select value={value} onValueChange={onTimeRangeChange}>
                <SelectTrigger className="bg-black">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131313] border-[#222]">
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
  const [fixedCosts, setFixedCosts] = useState([]);
  const [oneTimeCosts, setOneTimeCosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeRange = searchParams?.get("timeRange") || "30d";

  const handleTimeRangeChange = (newValue: string) => {
    router.push(`/financials/efficiency?timeRange=${newValue}`);
  };

  const fetchData = async (range: string) => {
    if (!shopId) return;
    setIsLoading(true);
    
    try {
        const endDate = new Date();
        const startDate = new Date();
        switch (range) {
            case "7d": startDate.setDate(endDate.getDate() - 7); break;
            case "90d": startDate.setDate(endDate.getDate() - 90); break;
            case "1y": startDate.setFullYear(endDate.getFullYear() - 1); break;
            default: startDate.setDate(endDate.getDate() - 30); break;
        }
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];

        const [fixedCostsRes, oneTimeCostsRes, efficiencyRes] = await Promise.all([
            fetch(`/api/financials/efficiency?shop_id=${shopId}`),
            fetch(`/api/financials/one-time?shop_id=${shopId}`),
            fetch(`/api/financials/efficiency?shop_id=${shopId}&start_date=${start}&end_date=${end}`)
        ]);

        if (!fixedCostsRes.ok) {
            console.error("Failed to fetch fixed costs:", fixedCostsRes.status, await fixedCostsRes.text());
            throw new Error(`Failed to fetch fixed costs: ${fixedCostsRes.status}`);
        }
        if (!oneTimeCostsRes.ok) {
            console.error("Failed to fetch one-time costs:", oneTimeCostsRes.status, await oneTimeCostsRes.text());
            throw new Error(`Failed to fetch one-time costs: ${oneTimeCostsRes.status}`);
        }
        if (!efficiencyRes.ok) {
            console.error("Failed to fetch efficiency data:", efficiencyRes.status, await efficiencyRes.text());
            throw new Error(`Failed to fetch efficiency data: ${efficiencyRes.status}`);
        }
        
        const fixedCostsResult = await fixedCostsRes.json();
        const oneTimeCostsResult = await oneTimeCostsRes.json();
        const efficiencyResult = await efficiencyRes.json();
        
        setFixedCosts(fixedCostsResult);
        setOneTimeCosts(oneTimeCostsResult);
        setEfficiencyData(efficiencyResult);

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
            <Nav activeLink="Financials" />
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                <BreadcrumbNav />
                <LoadingSkeleton />
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Nav activeLink="Financials" />
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <BreadcrumbNav />
        <Header value={timeRange} onTimeRangeChange={handleTimeRangeChange} />
        
        {efficiencyData ? (
          <>
            <SummaryCards data={efficiencyData} />

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
              <FixedCostsTable costs={fixedCosts} onCostUpdated={() => fetchData(timeRange)} />
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
              <OneTimeCostsTable costs={oneTimeCosts} onCostUpdated={() => fetchData(timeRange)} />
            </div>
        </div>
      </main>
    </div>
  );
} 