"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/app/components/nav";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";
import { checkUser } from "@/utils/supabase/supabase-auth";
import { getShopId } from "@/utils/supabase/supabase-shop";
import BreadcrumbNav from "./components/BreadcrumbNav";
import RevenueTrendChart from "./components/RevenueTrendChart";
import StatementsTable from "./components/StatementsTable";
import RevenueCompositionChart from "./components/RevenueCompositionChart";
import FinancialsHeader from "./components/FinancialsHeader";

export default function RevenuePage() {
    const [statements, setStatements] = useState([]);
    const [trendData, setTrendData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [shopId, setShopId] = useState<string | null>(null);
    const router = useRouter();

    async function fetchData() {
        if (!shopId) return;
        setIsLoading(true);
        try {
            const [statementsRes, trendRes] = await Promise.all([
                fetch(`/api/financials/revenue-statements?shop_id=${shopId}`),
                fetch(`/api/financials/revenue-trend?shop_id=${shopId}`)
            ]);

            if (!statementsRes.ok || !trendRes.ok) {
                throw new Error('Failed to fetch revenue data');
            }

            const statementsData = await statementsRes.json();
            const trendData = await trendRes.json();

            setStatements(statementsData);
            setTrendData(trendData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

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
        fetchData();
    }, [shopId]);

    const handleGenerateStatement = async () => {
        if (!shopId) return;
        setIsGenerating(true);

        const endDate = new Date();
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

        try {
            const response = await fetch('/api/financials/revenue-statements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shop_id: shopId,
                    period_start_date: startDate.toISOString().split('T')[0],
                    period_end_date: endDate.toISOString().split('T')[0],
                }),
            });

            if (!response.ok) throw new Error('Failed to generate statement');

            await fetchData(); // Refresh data after generating
        } catch (error) {
            console.error(error);
            alert("An error occurred while generating the statement.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    // Add skeleton loader here if you want
    
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Financials" />
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                <BreadcrumbNav />

                <div className="flex items-center justify-between my-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Revenue Analysis</h1>
                        <p className="text-gray-400">Track monthly performance and trends.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button 
                            onClick={handleGenerateStatement} 
                            disabled={isGenerating}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            {isGenerating ? 'Generating...' : 'Generate Current Month Statement'}
                        </Button>
                        <Button className="bg-[#E53935] hover:bg-[#c62828] text-white">
                            <FileText className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>

                <FinancialsHeader statements={statements} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2">
                        {isLoading || !trendData ? (
                            <div className="animate-pulse h-96 bg-[#1a1a1a] rounded-xl"></div>
                        ) : (
                            <RevenueTrendChart data={trendData} />
                        )}
                    </div>
                    <div>
                         {isLoading ? (
                            <div className="animate-pulse h-96 bg-[#1a1a1a] rounded-xl"></div>
                        ) : (
                            <RevenueCompositionChart statements={statements} />
                        )}
                    </div>
                </div>

                {isLoading ? (
                     <div className="animate-pulse h-96 bg-[#1a1a1a] rounded-xl"></div>
                ) : (
                    <StatementsTable statements={statements} />
                )}
            </main>
        </div>
    );
}
