"use client"

import { Nav } from "@/app/components/nav"
<<<<<<< HEAD
import LoadingPage from "@/components/loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { ArrowRight, Facebook, Instagram } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import Inbox from "./components/Inbox"
import FacebookConnect from "./components/FacebookConnect"

export default function Messages() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [shopId, setShopId] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

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
                        // check if facebook/ig connected
                        const { data } = await supabase
                            .from("connected_pages")
                            .select("id")
                            .eq("shop_id", shopId)
                            .limit(1)
                            .maybeSingle();
                        setIsConnected(!!data);
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
                            {/* <h3 className="text-lg font-medium mb-1 text-white">Send and Receive Facebook and Instagram messages</h3> */}
                            <p className="text-gray-400">
                            Create a message to send to your customers by instagram and facebook. In order to use this feature, your IG profile must be a Professional account (Business/Creator) and connected to the Facebook Page.
                            </p>
                                    
                            {isConnected ? (
                                <Inbox shopId={shopId} />
                            ) : (
                             <Card className="bg-[#111] border-[#222] mt-4">
                                <CardContent className="p-6 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium mb-1 text-white">Connect your Facebook / Instagram account</h3>
                                    <p className="text-gray-400">
                                    Link your shop's Facebook Page and Instagram Business profile to MotorMinds so you can receive and reply to customer messages in one place.
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src="/icons8-facebook-50.png" alt="Facebook" />
                                            <AvatarFallback>
                                                <Facebook className="h-3 w-3" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" />
                                            <AvatarFallback>
                                                <Instagram className="h-3 w-3" />
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    {shopId && <FacebookConnect shopId={shopId} />}

                                    {/* <Button
                                        variant="ghost"
                                        className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10"
                                        onClick={() => {
                                            const url = shopId ? `/api/auth/meta/start?shopId=${shopId}` : "/api/auth/meta/start";
                                            router.push(url);
                                        }}
                                    >
                                        Connect
                                        <ArrowRight className="h-4 w-4" />
                                    </Button> */}
                                </div>
                                </CardContent>
                            </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
=======

export default function Messages() {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav />
            <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="bg-[#1a1a1a] p-8 rounded-lg border border-[#333] shadow-lg max-w-md w-full">
                    <h1 className="text-4xl font-bold text-white mb-4">Coming Soon</h1>
                    <p className="text-lg text-gray-400">
                        Our new messaging platform is under construction.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Stay tuned for updates!
                    </p>
                </div>
            </main>
>>>>>>> a16e48365ee5d589199a4c57313b4c5d972d50a6
        </div>
    )
}