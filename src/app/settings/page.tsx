"use client"

import { ProfileForm } from "@/app/settings/profile-form"
import { Nav } from "../components/nav"
import { checkUser } from '@/utils/supabase/supabase-auth'
import { getShopId } from '@/utils/supabase/supabase-shop'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingPage from "@/components/loading"
import { useQuery } from '@tanstack/react-query'

export default function SettingsProfilePage() {
    const [user, setUser] = useState<any>(null)
    const [shopId, setShopId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Use React Query for user and shop data
    const { data: userData, isLoading: isUserLoading } = useQuery({
        queryKey: ['user-data'],
        queryFn: async () => {
            const user = await checkUser()
            if (!user) {
                router.push('/login')
                return null
            }
            return user
        },
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const { data: shopIdData, isLoading: isShopIdLoading } = useQuery({
        queryKey: ['shop-id', userData?.id],
        queryFn: async () => {
            if (!userData?.id) return null
            const shop = await getShopId(userData.id)
            return shop
        },
        enabled: !!userData?.id,
        retry: false,
        staleTime: 1000 * 60 * 10, // 10 minutes
    })

    // Update local state when React Query data changes
    useEffect(() => {
        if (userData) {
            setUser(userData)
        }
    }, [userData])

    useEffect(() => {
        if (shopIdData) {
            setShopId(shopIdData)
        }
    }, [shopIdData])

    useEffect(() => {
        // Set loading state based on React Query loading states
        setIsLoading(isUserLoading || isShopIdLoading)
    }, [isUserLoading, isShopIdLoading])

    if (isLoading) {
        return <LoadingPage />
    }

    if (!shopId) {
        router.push('/login')
        return null
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav />
            <div className="p-4 space-y-6">
                {shopId && <ProfileForm shopId={shopId} />}
                {/*{shopId && <AddEmployeeForm shopId={shopId} />}*/}
            </div>
        </div>
    )
}