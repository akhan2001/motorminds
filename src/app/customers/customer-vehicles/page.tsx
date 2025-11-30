'use client'

// import { Nav } from '@/components/navigation/nav'
import { checkUser } from '@/utils/supabase/supabase-auth'
import { getShopId } from '@/utils/supabase/supabase-shop'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { VehicleTable } from './components/VehicleTable'

export default function VehiclesPage() {
    const [user, setUser] = useState<any>(null)
    const [shopId, setShopId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

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
            <div className="flex flex-col min-h-screen bg-black text-white">
                {/* <Nav/> */}
                <div className="flex justify-center items-center h-[80vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                </div>
            </div>
        )
    }

    if (!shopId) {
        return (
            <div className="flex flex-col min-h-screen bg-black text-white">
                {/* <Nav/> */}
                <div className="flex justify-center items-center h-[80vh]">
                    <p>No shop found for this user.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            {/* <Nav/> */}
            <main className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">All Vehicles</h1>
                </div>
                <VehicleTable shopId={shopId} />
            </main>
        </div>
    )
}