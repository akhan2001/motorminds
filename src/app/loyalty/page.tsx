"use client"

import { Nav } from "@/app/components/nav"
import LoyaltyDashboard from "@/app/loyalty/components/loyalty-dashboard"
import LoadingPage from "@/components/loading"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId } from "@/utils/supabase/supabase-shop"
import router from "next/router"
import { useEffect, useState, useRef } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useMiaSidebar } from "@/contexts/MiaSidebarContext"
import MiaWorkspace from "@/app/components/mia-sidebar/MiaWorkspace"

export default function Loyalty() {
    const [user, setUser] = useState<any>(null);
    const [shopId, setShopId] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const { isOpen, setCurrentPage } = useMiaSidebar();

    // Authenticate the user and get the shop ID
    useEffect(() => { 
        async function loadData() {
            try {
                setIsLoading(true)
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
                setIsLoading(false)
            } catch (error) {
                console.error("Authentication error:", error);
                router.push("/login");
            }
        }
        loadData();
    }, []);

    // Set current page for MIA context
    useEffect(() => {
        setCurrentPage('loyalty');
    }, [setCurrentPage]);

    if (isLoading) {
        return <LoadingPage page="Loyalty" />
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
            <Nav />

            {/* Full-width resizable area */}
            <ResizablePanelGroup
                direction="horizontal"
                className="flex-1 w-full rounded-none overflow-hidden min-h-0"
            >
                <ResizablePanel defaultSize={isOpen ? 65 : 100} minSize={30} className="min-w-0 min-h-0">
                    <div className="h-full px-4 py-4 min-h-0">
                        <div className="h-full w-full border border-[#1f1f1f] rounded-md overflow-y-auto">
                            <LoyaltyDashboard shopId={shopId || ""} />
                        </div>
                    </div>
                </ResizablePanel>

                {isOpen && (
                    <>
                        <ResizableHandle withHandle className="bg-[#1f1f1f]" />
                        <ResizablePanel defaultSize={35} minSize={30} maxSize={40} className="min-w-[320px] min-h-0">
                            <div className="h-full min-h-0">
                                <div className="h-full w-full bg-[#0d0d0d] overflow-hidden">
                                    <MiaWorkspace 
                                        currentPage="loyalty"
                                        shopId={shopId}
                                        className="h-full"
                                    />
                                </div>
                            </div>
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    )
}