'use client'

import { Nav } from "../components/nav";
import { ChatWindow } from "../components/ChatWindow";
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
	const [showNotification, setShowNotification] = useState(true);
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
        return <LoadingPage page="Chat" />
    }

	return (
		<div className="h-screen bg-black">
			<Nav activeLink="Mia AI" />
			{showNotification && (
				<ChatNotification 
					message="Try saying 'Create a customer for John Doe' to see our new AI-powered form creation!"
				/>
			)}
			<ChatWindow 
				endpoint="api/chat"
				placeholder="Ask me anything..."
				emptyStateComponent={<ChatStart />}
				shopId={shopId}
			/>
		</div>
	);
}