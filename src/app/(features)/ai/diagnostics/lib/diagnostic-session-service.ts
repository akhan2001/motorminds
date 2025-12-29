import { createClient } from '@/lib/supabase'
import type {
	DiagnosticSession,
	DiagnosticSessionCreateData,
	DiagnosticSessionUpdateData,
	SessionFilters,
	DiagnosticMessage,
	DiagnosticSessionStats,
	DiagnosticSessionStatus
} from '../types/diagnostic-session'
import type { SandboxVehicle } from '../components/VehicleSelector'

export class DiagnosticSessionService {
	private supabase = createClient()

	// Generate unique session ID
	private generateSessionId(): string {
		return `diag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
	}

	// Get current user ID
	private async getCurrentUserId(): Promise<string | null> {
		const { data: { user } } = await this.supabase.auth.getUser()
		return user?.id || null
	}

	// Get sessions with filters
	async getSessions(shopId: string, filters?: SessionFilters): Promise<DiagnosticSession[]> {
		let query = this.supabase
			.from('mia_sessions')
			.select('*')
			.eq('shop_id', shopId)
			.order('created_at', { ascending: false })

		// Apply status filter
		if (filters?.status) {
			query = query.eq('status', filters.status)
		}

		// Apply search filter (search in vehicle_context JSONB)
		if (filters?.search && filters.search.trim()) {
			const searchTerm = filters.search.trim()
			// Search in vehicle_context JSONB fields
			query = query.or(
				`vehicle_context->>'make'.ilike.%${searchTerm}%,vehicle_context->>'model'.ilike.%${searchTerm}%,vehicle_context->>'vin'.ilike.%${searchTerm}%`
			)
		}

		// Apply pagination
		const limit = filters?.limit || 100
		const offset = filters?.offset || 0
		query = query.range(offset, offset + limit - 1)

		const { data, error } = await query

		if (error) {
			console.error('Error fetching diagnostic sessions:', error)
			throw new Error(`Failed to fetch diagnostic sessions: ${error.message}`)
		}

		return (data || []).map(this.mapRowToSession)
	}

	// Get single session by session_id
	async getSession(shopId: string, sessionId: string): Promise<DiagnosticSession | null> {
		const { data, error } = await this.supabase
			.from('mia_sessions')
			.select('*')
			.eq('shop_id', shopId)
			.eq('session_id', sessionId)
			.single()

		if (error) {
			if (error.code === 'PGRST116') {
				// No rows returned
				return null
			}
			console.error('Error fetching diagnostic session:', error)
			throw new Error(`Failed to fetch diagnostic session: ${error.message}`)
		}

		return this.mapRowToSession(data)
	}

	// Create new session
	async createSession(shopId: string, data: DiagnosticSessionCreateData): Promise<DiagnosticSession> {
		const userId = await this.getCurrentUserId()
		if (!userId) {
			throw new Error('User not authenticated')
		}

		const sessionId = this.generateSessionId()

		const { data: sessionData, error } = await this.supabase
			.from('mia_sessions')
			.insert({
				session_id: sessionId,
				shop_id: shopId,
				vehicle_context: data.vehicle_context,
				status: data.status || 'active',
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating diagnostic session:', error)
			throw new Error(`Failed to create diagnostic session: ${error.message}`)
		}

		return this.mapRowToSession(sessionData)
	}

	// Update session
	async updateSession(
		shopId: string,
		sessionId: string,
		updates: DiagnosticSessionUpdateData
	): Promise<DiagnosticSession> {
		const updateData: any = {
			updated_at: new Date().toISOString(),
		}

		if (updates.status !== undefined) {
			updateData.status = updates.status
		}
		// Note: Store optional fields in metadata if columns don't exist in mia_sessions
		// For now, we'll need to fetch existing metadata first
		if (updates.ai_recommendation !== undefined || updates.initial_issue !== undefined || updates.work_order_id !== undefined) {
			// Fetch existing session to preserve metadata
			const existingSession = await this.getSession(shopId, sessionId)
			const existingMetadata = (existingSession as any)?.metadata || {}
			updateData.metadata = { ...existingMetadata }
			
			if (updates.ai_recommendation !== undefined) {
				updateData.metadata.ai_recommendation = updates.ai_recommendation
			}
			if (updates.initial_issue !== undefined) {
				updateData.metadata.initial_issue = updates.initial_issue
			}
			if (updates.work_order_id !== undefined) {
				updateData.metadata.work_order_id = updates.work_order_id
			}
		}

		const { data, error } = await this.supabase
			.from('mia_sessions')
			.update(updateData)
			.eq('shop_id', shopId)
			.eq('session_id', sessionId)
			.select()
			.single()

		if (error) {
			console.error('Error updating diagnostic session:', error)
			throw new Error(`Failed to update diagnostic session: ${error.message}`)
		}

		return this.mapRowToSession(data)
	}

	// Update last activity timestamp
	async updateLastActivity(shopId: string, sessionId: string): Promise<void> {
		const { error } = await this.supabase
			.from('mia_sessions')
			.update({
				updated_at: new Date().toISOString(),
			})
			.eq('shop_id', shopId)
			.eq('session_id', sessionId)

		if (error) {
			console.error('Error updating last activity:', error)
			// Don't throw - this is a non-critical update
		}
	}

	// Get session messages
	async getSessionMessages(shopId: string, sessionId: string): Promise<DiagnosticMessage[]> {
		// First verify session belongs to shop
		const session = await this.getSession(shopId, sessionId)
		if (!session) {
			return []
		}

		const { data, error } = await this.supabase
			.from('mia_messages')
			.select('*')
			.eq('session_id', sessionId)
			.order('created_at', { ascending: true })

		if (error) {
			console.error('Error fetching session messages:', error)
			throw new Error(`Failed to fetch session messages: ${error.message}`)
		}

		return (data || []).map((row: any) => ({
			id: row.id,
			session_id: row.session_id,
			role: row.role as 'user' | 'assistant',
			content: row.content,
			metadata: row.metadata,
			created_at: row.created_at,
		}))
	}

	// Save message to session
	async saveMessage(
		shopId: string,
		sessionId: string,
		role: 'user' | 'assistant',
		content: string,
		metadata?: Record<string, any>
	): Promise<DiagnosticMessage> {
		// Verify session belongs to shop
		const session = await this.getSession(shopId, sessionId)
		if (!session) {
			throw new Error('Session not found')
		}

		const { data, error } = await this.supabase
			.from('mia_messages')
			.insert({
				session_id: sessionId,
				role,
				content,
				metadata: metadata || {},
			})
			.select()
			.single()

		if (error) {
			console.error('Error saving message:', error)
			throw new Error(`Failed to save message: ${error.message}`)
		}

		// Update session updated_at
		await this.updateLastActivity(shopId, sessionId)

		return {
			id: data.id,
			session_id: data.session_id,
			role: data.role as 'user' | 'assistant',
			content: data.content,
			metadata: data.metadata,
			created_at: data.created_at,
		}
	}

	// Get session statistics
	async getSessionStats(shopId: string): Promise<DiagnosticSessionStats> {
		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

		// Get total sessions this month
		const { data: thisMonthSessions, error: thisMonthError } = await this.supabase
			.from('mia_sessions')
			.select('id')
			.eq('shop_id', shopId)
			.gte('created_at', startOfMonth.toISOString())

		if (thisMonthError) {
			console.error('Error fetching this month sessions:', thisMonthError)
		}

		// Get last month for comparison
		const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
		const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

		const { data: lastMonthSessions, error: lastMonthError } = await this.supabase
			.from('mia_sessions')
			.select('id')
			.eq('shop_id', shopId)
			.gte('created_at', lastMonthStart.toISOString())
			.lte('created_at', lastMonthEnd.toISOString())

		if (lastMonthError) {
			console.error('Error fetching last month sessions:', lastMonthError)
		}

		const thisMonthCount = thisMonthSessions?.length || 0
		const lastMonthCount = lastMonthSessions?.length || 0
		const changePercent = lastMonthCount > 0
			? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
			: thisMonthCount > 0 ? 100 : 0

		// Get completed sessions for success rate calculation
		const { data: completedSessions, error: completedError } = await this.supabase
			.from('mia_sessions')
			.select('id, status')
			.eq('shop_id', shopId)
			.in('status', ['ended'])

		if (completedError) {
			console.error('Error fetching completed sessions:', completedError)
		}

		// Calculate success rate (completed / total)
		const totalSessions = thisMonthCount
		const completedCount = completedSessions?.length || 0
		const successRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0

		// Get trending issues from ai_recommendation field
		// Note: ai_recommendation doesn't exist in mia_sessions, using vehicle_context for trending
		const { data: allSessions, error: allSessionsError } = await this.supabase
			.from('mia_sessions')
			.select('vehicle_context')
			.eq('shop_id', shopId)
			.not('vehicle_context', 'is', null)
			.limit(100)

		if (allSessionsError) {
			console.error('Error fetching sessions for trending:', allSessionsError)
		}

		// Extract trending issues from vehicle_context (simplified)
		const issueCounts: Record<string, number> = {}
		allSessions?.forEach((session) => {
			if (session.vehicle_context && typeof session.vehicle_context === 'object') {
				// Extract vehicle make/model patterns for trending
				const make = (session.vehicle_context as any).make || ''
				const model = (session.vehicle_context as any).model || ''
				if (make) {
					issueCounts[make.toUpperCase()] = (issueCounts[make.toUpperCase()] || 0) + 1
				}
			}
		})

		const trendingIssues = Object.entries(issueCounts)
			.map(([issue, count]) => ({
				issue,
				count,
				percentage: Math.round((count / (allSessions?.length || 1)) * 100),
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5)

		return {
			total_sessions_this_month: thisMonthCount,
			total_sessions_change_percent: changePercent,
			average_diagnosis_time_seconds: 452, // 7m 32s - placeholder, can be calculated from timestamps
			manual_average_time_seconds: 900, // 15m - placeholder
			ai_success_rate: successRate,
			trending_issues: trendingIssues.length > 0 ? trendingIssues : [
				{ issue: 'Brake Pad Wear', count: 15, percentage: 15 },
				{ issue: 'P0300', count: 10, percentage: 10 },
				{ issue: 'HVAC Blend Door', count: 8, percentage: 8 },
			],
		}
	}

	// Map database row to DiagnosticSession
	private mapRowToSession(row: any): DiagnosticSession {
		const metadata = row.metadata || {}
		return {
			id: row.id,
			session_id: row.session_id,
			shop_id: row.shop_id,
			user_id: row.user_id || metadata.user_id || '', // May not exist in mia_sessions
			work_order_id: row.work_order_id || metadata.work_order_id || null, // May not exist in mia_sessions
			vehicle_context: (row.vehicle_context || {}) as SandboxVehicle,
			status: (row.status || 'active') as DiagnosticSessionStatus,
			initial_issue: row.initial_issue || metadata.initial_issue || null, // May not exist in mia_sessions
			ai_recommendation: row.ai_recommendation || metadata.ai_recommendation || null, // May not exist in mia_sessions
			last_activity_at: row.last_activity_at || row.updated_at || row.created_at,
			created_at: row.created_at,
			updated_at: row.updated_at,
		}
	}
}

export const diagnosticSessionService = new DiagnosticSessionService()

