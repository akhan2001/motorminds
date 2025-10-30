'use client'

import { useEffect } from 'react'
import { Nav } from '@/app/components/nav'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { LayoutSidebarProvider } from '@/components/ui/AIAssistantPanel/LayoutSidebarProvider'
import { LayoutSidebar } from '@/components/ui/AIAssistantPanel'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import { SIDEBAR_KEYS } from '@/components/ui/AIAssistantPanel/LayoutSidebarProvider'

function OperationsDashboardContent() {
    const { openSidebar, closeSidebar, getActiveSidebar } = useSidebarManagerSnapshot()
    const activeSidebar = getActiveSidebar()

    // Listen for custom event from nav button
    useEffect(() => {
        const handleToggleAI = () => {
            if (activeSidebar?.key === SIDEBAR_KEYS.AI_ASSISTANT) {
                closeSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
            } else {
                openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
            }
        }

        window.addEventListener('toggle-ai-panel', handleToggleAI)
        return () => window.removeEventListener('toggle-ai-panel', handleToggleAI)
    }, [activeSidebar, openSidebar, closeSidebar])

    return (
        <div className="flex h-screen bg-black text-white flex-col">
            {/* Navbar - Always on top */}
            <Nav />

            {/* Bottom Dashboard Section */}
            <div className="flex-1 flex min-h-0">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Main Content Area (Left) */}
                    <ResizablePanel defaultSize={activeSidebar ? 70 : 100} minSize={50}>
                        <div className="h-full bg-[#0d0d0d] p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold">Operations Dashboard</h1>
                                    <p className="text-gray-400 text-sm">Welcome back! Here's what's happening today.</p>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-6 h-[calc(100%-120px)]">
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <h2 className="text-xl font-semibold text-gray-300 mb-2">Operations Center</h2>
                                        <p className="text-gray-500">Main operations content will go here</p>
                                        <p className="text-gray-500 text-sm mt-2">Appointments, work orders, customers, etc.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>

                    {/* AI Assistant Panel (Right) */}
                    {activeSidebar && (
                        <>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={30} minSize={25} maxSize={40} className="flex flex-col h-full min-h-0">
                                <LayoutSidebar />
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            </div>
        </div>
    )
}

export default function OperationsDashboard() {
    return (
        <LayoutSidebarProvider>
            <OperationsDashboardContent />
        </LayoutSidebarProvider>
    )
}