"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/app/components/nav";
import { checkUser } from "@/utils/supabase/supabase-auth";
import { getShopId } from "@/utils/supabase/supabase-shop";
import FinancialsHeader from "./components/FinancialsHeader";
import MainSummaryCards from "./components/MainSummaryCards";
import QuickActions from "./components/QuickActions";
import LoadingSkeleton from "./components/LoadingSkeleton";

export default function Financials() {
    const [isLoading, setIsLoading] = useState(true);
    const [shopId, setShopId] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState("30d");
    const router = useRouter();

    // State for holding fetched data
    const [cashflowData, setCashflowData] = useState({ revenue: 0, total_costs: 0 });
    const [payrollData, setPayrollData] = useState({ total_monthly_payroll: 0, employee_count: 0 });
    const [trendData, setTrendData] = useState([]);

    // Get shop_id on initial load
    useEffect(() => {
        const fetchShopId = async () => {
            const user = await checkUser();
            if (!user) {
                router.push("/login");
                return;
            }
            const id = await getShopId(user.id);
            if (id) {
                setShopId(id);
            } else {
                router.push("/dashboard");
            }
        };
        fetchShopId();
    }, [router]);

    // Fetch all financial data when shopId or timeRange changes
    useEffect(() => {
        if (!shopId) return;

        const fetchFinancials = async () => {
            setIsLoading(true);

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
                const [payrollRes, efficiencyRes] = await Promise.all([
                    fetch(`/api/financials/payroll?shop_id=${shopId}`),
                    fetch(`/api/financials/efficiency?shop_id=${shopId}&start_date=${start}&end_date=${end}`)
                ]);

                if (payrollRes.ok) {
                    const data = await payrollRes.json();
                    setPayrollData({
                        total_monthly_payroll: data.totalMonthlyPayroll,
                        employee_count: data.numberOfEmployees,
                    });
                }

                if (efficiencyRes.ok) {
                    const data = await efficiencyRes.json();
                    setCashflowData({
                        revenue: data.totalRevenue,
                        total_costs: data.totalCogs + data.totalPayroll + data.totalFixedCosts,
                    });
                    setTrendData(data.historicalData);
                }

            } catch (error) {
                console.error("Failed to fetch financial data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFinancials();
    }, [shopId, timeRange]);
    
    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-black text-white">
                <Nav activeLink="Financials" />
                <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                    <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
                        <span className="font-semibold text-white">Financials Dashboard</span>
                    </nav>
                    <LoadingSkeleton />
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Financials" />
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
                    <span className="font-semibold text-white">Financials Dashboard</span>
                </nav>
				
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">Financial Dashboard</h1>
						<p className="text-gray-400">Complete overview of your shop's financial performance</p>
					</div>
				</div>

                {/* <FinancialsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} /> */}

                <MainSummaryCards
                    cashflowData={cashflowData}
                    payrollData={payrollData}
                    trendData={trendData}
                />
                
                <QuickActions />

            </main>
        </div>
    )
}