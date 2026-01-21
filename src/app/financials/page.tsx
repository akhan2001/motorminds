"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import FinancialsHeader from "./components/FinancialsHeader";
import MainSummaryCards from "./components/MainSummaryCards";
import QuickActions from "./components/QuickActions";
import LoadingSkeleton from "./components/LoadingSkeleton";
import { ScaffoldContainer } from "@/components/layout";
import { PageLoading, PageAuthRequired } from "@/components/common/feedback/page-states";

export default function Financials() {
    const { user, shopId, isLoading: authLoading } = useAuth();
    const [dataLoading, setDataLoading] = useState(false);
    const [timeRange, setTimeRange] = useState("30d");

    // State for holding fetched data
    const [cashflowData, setCashflowData] = useState({ revenue: 0, total_costs: 0, cogs: 0 });
    const [trendData, setTrendData] = useState([]);

    // Fetch all financial data when shopId or timeRange changes
    useEffect(() => {
        if (!shopId) return;

        const fetchFinancials = async () => {
            setDataLoading(true);

            const endDate = new Date();
            const startDate = new Date();
            switch (timeRange) {
                case "7d": startDate.setDate(endDate.getDate() - 7); break;
                case "90d": startDate.setDate(endDate.getDate() - 90); break;
                case "1y": startDate.setFullYear(endDate.getFullYear() - 1); break;
                default: startDate.setDate(endDate.getDate() - 30); break;
            }
            const start = startDate.toISOString().split('T')[0];
            const end = endDate.toISOString().split('T')[0];

            try {
                const efficiencyRes = await fetch(`/api/financials/efficiency?shop_id=${shopId}&start_date=${start}&end_date=${end}`);

                if (efficiencyRes.ok) {
                    const data = await efficiencyRes.json();
                    setCashflowData({
                        revenue: data.totalRevenue,
                        total_costs: data.totalOperatingExpenses,
                        cogs: data.costBreakdown?.cogs || 0,
                    });
                    setTrendData(data.historicalData || []);
                }

            } catch (error) {
                console.error("Failed to fetch financial data:", error);
            } finally {
                setDataLoading(false);
            }
        };

        fetchFinancials();
    }, [shopId, timeRange]);

    // Auth loading state
    if (authLoading) {
        return <PageLoading title="Loading Financials" description="Checking authentication..." />;
    }

    // Auth required state
    if (!shopId || !user) {
        return <PageAuthRequired resource="financials" />;
    }

    // Data loading state (after auth is confirmed)
    if (dataLoading && cashflowData.revenue === 0) {
        return (
            <div className="h-full flex flex-col bg-background">
                {/* Fixed Header */}
                <div className="bg-background border-b border-border flex-shrink-0">
                    <div className="px-6 py-4">
                        <h1 className="text-2xl font-semibold text-foreground">Financials Dashboard</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track your shop's financial performance
                        </p>
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <ScaffoldContainer size="large" className="py-6">
                        <LoadingSkeleton />
                    </ScaffoldContainer>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Fixed Header */}
            <div className="bg-background border-b border-border flex-shrink-0">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-semibold text-foreground">Financials Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track your shop's financial performance
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <ScaffoldContainer size="large" className="py-6">
                    <FinancialsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />
                    <MainSummaryCards
                        cashflowData={cashflowData}
                        trendData={trendData}
                    />
                    <QuickActions />
                </ScaffoldContainer>
            </div>
        </div>
    )
}