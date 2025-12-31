'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { useDiagnosticSession } from '../hooks/use-diagnostic-sessions'
import { AIDiagnosticsLayout } from '../components/AIDiagnosticsLayout'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/feedback/loading-states'
import { AlertCircle } from 'lucide-react'

export default function DiagnosticSessionPage() {
	const params = useParams()
	const sessionId = params.id as string
	const { shopId, isLoading: isAuthLoading, error: authError } = useAuth()

	const {
		data: session,
		isLoading: isSessionLoading,
		error: sessionError,
	} = useDiagnosticSession(shopId || '', sessionId)

	// Auth loading state
	if (isAuthLoading) {
		return (
			<div className="h-screen flex flex-col bg-background">
				<div className="flex-1 flex items-center justify-center">
					<Card className="bg-card border-border">
						<CardContent className="flex items-center gap-4 p-6">
							<LoadingSpinner size="md" className="text-blue-500" />
							<div>
								<p className="text-foreground font-medium">Loading...</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	// Auth error state
	if (authError || !shopId) {
		return (
			<div className="h-screen flex flex-col bg-background">
				<div className="flex-1 flex items-center justify-center">
					<Card className="bg-card border-border">
						<CardContent className="flex items-center gap-4 p-6">
							<AlertCircle className="h-6 w-6 text-red-500" />
							<div>
								<p className="text-foreground font-medium">Authentication Required</p>
								<p className="text-muted-foreground text-sm mb-3">
									Unable to access diagnostic session. Please ensure you are logged in.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	// Session loading state
	if (isSessionLoading) {
		return (
			<div className="h-screen flex flex-col bg-background">
				<div className="flex-1 flex items-center justify-center">
					<Card className="bg-card border-border">
						<CardContent className="flex items-center gap-4 p-6">
							<LoadingSpinner size="md" className="text-blue-500" />
							<div>
								<p className="text-foreground font-medium">Loading Session</p>
								<p className="text-muted-foreground text-sm">Fetching diagnostic data...</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	// Session error state
	if (sessionError) {
		return (
			<div className="h-screen flex flex-col bg-background">
				<div className="flex-1 flex items-center justify-center">
					<Card className="bg-card border-border">
						<CardContent className="flex items-center gap-4 p-6">
							<AlertCircle className="h-6 w-6 text-red-500" />
							<div>
								<p className="text-foreground font-medium">Failed to Load Session</p>
								<p className="text-muted-foreground text-sm mb-3">
									{sessionError instanceof Error
										? sessionError.message
										: 'Session not found or access denied'}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	// No storage - allow page to work without stored session
	// Session will be null since we don't store sessions, but we can still use the sessionId from URL
	return (
		<div className="h-screen flex flex-col bg-background">
			<div className="flex-1 overflow-hidden">
				<AIDiagnosticsLayout
					shopId={shopId}
					sessionId={sessionId}
					vehicleContext={session?.vehicle_context || null}
				/>
			</div>
		</div>
	)
}

