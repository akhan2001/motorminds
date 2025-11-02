'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from "react"
import { TasksProvider } from "@/contexts/tasks-context"
import { ConfirmationProvider } from "@/app/components/confirmation-service"
import { AdminContextProvider } from "@/contexts/admin-context"

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AdminContextProvider>
        <TasksProvider>
          <ConfirmationProvider>
            {children}
          </ConfirmationProvider>
        </TasksProvider>
      </AdminContextProvider>
    </QueryClientProvider>
  )
} 