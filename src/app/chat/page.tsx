'use client'

// ============================================================================
// ORIGINAL CHAT PAGE - COMMENTED OUT
// ============================================================================
/*
import { Nav } from "../components/nav";
import { ChatWindow } from "./components/ChatWindow";
import ChatStart from "./components/ChatStart";
import ChatNotification from "./components/ChatNotification";
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "@/components/loading"

export default function Page() {
	const [user, setUser] = useState<any>(null);
	const [shopId, setShopId] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const user = await checkUser()
                if (user) {
                    setUser(user)
                    console.log(user.id)
                    const shopId = await getShopId(user.id)
                    if (shopId) {
                        setShopId(shopId)
                    } else {
                        console.error("No shop ID found")
                        router.push("/login");
                    }
                } else {
                    console.error("No user found")
                    router.push("/login");
                }
                setIsLoading(false);
            } catch (error) {
                console.error("Authentication error:", error);
                router.push("/login");
            }
        }
        loadData()
    }, [])

    if (isLoading) {
        return <LoadingPage />
    }

	return (
		<div className="h-screen bg-black">
			<Nav />
			<ChatWindow 
				endpoint="api/chat"
				placeholder="Ask me anything..."
				emptyStateComponent={<ChatStart />}
				shopId={shopId}
			/>
		</div>
	);
}
*/
// ============================================================================
// END OF ORIGINAL CHAT PAGE
// ============================================================================

// New AI Diagnostics Chat Page with 3-Column Layout
import { Nav } from "../components/nav";
import { MIAThreeColumnLayout } from "./components/MIAThreeColumnLayout";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/feedback/loading-states";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/core/useAuth";

export default function Page() {
	const { user, shopId, isLoading, error } = useAuth();
    
    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <LoadingSpinner size="md" className="text-blue-500" />
                            <div>
                                <p className="text-foreground font-medium">Loading Mia Diagnostics</p>
                                <p className="text-muted-foreground text-sm">Initializing Mia Diagnostics...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="text-foreground font-medium">Failed to Load Mia Diagnostics</p>
                                <p className="text-muted-foreground text-sm mb-3">
                                    {error && typeof error === 'object' && 'message' in error ? (error as Error).message : 'Unknown error occurred'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Don't render main content if we don't have authentication data
    if (!shopId || !user) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            <div>
                                <p className="text-foreground font-medium">Authentication Required</p>
                                <p className="text-muted-foreground text-sm mb-3">
                                    Unable to access Mia Diagnostics. Please ensure you are logged in.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

	return (
		<div className="h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
			<Nav />
			<div className="flex-1 overflow-hidden">
				<MIAThreeColumnLayout shopId={shopId} />
			</div>
		</div>
	);
}