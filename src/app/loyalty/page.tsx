"use client"

import { Nav } from "@/app/components/nav"
import LoyaltyDashboard from "@/app/loyalty/components/loyalty-dashboard"
import LoadingPage from "@/components/loading"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId } from "@/utils/supabase/supabase-shop"
import router from "next/router"
import { useEffect, useState } from "react"

export default function Loyalty() {
    const [user, setUser] = useState<any>(null);
    const [shopId, setShopId] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

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

    if (isLoading) {
        return <LoadingPage page="Loyalty" />
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Loyalty" />
            <LoyaltyDashboard shopId={shopId || ""}/>
        </div>
  )
}