'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from "react"
import { TasksProvider } from "@/contexts/tasks-context"
import { ConfirmationProvider } from "@/app/components/confirmation-service"
import { ThemeProvider } from "@/components/theme-provider"
import { AdminContextProvider } from "@/contexts/admin-context"
import { UnifiedAuthProvider } from "@/contexts/unified-auth-context"

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
				refetchOnWindowFocus: false, // Prevent excessive refetching
			},
		},
	}))

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<UnifiedAuthProvider>
					<AdminContextProvider>
						<TasksProvider>
							<ConfirmationProvider>
								{children}
							</ConfirmationProvider>
						</TasksProvider>
					</AdminContextProvider>
				</UnifiedAuthProvider>
			</ThemeProvider>
		</QueryClientProvider>
	)
} 