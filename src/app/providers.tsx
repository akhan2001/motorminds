'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from "react"
import { TasksProvider } from "@/contexts/tasks-context"
import { ConfirmationProvider } from "@/app/components/confirmation-service"
import { ThemeProvider } from "@/components/theme-provider"
import { AdminContextProvider } from "@/contexts/admin-context"
import { AuthProvider } from "@/lib/auth/AuthProvider"

export default function Providers({
	children,
}: {
	children: React.ReactNode
}) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5 * 60 * 1000, // 5 minutes
				retry: 1,
				refetchOnWindowFocus: false,
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