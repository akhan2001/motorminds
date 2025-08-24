"use client"

import { Nav } from '@/app/components/nav'
import { useEffect, useState } from 'react'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from '@/components/ui/button'

export default function OBDPage() {
    const [showMia, setShowMia] = useState(true)
    const [groupHeight, setGroupHeight] = useState<number>(0)

    useEffect(() => {
        const calc = () => {
            const header = document.querySelector('header') as HTMLElement | null
            const navH = header?.offsetHeight ?? 0
            const vh = window.innerHeight
            setGroupHeight(Math.max(0, vh - navH))
        }
        calc()
        window.addEventListener('resize', calc)
        return () => window.removeEventListener('resize', calc)
    }, [])

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav />
            {/* Main area below fixed navbar */}
            <div className="flex-1">
                {/* Header controls - full width */}
                <div className="px-4 py-3 mx-[5%]">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold">OBD Test Layout</h1>
                        <Button
                            variant="outline"
                            className="bg-[#0d0d0d] border-[#1f1f1f] text-white hover:bg-white/10"
                            onClick={() => setShowMia((v) => !v)}
                        >
                            {showMia ? 'Hide Mia' : 'Show Mia'}
                        </Button>
                    </div>
                </div>

                {/* Full-width resizable area */}
                <div className="h-full mx-[5%]">
                    <ResizablePanelGroup
                        direction="horizontal"
                        className="w-full rounded-none overflow-hidden"
                        style={{ height: groupHeight ? groupHeight - 64 : undefined, minHeight: groupHeight ? groupHeight - 64 : undefined }}
                    >
                        {/* Left: dashboard placeholder */}
                        <ResizablePanel defaultSize={showMia ? 65 : 100} minSize={30} className="min-w-0">
                            <div className="h-full p-4">
                                <div className="h-full w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-md flex items-center justify-center text-[#979797]">
                                    Left: Dashboard (empty)
                                </div>
                            </div>
                        </ResizablePanel>

                        {showMia && (
                            <>
                                <ResizableHandle withHandle className="bg-[#1f1f1f]" />
                                {/* Right: Mia sidebar placeholder */}
                                <ResizablePanel defaultSize={35} minSize={30} maxSize={40} className="min-w-[280px]">
                                    <div className="h-full p-4">
                                        <div className="h-full w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-md flex items-center justify-center text-[#979797]">
                                            Right: Mia Sidebar (resizable)
                                        </div>
                                    </div>
                                </ResizablePanel>
                            </>
                        )}
                    </ResizablePanelGroup>
                </div>
            </div>
        </div>
    )
}
  