"use client"

import { Nav } from "@/app/components/nav"
import LoadingPage from "@/components/loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { ArrowRight } from "lucide-react"
import router from "next/router"
import { useEffect, useState } from "react"

export default function Messages() {
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
        return <LoadingPage page="Messages" />
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Messages" />
            <div className="flex items-center justify-center py-4 sm:py-8 px-4 sm:px-6">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">Messages</h1>

                        {/* Create a reward card */}
                        <Card className="bg-[#111] border-[#222] mt-4">
                            <CardContent className="p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium mb-1 text-white">Send and Receive Facebook and Instagram messages</h3>
                                <p className="text-gray-400">
                                Create a message to send to your customers by instagram and facebook. In order to use this feature, your IG profile must be a Professional account (Business/Creator) and connected to the Facebook Page.
                                </p>
                            </div>
                            {/* <Button variant="ghost" className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10" onClick={() => router.push("/messages/create")}>Get started<ArrowRight className="h-4 w-4" />
                            </Button> */}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}