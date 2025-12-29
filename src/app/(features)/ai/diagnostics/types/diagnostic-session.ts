import type { SandboxVehicle } from '../components/VehicleSelector'

export type DiagnosticSessionStatus = 'active' | 'ended' | 'pending_review' | 'completed' | 'archived'

export interface DiagnosticSession {
	id: string
	session_id: string
	shop_id: string
	user_id: string
	work_order_id?: string | null
	vehicle_context: SandboxVehicle
	status: DiagnosticSessionStatus
	initial_issue?: string | null
	ai_recommendation?: string | null
	last_activity_at: string
	created_at: string
	updated_at: string
}

export interface DiagnosticSessionCreateData {
	work_order_id?: string
	vehicle_context: SandboxVehicle
	initial_issue?: string
	status?: DiagnosticSessionStatus
}

export interface DiagnosticSessionUpdateData {
	status?: DiagnosticSessionStatus
	ai_recommendation?: string
	initial_issue?: string
	work_order_id?: string
}

export interface SessionFilters {
	status?: DiagnosticSessionStatus
	search?: string
	limit?: number
	offset?: number
}

export interface DiagnosticMessage {
	id: string
	session_id: string
	role: 'user' | 'assistant'
	content: string
	metadata?: Record<string, any> | null
	created_at: string
}

export interface DiagnosticSessionStats {
	total_sessions_this_month: number
	total_sessions_change_percent: number
	average_diagnosis_time_seconds: number
	manual_average_time_seconds: number
	ai_success_rate: number
	trending_issues: Array<{
		issue: string
		count: number
		percentage: number
	}>
}

