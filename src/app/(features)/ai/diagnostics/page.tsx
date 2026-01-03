'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { DiagnosticsHubHeader, type SessionFilterTab } from './components/hub/DiagnosticsHubHeader'
import { SessionList } from './components/hub/SessionList'
import { DiagnosticsOverview } from './components/hub/DiagnosticsOverview'
import { NewSessionDialog } from './components/hub/NewSessionDialog'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/feedback/loading-states'
import { AlertCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useDiagnosticSessions } from './hooks/use-diagnostic-sessions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AIOptInLevelSelector } from './components/interfaces/GeneralSettings/AIOptInLevelSelector'
import { useAIOptInForm } from './hooks/forms/useAIOptInForm'
import { Form } from '@/components/ui/form'

export default function AIDiagnosticsPage() {
	const { user, shopId, isLoading, error } = useAuth()
	const [searchQuery, setSearchQuery] = useState('')
	const [activeTab, setActiveTab] = useState<SessionFilterTab>('active')
	const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false)
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)

	// AI Opt-in form
	const { form, onSubmit, isUpdating } = useAIOptInForm(() => {
		setIsSettingsDialogOpen(false)
	})

	// Fetch all sessions for counts
	const { data: allSessions } = useDiagnosticSessions(shopId || '', { limit: 1000 })
	const counts = useMemo(() => {
		if (!allSessions) return {}
		return {
			active: allSessions.filter((s) => s.status === 'active').length,
			pending_review: allSessions.filter((s) => s.status === 'pending_review').length,
			completed: allSessions.filter((s) => s.status === 'completed').length,
			recent: allSessions.filter(
				(s) =>
					new Date(s.last_activity_at).getTime() >
					new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
			).length,
		}
	}, [allSessions])

	// Loading state
	if (isLoading) {
		return (
			<div className="h-screen flex flex-col bg-background">
				<div className="flex-1 flex items-center justify-center">
					<Card className="bg-card border-border">
						<CardContent className="flex items-center gap-4 p-6">
							<LoadingSpinner size="md" className="text-blue-500" />
							<div>
								<p className="text-foreground font-medium">Loading AI Diagnostics Hub</p>
								<p className="text-muted-foreground text-sm">Initializing...</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	// Error state
	if (error) {
		return (
			<div className="h-screen flex flex-col bg-background">
				<div className="flex-1 flex items-center justify-center">
					<Card className="bg-card border-border">
						<CardContent className="flex items-center gap-4 p-6">
							<AlertCircle className="h-6 w-6 text-red-500" />
							<div>
								<p className="text-foreground font-medium">Failed to Load AI Diagnostics Hub</p>
								<p className="text-muted-foreground text-sm mb-3">
									{error && typeof error === 'object' && 'message' in error
										? (error as Error).message
										: 'Unknown error occurred'}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	// Auth error state
	if (!shopId || !user) {
		return (
			<div className="h-screen flex flex-col bg-background">
				<div className="flex-1 flex items-center justify-center">
					<Card className="bg-card border-border">
						<CardContent className="flex items-center gap-4 p-6">
							<AlertCircle className="h-6 w-6 text-yellow-500" />
							<div>
								<p className="text-foreground font-medium">Authentication Required</p>
								<p className="text-muted-foreground text-sm mb-3">
									Unable to access AI Diagnostics Hub. Please ensure you are logged in.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	return (
		<div className="h-screen flex flex-col bg-background">
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header */}
				<div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-border">
					<DiagnosticsHubHeader
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						onNewSession={() => setIsNewSessionDialogOpen(true)}
						onSettingsClick={() => setIsSettingsDialogOpen(true)}
						activeTab={activeTab}
						onTabChange={setActiveTab}
						counts={counts}
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
					<div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Sessions List - Takes 2 columns on large screens */}
						<div className="lg:col-span-2 overflow-auto">
							<SessionList
								shopId={shopId}
								activeTab={activeTab}
								searchQuery={searchQuery}
							/>
						</div>

						{/* Overview Sidebar - Takes 1 column on large screens */}
						<div className="lg:col-span-1 overflow-auto">
							<DiagnosticsOverview shopId={shopId} />
						</div>
					</div>
				</div>
			</div>

			{/* New Session Dialog */}
			<NewSessionDialog
				open={isNewSessionDialogOpen}
				onOpenChange={setIsNewSessionDialogOpen}
				shopId={shopId}
			/>

			{/* AI Settings Dialog */}
			<Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
				<DialogContent className="bg-white dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>AI Diagnostics Settings</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<AIOptInLevelSelector
								control={form.control}
								label="Data Sharing Level"
							/>
							<div className="flex justify-end gap-3 pt-4 border-t">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsSettingsDialogOpen(false)}
									disabled={isUpdating}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={isUpdating}
									className="bg-blue-600 hover:bg-blue-700"
								>
									{isUpdating ? 'Saving...' : 'Save Settings'}
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	)
}
