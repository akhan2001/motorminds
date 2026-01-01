'use client'

import React, { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import VehicleSelector, { type SandboxVehicle } from '../VehicleSelector'
import { useCreateDiagnosticSession } from '../../hooks/use-diagnostic-sessions'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface NewSessionDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	shopId: string
}

export function NewSessionDialog({ open, onOpenChange, shopId }: NewSessionDialogProps) {
	const router = useRouter()
	const createSession = useCreateDiagnosticSession(shopId)

	const [selectedVehicle, setSelectedVehicle] = useState<SandboxVehicle | null>(null)
	const [workOrderId, setWorkOrderId] = useState('')
	const [initialIssue, setInitialIssue] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Validate that vehicle has required fields (year, make, model)
		if (!selectedVehicle || !selectedVehicle.year || !selectedVehicle.make || !selectedVehicle.model) {
			return
		}

		try {
			const newSession = await createSession.mutateAsync({
				vehicle_context: selectedVehicle,
				work_order_id: workOrderId || undefined,
				initial_issue: initialIssue || undefined,
				status: 'active',
			})

			// Store vehicle context in localStorage as fallback (since sessions aren't persisted to DB)
			try {
				localStorage.setItem(
					`diagnostic-session-${newSession.session_id}`,
					JSON.stringify({
						vehicle_context: selectedVehicle,
						work_order_id: workOrderId || undefined,
						initial_issue: initialIssue || undefined,
					})
				)
			} catch (storageError) {
				console.warn('Failed to store session in localStorage:', storageError)
			}

			// Reset form
			setSelectedVehicle(null)
			setWorkOrderId('')
			setInitialIssue('')
			onOpenChange(false)

			// Navigate to new session
			router.push(`/ai/diagnostics/${newSession.session_id}`)
		} catch (error) {
			// Error is handled by the mutation hook (toast notification)
			console.error('Failed to create session:', error)
		}
	}

	const handleClose = () => {
		if (!createSession.isPending) {
			setSelectedVehicle(null)
			setWorkOrderId('')
			setInitialIssue('')
			onOpenChange(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px] bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a]">
				<DialogHeader>
					<DialogTitle>Create New Diagnostic Session</DialogTitle>
					<DialogDescription>
						Start a new AI diagnostic session for a vehicle. Select the vehicle and optionally provide initial issue details.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{/* Vehicle Selector - YMME Selector */}
						<div className="space-y-2">
							<Label htmlFor="vehicle">Vehicle *</Label>
							<VehicleSelector
								selectedVehicle={selectedVehicle}
								onVehicleSelect={setSelectedVehicle}
								showEngineSelector={true}
							/>
							{(!selectedVehicle || !selectedVehicle.year || !selectedVehicle.make || !selectedVehicle.model) && (
								<p className="text-xs text-red-500">Please select year, make, and model</p>
							)}
						</div>

						{/* Work Order ID (Optional) */}
						<div className="space-y-2">
							<Label htmlFor="workOrderId">Work Order ID (Optional)</Label>
							<Input
								id="workOrderId"
								value={workOrderId}
								onChange={(e) => setWorkOrderId(e.target.value)}
								placeholder="e.g., WO-2024-1234"
								disabled={createSession.isPending}
							/>
						</div>

						{/* Initial Issue (Optional) */}
						<div className="space-y-2">
							<Label htmlFor="initialIssue">Initial Issue (Optional)</Label>
							<Textarea
								id="initialIssue"
								value={initialIssue}
								onChange={(e) => setInitialIssue(e.target.value)}
								placeholder="Describe the initial issue or symptoms..."
								rows={4}
								disabled={createSession.isPending}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={createSession.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!selectedVehicle || !selectedVehicle.year || !selectedVehicle.make || !selectedVehicle.model || createSession.isPending}
							className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
						>
							{createSession.isPending ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Creating...
								</>
							) : (
								'Create Session'
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

