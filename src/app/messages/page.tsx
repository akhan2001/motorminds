"use client"

import { Nav } from "@/app/components/nav"
import LoadingPage from "@/components/loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { ArrowRight, Facebook, Instagram, MessageSquare, Phone, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import Inbox from "./components/Inbox"
import FacebookConnect from "./components/FacebookConnect"
import TwilioMessaging from "./components/TwilioMessaging"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import FacebookSdk from "@/app/components/FacebookSdk"

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
        return <LoadingPage />
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Nav />
            <div className="flex items-center justify-center py-4 sm:py-8 px-4 sm:px-6">
                <div className="container mx-auto max-w-[1300px]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
                        <div className="flex flex-col w-full">
                            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2 text-foreground">Messages</h1>
                            <p className="text-muted-foreground mb-6">
                                Communicate with your customers through SMS and social media platforms.
                            </p>
                                    
                            <Tabs defaultValue="sms" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-slate-50 dark:bg-muted">
                                    <TabsTrigger value="sms" className="data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-red-600 hover:bg-muted">
                                        <Phone className="h-4 w-4 mr-2" />
                                        SMS Messages
                                    </TabsTrigger>
                                    <TabsTrigger value="social" className="data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-red-600 hover:bg-muted">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Social Media
                                    </TabsTrigger>
                                    <TabsTrigger value="automated" className="data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-red-600 hover:bg-muted">
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Automated
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="sms" className="mt-6">
                                    {shopId && <TwilioMessaging shopId={shopId} />}
                                </TabsContent>

                                <TabsContent value="automated" className="mt-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-medium mb-2 text-foreground">Automated Follow-Up Messages</h3>
                                            <p className="text-muted-foreground mb-4">
                                                Set up automated follow-up messages that are sent to customers after work order completion.
                                            </p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Card className="bg-slate-50 dark:bg-card border-border">
                                                <CardContent className="p-6">
                                                    <h4 className="text-md font-medium mb-2 text-foreground">Message Templates</h4>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Create and manage automated message templates with custom delays
                                                    </p>
                                                    <Link href="/messaging/templates">
                                                        <Button className="w-full">
                                                            Manage Templates
                                                            <ArrowRight className="h-4 w-4 ml-2" />
                                                        </Button>
                                                    </Link>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-slate-50 dark:bg-card border-border">
                                                <CardContent className="p-6">
                                                    <h4 className="text-md font-medium mb-2 text-foreground">Message Queue</h4>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        View and manage scheduled follow-up messages
                                                    </p>
                                                    <Link href="/messaging/queue">
                                                        <Button variant="outline" className="w-full">
                                                            View Queue
                                                            <ArrowRight className="h-4 w-4 ml-2" />
                                                        </Button>
                                                    </Link>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="social" className="mt-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-medium mb-2 text-foreground">Social Media Messaging</h3>
                                            <p className="text-muted-foreground mb-4">
                                                Connect your Facebook and Instagram accounts to receive and reply to customer messages in one place.
                                                Your Instagram profile must be a Professional account (Business/Creator) and connected to a Facebook Page.
                                            </p>
                                        </div>
                                        
                                        {isConnected ? (
                                            <Inbox shopId={shopId} />
                                        ) : (
                                            <Card className="bg-slate-50 dark:bg-card border-border">
                                                <CardContent className="p-6 flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-lg font-medium mb-1 text-foreground">Connect your Facebook / Instagram account</h3>
                                                        <p className="text-muted-foreground">
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
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="ai" className="mt-6">
                                    <Card className="bg-slate-50 dark:bg-card border-border">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-2">
                                                    <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold mb-2 text-foreground">AI Messaging</h3>
                                                    <p className="text-muted-foreground mb-6 max-w-md">
                                                        Automate your customer communications with AI-powered messaging. Set up automated messages 
                                                        based on triggers like work order completion or appointment scheduling, and create 
                                                        mass send campaigns to reach multiple customers at once.
                                                    </p>
                                                </div>
                                                <Link href="/messaging/ai-messaging">
                                                    <Button className="gap-2">
                                                        Go to AI Messaging
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
            <FacebookSdk />
        </div>
    )
}
