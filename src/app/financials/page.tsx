"use client"

import { Nav } from "@/app/components/nav"
import LoadingPage from "@/components/loading"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FinancialSummaryCard } from "./components/FinancialSummaryCard"
import { PayrollSummaryCard } from "./components/PayrollSummaryCard"
import RevenueChart from "./components/RevenueChart"

export default function Financials() {
    const [user, setUser] = useState<any>(null);
    const [shopId, setShopId] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cashflowData, setCashflowData] = useState<any>(null);
    const [payrollData, setPayrollData] = useState<any>(null);
    const [trendData, setTrendData] = useState<any[]>([]);

    // Default to the last 30 days
    const [startDate, setStartDate] = useState(
        new Date(new Date().setDate(new Date().getDate() - 30))
            .toISOString()
            .split("T")[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const router = useRouter();

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

        async function fetchFinancials() {
            setIsLoading(true);
            try {
                // Fetch cashflow data
                const cashflowRes = await fetch(
                    `/api/financials/cashflow?shop_id=${shopId}&start_date=${startDate}&end_date=${endDate}`
                );
                if (!cashflowRes.ok) throw new Error("Failed to fetch cashflow data");
                const cashflow = await cashflowRes.json();
                setCashflowData(cashflow);

                // Fetch payroll data
                const payrollRes = await fetch(`/api/financials/payroll?shop_id=${shopId}`);
                if (!payrollRes.ok) throw new Error("Failed to fetch payroll data");
                const payroll = await payrollRes.json();
                setPayrollData(payroll);

                // Fetch revenue trend (last 12 months)
                const trendRes = await fetch(`/api/financials/revenue-trend?shop_id=${shopId}&period=month&span=12`);
                if (trendRes.ok) {
                    const trendJson = await trendRes.json();
                    setTrendData(trendJson);
                }
            } catch (error) {
                console.error("Error fetching financial data:", error);
                // Handle error display to the user
            } finally {
                setIsLoading(false);
            }
        }

        fetchFinancials();
    }, [shopId, startDate, endDate]);

    if (isLoading || !user || !shopId) {
        return <LoadingPage page="Financials" />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Financials" />
            <main className="flex flex-1 items-center justify-center px-4 py-4 sm:px-6 sm:py-8">
                <div className="container mx-auto w-full max-w-[1300px]">
                    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-10 sm:flex-row sm:items-center">
                        <div className="flex flex-col">
                            <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
                                Financial Dashboard
                            </h1>
                            <p className="text-sm text-gray-400 sm:text-base">
                                An overview of your shop's financial performance.
                            </p>
                        </div>
                    </div>

                    {/* TODO: Add Date Range Picker here */}

                    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {cashflowData ? (
                            <FinancialSummaryCard data={cashflowData} />
                        ) : (
                            <div className="animate-pulse rounded-lg border border-[#222] bg-[#131313] p-6">
                                <div className="mb-4 h-8 w-3/4 rounded bg-gray-700"></div>
                                <div className="h-4 w-1/2 rounded bg-gray-700"></div>
                            </div>
                        )}
                        {payrollData ? (
                            <PayrollSummaryCard data={payrollData} />
                        ) : (
                            <div className="animate-pulse rounded-lg border border-[#222] bg-[#131313] p-6">
                                <div className="mb-4 h-8 w-3/4 rounded bg-gray-700"></div>
                                <div className="h-4 w-1/2 rounded bg-gray-700"></div>
                            </div>
                        )}
                        {/* Placeholder for another card */}
                        <div className="rounded-lg border border-[#222] bg-[#131313] p-6 h-full">
                            <h2 className="text-xl font-semibold mb-4">Revenue vs COGS</h2>
                            <RevenueChart data={trendData} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}