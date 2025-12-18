'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from "react"
import { TasksProvider } from "@/contexts/tasks-context"
import { ConfirmationProvider } from "@/app/components/confirmation-service"
import { ThemeProvider } from "@/components/theme-provider"
import { AdminContextProvider } from "@/contexts/admin-context"
import { AuthProvider } from "@/contexts/AuthProvider"

export default function Providers({
	children,
}: {
	children: React.ReactNode
}) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
				retry: 1,
				refetchOnWindowFocus: false, // Prevent refetch on tab focus to reduce connection pool usage
				// refetchOnMount defaults to true - will only refetch if data is stale (>5 min old)
			},
		},
	}))

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<AdminContextProvider>
						<TasksProvider>
							<ConfirmationProvider>
								{children}
							</ConfirmationProvider>
						</TasksProvider>
					</AdminContextProvider>
				</ThemeProvider>
			</AuthProvider>
		</QueryClientProvider>
	)
} 