export interface StagingTable {
	name: string
	schema: string
	row_count: number
	size_mb: number
	last_updated: string
	status: 'healthy' | 'warning' | 'error'
	issues?: string[]
}

export interface StagingVerification {
	id: string
	table_name: string
	verification_type: 'schema' | 'data' | 'integrity' | 'performance'
	status: 'pending' | 'running' | 'completed' | 'failed'
	started_at: string
	completed_at?: string
	duration_ms?: number
	result?: StagingVerificationResult
	error_message?: string
}

export interface StagingVerificationResult {
	passed: boolean
	checks: StagingCheck[]
	summary: {
		total_checks: number
		passed_checks: number
		failed_checks: number
		warnings: number
	}
}

export interface StagingCheck {
	name: string
	description: string
	status: 'pass' | 'fail' | 'warning'
	message: string
	details?: any
}

export interface StagingHealth {
	overall_status: 'healthy' | 'warning' | 'critical'
	tables: StagingTable[]
	last_verification: string
	issues_count: number
	recommendations: string[]
}

export interface StagingVerificationRequest {
	table_names?: string[]
	verification_types?: string[]
	force_refresh?: boolean
}

export interface StagingVerificationResponse {
	success: boolean
	message: string
	verification_id?: string
	results?: StagingVerificationResult
	errors?: string[]
}
