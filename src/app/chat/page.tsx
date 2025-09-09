'use client'

import { Nav } from "../components/nav";
import { ChatWindow } from "./components/ChatWindow";
import ChatStart from "./components/ChatStart";
import ChatNotification from "./components/ChatNotification";
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "@/components/loading"
import ChatNotifications from './components/ChatNotifications';
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight } from "lucide-react";

export default function Page() {
	const [user, setUser] = useState<any>(null);
	const [shopId, setShopId] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showNotification, setShowNotification] = useState(true);
	const router = useRouter();

	const notifications = [
		{ id: '1', message: "Try saying 'Create a customer for John Doe' to see our new AI-powered form creation!" },
		{ id: '2', message: "Try saying 'Send a message to @customer_name' to see our new AI-powered message sending!" }
	];

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
        return <LoadingPage page="Chat" />
    }

	return (
		<div className="h-screen bg-black">
			<Nav activeLink="Mia AI" />
			
			{/* MIA Diagnostics Header Button */}
			<div className="bg-gradient-to-r from-[#f52f2f] to-[#ff4444] border-b border-[#333333]">
				<div className="max-w-4xl mx-auto px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Wrench size={20} className="text-white" />
							<span className="text-white font-medium text-sm">
								🚗 Diagnostics is in testing! Check it out!
							</span>
						</div>
						<Button
							onClick={() => router.push('/mia')}
							className="bg-white text-[#f52f2f] hover:bg-gray-100 font-medium text-sm px-4 py-2 h-auto"
						>
							Try MIA Diagnostics
							<ArrowRight size={16} className="ml-2" />
						</Button>
					</div>
				</div>
			</div>
			
			<ChatNotifications notifications={notifications} />
			<ChatWindow 
				endpoint="api/chat"
				placeholder="Ask me anything..."
				emptyStateComponent={<ChatStart />}
				shopId={shopId}
			/>
		</div>
	);
}