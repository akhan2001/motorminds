"use client"

import { useMemo } from 'react'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

// Minimal resizable panel stub; replace with actual resizable if available
function ResizablePanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>{children}</div>
    )
}

export function LayoutSidebar() {
    const { getActiveSidebar } = useSidebarManagerSnapshot()
    const activeSidebar = useMemo(() => getActiveSidebar(), [getActiveSidebar])

    if (!activeSidebar) return null

    return (
        <ResizablePanel
            className={
                // right-anchored, full-viewport height on mobile, responsive widths on larger viewports
                'fixed right-0 top-0 bottom-0 z-40 w-screen max-w-full h-[100dvh] '
                + 'md:absolute md:w-3/4 '
                + 'xl:relative xl:w-[480px] xl:border-l '
                + 'bg-[#0d0d0d] border-l border-[#1f1f1f] overflow-hidden'
            }
        >
            {activeSidebar.component()}
        </ResizablePanel>
    )
}


