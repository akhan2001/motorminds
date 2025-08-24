'use client'

import { Nav } from '@/app/components/nav'
import InvoiceDashboard from './components/invoice-dashboard'
import { checkUser } from '@/utils/supabase/supabase-auth'
import { getShopId } from '@/utils/supabase/supabase-shop'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingPage from '@/components/loading'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useMiaSidebar } from '@/contexts/MiaSidebarContext'
import MiaWorkspace from '../components/mia-sidebar/MiaWorkspace'

export default function InvoicesPage() {
    const [shopId, setShopId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [groupHeight, setGroupHeight] = useState<number>(0)
    const headerRef = useRef<HTMLDivElement | null>(null)
    const router = useRouter()

    // Use Mia context for toggle state
    const { isOpen, openSidebar, closeSidebar, setCurrentPage } = useMiaSidebar() as any

    useEffect(() => {
        setCurrentPage('invoices')
        // Ensure invoices starts closed; MiaButton in nav will open it
        closeSidebar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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

    useEffect(() => {
        const calc = () => {
            const nav = document.querySelector('header') as HTMLElement | null
            const navH = nav?.offsetHeight ?? 0
            const hdrH = headerRef.current?.offsetHeight ?? 0
            const vh = window.innerHeight
            setGroupHeight(Math.max(0, vh - navH - hdrH))
        }
        calc()
        window.addEventListener('resize', calc)
        return () => window.removeEventListener('resize', calc)
    }, [])

    if (isLoading) {
        return <LoadingPage />
    }

    if (!shopId) {
        return (
            <div className="flex flex-col min-h-screen bg-black text-white">
                <Nav />
                <div className="flex justify-center items-center h-[80vh]">
                    <p>No shop found for this user.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav />

            {/* Header controls */}
            {/* <div ref={headerRef} className="px-4 py-3">
                <h1 className="text-2xl font-bold">Invoices</h1>
            </div> */}

            {/* Full-width resizable area */}
            <ResizablePanelGroup
                direction="horizontal"
                className="w-full rounded-none overflow-hidden min-h-0"
                style={{ height: groupHeight || undefined, minHeight: groupHeight || undefined }}
            >
                <ResizablePanel defaultSize={isOpen ? 65 : 100} minSize={30} className="min-w-0 min-h-0">
                    <div className="h-full px-4 py-4 min-h-0">
                        <div className="h-full w-full border border-[#1f1f1f] rounded-md overflow-y-auto">
                            <InvoiceDashboard shopId={shopId} searchParams={null} />
                        </div>
                    </div>
                </ResizablePanel>

                {isOpen && (
                    <>
                        <ResizableHandle withHandle className="bg-[#1f1f1f]" />
                        <ResizablePanel defaultSize={35} minSize={30} maxSize={40} className="min-w-[320px] min-h-0">
                            <div className="h-full min-h-0">
                                <div className="h-full w-full bg-[#0d0d0d] overflow-hidden">
                                    <MiaWorkspace 
                                        currentPage="invoices"
                                        shopId={shopId}
                                        className="h-full"
                                    />
                                </div>
                            </div>
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    )
}