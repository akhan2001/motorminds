'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { DiagnosticsHubHeader, type SessionFilterTab } from './components/hub/DiagnosticsHubHeader'
import { SessionList } from './components/hub/SessionList'
import { NewSessionDialog } from './components/hub/NewSessionDialog'
import { PageLoading, PageError, PageAuthRequired } from '@/components/common/feedback/page-states'
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
		return <PageLoading title="Loading AI Diagnostics Hub" description="Initializing..." />
	}

	// Error state
	if (error) {
		const errorMessage = error && typeof error === 'object' && 'message' in error 
			? (error as Error).message 
			: String(error)
		return <PageError title="Failed to Load AI Diagnostics Hub" error={errorMessage} />
	}

	// Auth error state
	if (!shopId || !user) {
		return <PageAuthRequired resource="AI Diagnostics Hub" />
	}

	return (
		<div className="h-full flex flex-col bg-background">
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header */}
				<DiagnosticsHubHeader
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onNewSession={() => setIsNewSessionDialogOpen(true)}
					onSettingsClick={() => setIsSettingsDialogOpen(true)}
					activeTab={activeTab}
					onTabChange={setActiveTab}
					counts={counts}
				/>

				{/* Main Content */}
				<div className="flex-1 overflow-hidden p-2">
					<SessionList
						shopId={shopId}
						activeTab={activeTab}
						searchQuery={searchQuery}
					/>
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
