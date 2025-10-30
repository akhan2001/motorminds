"use client"

import { useMemo } from 'react'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

function ResizablePanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={className}>{children}</div>
}

export function LayoutSidebar() {
    const { getActiveSidebar } = useSidebarManagerSnapshot()
    const activeSidebar = useMemo(() => getActiveSidebar(), [getActiveSidebar])
    if (!activeSidebar) return null
    return (
        <ResizablePanel
            className="flex flex-col h-full min-h-0 w-full bg-[#0d0d0d] border-l border-[#1f1f1f] overflow-hidden"
        >
            {activeSidebar.component()}
        </ResizablePanel>
    )
}


