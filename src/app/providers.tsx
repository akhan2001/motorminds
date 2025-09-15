'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from "react"
import { ThemeProvider } from "next-themes"
import { TasksProvider } from "@/contexts/tasks-context"
import { ConfirmationProvider } from "@/app/components/confirmation-service"

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
      >
        <TasksProvider>
          <ConfirmationProvider>
            {children}
          </ConfirmationProvider>
        </TasksProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
} 