'use client'

import React from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Nav } from "../../components/nav"
import { PartsOrderingProvider } from './context/PartsOrderingContext'
import { VehicleSelection } from './components/VehicleSelection'
import { PartsSelection } from './components/PartsSelection'
import { ChatPanel } from './components/Chat'

export default function PartsOrdering() {
    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 overflow-hidden">
                <PartsOrderingProvider>
                    <ResizablePanelGroup direction="horizontal" className="h-full">
                        <ResizablePanel defaultSize={60} minSize={55} maxSize={65}>
                            <div className="h-full bg-black border-r border-gray-800 overflow-y-auto">
                                <div className="p-6">
                                    <VehicleSelection />
                                    <PartsSelection />
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        <ResizablePanel defaultSize={40} minSize={35} maxSize={45}>
                            <ChatPanel />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </PartsOrderingProvider>
            </div>
        </div>
    )
}
