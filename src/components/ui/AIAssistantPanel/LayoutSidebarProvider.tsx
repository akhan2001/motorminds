"use client"

import { SidebarManagerProvider, useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import { AiDiagnostics } from '@/app/(features)/ai/AIDiagnostics/components/ai-diagnostics'
import { useEffect } from 'react'

export const SIDEBAR_KEYS = {
    AI_ASSISTANT: 'ai-assistant',
} as const

function RegisterAIAssistant() {
    const { registerSidebar } = useSidebarManagerSnapshot()
    useEffect(() => {
        registerSidebar({ key: SIDEBAR_KEYS.AI_ASSISTANT, component: () => <AiDiagnostics /> })
    }, [registerSidebar])
    return null
}

export function LayoutSidebarProvider({ children }: { children: React.ReactNode }) {
    return (
        <SidebarManagerProvider>
            <RegisterAIAssistant />
            {children}
        </SidebarManagerProvider>
    )
}


