'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { diagnosticSessionService } from '../lib/diagnostic-session-service'
import { diagnosticSessionKeys } from './use-diagnostic-sessions'
import type { DiagnosticMessage } from '../types/diagnostic-session'
import { toast } from 'sonner'

// Hook to fetch session messages
export function useDiagnosticMessages(shopId: string, sessionId: string) {
	return useQuery({
		queryKey: diagnosticSessionKeys.messages(shopId, sessionId),
		queryFn: () => diagnosticSessionService.getSessionMessages(shopId, sessionId),
		staleTime: 1 * 60 * 1000, // 1 minute
		enabled: !!shopId && !!sessionId,
	})
}

// Hook to save message
export function useSaveDiagnosticMessage(shopId: string, sessionId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			role,
			content,
			metadata,
		}: {
			role: 'user' | 'assistant'
			content: string
			metadata?: Record<string, any>
		}) =>
			diagnosticSessionService.saveMessage(shopId, sessionId, role, content, metadata),
		onSuccess: () => {
			// Invalidate messages to refetch
			queryClient.invalidateQueries({
				queryKey: diagnosticSessionKeys.messages(shopId, sessionId),
			})
			// Invalidate session detail to update last_activity_at
			queryClient.invalidateQueries({
				queryKey: diagnosticSessionKeys.detail(shopId, sessionId),
			})
			// Invalidate lists to update last activity in list view
			queryClient.invalidateQueries({
				queryKey: diagnosticSessionKeys.lists(shopId),
			})
		},
		onError: (error: any) => {
			console.error('Failed to save message:', error)
			// Don't show toast for message saves - they happen frequently
		},
	})
}

