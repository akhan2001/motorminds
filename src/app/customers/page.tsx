'use client'

import { Nav } from '@/app/components/nav'
import { CustomerDashboard } from './components/customer-dashboard'
import { checkUser } from '@/utils/supabase/supabase-auth'
import { getShopId } from '@/utils/supabase/supabase-shop'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomersTableLoading } from './components/customers-table-loading'

export default function CustomersPage() {
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
                <Nav activeLink="Customers" />
                <CustomersTableLoading />
            </div>
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
            <Nav activeLink="Customers" />
            <CustomerDashboard shopId={shopId} user={user} />
        </div>
    )
}