'use client'

import { Nav } from '@/app/components/nav'
import { checkUser } from '@/utils/supabase/supabase-auth'
import { getShopId } from '@/utils/supabase/supabase-shop'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingPage from '@/components/loading'
import MessagesSidebar from './components/MessagesSidebar'
import MessagePanel from './components/MessagePanel'

export default function MessagesPage() {
    const [shopId, setShopId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeConversation, setActiveConversation] = useState(null)
    const router = useRouter()

    useEffect(() => {
        async function fetchUserData() {
            setIsLoading(true)
            try {
                const userData = await checkUser()
                if (userData) {
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
            <LoadingPage page="Messages" />
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
        <div className="min-h-screen bg-black text-white">
            <div className="pb-16">
                <Nav activeLink="Messages" />
            </div>
            <div className="max-w-[1400px] mx-auto flex border border-[#1f1f1f] rounded-lg overflow-hidden">
                <MessagesSidebar
                    onSelect={(convo) => setActiveConversation(convo)}
                    activeId={activeConversation?.id || null}
                />
                <MessagePanel conversation={activeConversation} />
            </div>
        </div>
    )
}
