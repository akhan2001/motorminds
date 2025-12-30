'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { diagnosticSessionService } from '../lib/diagnostic-session-service'
import type {
	DiagnosticSession,
	DiagnosticSessionCreateData,
	DiagnosticSessionUpdateData,
	SessionFilters,
	DiagnosticSessionStats
} from '../types/diagnostic-session'
import { toast } from 'sonner'

// Query keys following hierarchical pattern
export const diagnosticSessionKeys = {
	all: (shopId: string) => ['diagnostic-sessions', shopId] as const,
	lists: (shopId: string) => [...diagnosticSessionKeys.all(shopId), 'list'] as const,
	list: (shopId: string, filters?: SessionFilters) =>
		[...diagnosticSessionKeys.lists(shopId), filters] as const,
	details: (shopId: string) => [...diagnosticSessionKeys.all(shopId), 'detail'] as const,
	detail: (shopId: string, id: string) =>
		[...diagnosticSessionKeys.details(shopId), id] as const,
	stats: (shopId: string) => [...diagnosticSessionKeys.all(shopId), 'stats'] as const,
	messages: (shopId: string, sessionId: string) =>
		[...diagnosticSessionKeys.detail(shopId, sessionId), 'messages'] as const,
}

// Hook to fetch sessions with filters
export function useDiagnosticSessions(shopId: string, filters?: SessionFilters) {
	return useQuery({
		queryKey: diagnosticSessionKeys.list(shopId, filters),
		queryFn: () => diagnosticSessionService.getSessions(shopId, filters),
		staleTime: 5 * 60 * 1000, // 5 minutes
		enabled: !!shopId && shopId !== '',
	})
}

// Hook to fetch single session
export function useDiagnosticSession(shopId: string, sessionId: string) {
	return useQuery({
		queryKey: diagnosticSessionKeys.detail(shopId, sessionId),
		queryFn: () => diagnosticSessionService.getSession(shopId, sessionId),
		staleTime: 5 * 60 * 1000,
		enabled: !!shopId && !!sessionId,
		retry: false,
		refetchOnWindowFocus: false,
	})
}

// Hook to fetch session statistics
export function useDiagnosticSessionStats(shopId: string) {
	return useQuery({
		queryKey: diagnosticSessionKeys.stats(shopId),
		queryFn: () => diagnosticSessionService.getSessionStats(shopId),
		staleTime: 2 * 60 * 1000, // 2 minutes
		enabled: !!shopId && shopId !== '',
	})
}

// Hook to create new session
export function useCreateDiagnosticSession(shopId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: DiagnosticSessionCreateData) =>
			diagnosticSessionService.createSession(shopId, data),
		onSuccess: (newSession) => {
			// Invalidate lists to refetch
			queryClient.invalidateQueries({
				queryKey: diagnosticSessionKeys.lists(shopId),
			})
			// Invalidate stats
			queryClient.invalidateQueries({
				queryKey: diagnosticSessionKeys.stats(shopId),
			})
			toast.success('Diagnostic session created successfully')
		},
		onError: (error: any) => {
			console.error('Failed to create diagnostic session:', error)
			toast.error(error.message || 'Failed to create diagnostic session')
		},
	})
}

// Hook to update session
export function useUpdateDiagnosticSession(shopId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			sessionId,
			updates,
		}: {
			sessionId: string
			updates: DiagnosticSessionUpdateData
		}) => diagnosticSessionService.updateSession(shopId, sessionId, updates),
		onSuccess: (updatedSession) => {
			// Update specific session in cache
			queryClient.setQueryData(
				diagnosticSessionKeys.detail(shopId, updatedSession.session_id),
				updatedSession
			)
			// Invalidate lists to refetch
			queryClient.invalidateQueries({
				queryKey: diagnosticSessionKeys.lists(shopId),
			})
			// Invalidate stats
			queryClient.invalidateQueries({
				queryKey: diagnosticSessionKeys.stats(shopId),
			})
		},
		onError: (error: any) => {
			console.error('Failed to update diagnostic session:', error)
			toast.error(error.message || 'Failed to update diagnostic session')
		},
	})
}

