'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from "react"
import { TasksProvider } from "@/contexts/tasks-context"
import { ConfirmationProvider } from "@/app/components/confirmation-service"
import { MiaSidebarProvider } from "@/contexts/MiaSidebarContext"
import { MiaSidebar } from "@/app/components/mia-sidebar/MiaSidebar"
import { useMiaPageDetection } from "@/hooks/useMiaPageDetection"

function AppContent({ children }: { children: React.ReactNode }) {
    useMiaPageDetection() // This hook will set the current page context

    return (
        <>
            {children}
            <MiaSidebar />
        </>
    )
}

export default function Providers({
    children,
}: {
    children: React.ReactNode
}) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <TasksProvider>
                <ConfirmationProvider>
                    <MiaSidebarProvider>
                        <AppContent>
                            {children}
                        </AppContent>
                    </MiaSidebarProvider>
                </ConfirmationProvider>
            </TasksProvider>
        </QueryClientProvider>
    )
} 