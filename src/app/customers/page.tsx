'use client'

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
            <div className="flex flex-col h-full bg-background text-foreground">
                {/* <CustomersTableLoading /> */}
            </div>
        )
    }

    if (!shopId) {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <div className="flex justify-center items-center h-[80vh]">
                    <p className="text-foreground">No shop found for this user.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background text-foreground">
            <CustomerDashboard shopId={shopId} user={user} />
        </div>
    )
}