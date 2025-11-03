'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from "react"
import { TasksProvider } from "@/contexts/tasks-context"
import { ConfirmationProvider } from "@/app/components/confirmation-service"
<<<<<<< HEAD
import { ThemeProvider } from "@/components/theme-provider"
=======
import { AdminContextProvider } from "@/contexts/admin-context"
>>>>>>> 010e83e7599845dceeec3e8ddcbef1420d50c289

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
<<<<<<< HEAD
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
=======
      <AdminContextProvider>
>>>>>>> 010e83e7599845dceeec3e8ddcbef1420d50c289
        <TasksProvider>
          <ConfirmationProvider>
            {children}
          </ConfirmationProvider>
        </TasksProvider>
<<<<<<< HEAD
      </ThemeProvider>
=======
      </AdminContextProvider>
>>>>>>> 010e83e7599845dceeec3e8ddcbef1420d50c289
    </QueryClientProvider>
  )
} 