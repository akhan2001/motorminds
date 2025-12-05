'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from "react"
import { TasksProvider } from "@/contexts/tasks-context"
import { ConfirmationProvider } from "@/app/components/confirmation-service"
import { ThemeProvider } from "@/components/theme-provider"
import { AdminContextProvider } from "@/contexts/admin-context"
import { AuthProvider } from "@/contexts/auth-provider"
import { RouteValidationWrapper } from "@/components/auth/RouteValidationWrapper"

/**
 * Root providers for the application
 * 
 * Provider hierarchy (from outer to inner):
 * 1. QueryClientProvider - React Query for data fetching
 * 2. ThemeProvider - Dark/light mode
 * 3. AuthProvider - Authentication state (Supabase Studio pattern)
 * 4. RouteValidationWrapper - Client-side route validation
 * 5. AdminContextProvider - Admin-specific context
 * 6. TasksProvider - Task management
 * 7. ConfirmationProvider - Confirmation dialogs
 */
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
				<AuthProvider>
					<RouteValidationWrapper>
						<AdminContextProvider>
							<TasksProvider>
								<ConfirmationProvider>
									{children}
								</ConfirmationProvider>
							</TasksProvider>
						</AdminContextProvider>
					</RouteValidationWrapper>
				</AuthProvider>
			</ThemeProvider>
		</QueryClientProvider>
	)
} 