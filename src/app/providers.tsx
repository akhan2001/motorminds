'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from "react"
import { TasksProvider } from "@/contexts/tasks-context"
import { ConfirmationProvider } from "@/app/components/confirmation-service"
import { ThemeProvider } from "@/components/theme-provider"
import { AdminContextProvider } from "@/contexts/admin-context"
import { AuthProvider } from "@/contexts/auth-context"

export default function Providers({
	children,
}: {
	children: React.ReactNode
}) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				// Data stays fresh for 1 minute before refetching
				staleTime: 60 * 1000, // 1 minute

				// Disable automatic refetches to prevent thundering herd
				refetchOnWindowFocus: false,
				refetchOnMount: false,
				refetchOnReconnect: false,

				// Smart retry with exponential backoff
				retry: (failureCount, error: any) => {
					// Don't retry on 4xx errors (except 429 rate limits)
					if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
						return false
					}

					// Max 3 retries
					if (failureCount < 3) {
						return true
					}

					return false
				},

				// Exponential backoff: 1s → 2s → 4s (max 30s)
				retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
			},
			mutations: {
				// Mutations retry once by default
				retry: 1,
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