'use client'

import { Nav } from "../components/nav"
import { useEffect, useState } from "react"
import { getLeads } from "./utils/lead"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { useRouter } from "next/navigation"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { LeadDashboard } from "./components/lead-dashboard"
import LoadingPage from "@/components/loading"

export default function LeadGenerationPage() {
	const router = useRouter()
	const [shopId, setShopId] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
        async function fetchUserData() {
            setIsLoading(true)
            try {
                const userData = await checkUser()
                if (userData) {
                    setUser(userData)
                    const shop = await getShopId(userData.id)
                    setShopId(shop)
                } else {
                    router.push('/login')
                }
            } catch (error) {
                console.error('Error:', error)
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }
        
        fetchUserData()
    }, [router])

	if (isLoading) {
        return (
            <LoadingPage page="Lead Generation" />
        )
    }

    if (!shopId) {
        return (
            <div className="flex flex-col min-h-screen bg-black text-white">
                <Nav activeLink="Customers" />
                <div className="flex justify-center items-center h-[80vh]">
                    <p>No shop found for this user.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Lead Generation" />

            <LeadDashboard shopId={shopId} user={user} />
		</div>
	)
}
