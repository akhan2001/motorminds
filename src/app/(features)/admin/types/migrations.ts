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

// Invoice Migration Types
export interface StagingInvoice {
	id: string
	invoice_number?: string
	customer_identifier?: string
	vehicle_identifier?: string
	shop_identifier?: string
	invoice_date?: string
	due_date?: string
	paid_date?: string
	status?: string
	payment_method?: string
	subtotal?: number
	tax_rate?: number
	tax_amount?: number
	discount_amount?: number
	total_amount?: number
	labor_total?: number
	parts_total?: number
	services_total?: number
	fees_total?: number
	invoice_items?: any
	custom_fields?: any
	notes?: string
	matched_customer_id?: string
	matched_vehicle_id?: string
	matched_shop_id?: string
	import_status: string
	import_batch_id?: string
	validation_errors?: string[]
	created_at: string
}

export interface ImportBatch {
	id: string
	shop_id: string
	total_records: number
	matched_records: number
	validated_records: number
	migrated_records: number
	status: string
	created_at: string
}

export interface ColumnMapping {
	csv_column: string
	staging_field: string
	suggested_field?: string
	confidence: number
	suggested: boolean
	required: boolean
	sample_data?: string[]
}

export interface MigrationPreview {
	total_records: number
	valid_records: number
	invalid_records: number
	preview_rows: StagingInvoice[]
	validation_errors: Record<number, string[]>
}

export interface ImportResult {
	success: boolean
	imported_count: number
	failed_count: number
	batch_id: string
	errors?: string[]
}

export interface CSVAnalysis {
	headers: string[]
	sample_rows: any[]
	suggested_mappings: ColumnMapping[]
	questions: string[]
	confidence_score: number
}

export interface InvoiceImportRequest {
	shop_id: string
	file: File
	column_mappings?: Record<string, string>
	batch_name?: string
}

export interface InvoiceImportResponse {
	success: boolean
	batch_id?: string
	total_records?: number
	parsed_records?: number
	errors?: string[]
	message: string
}

export interface InvoiceMatchRequest {
	batch_id: string
	force_rematch?: boolean
}

export interface InvoiceMatchResponse {
	success: boolean
	matched_count: number
	unmatched_count: number
	errors?: string[]
	message: string
}

export interface InvoiceValidationRequest {
	batch_id: string
	validate_all?: boolean
}

export interface InvoiceValidationResponse {
	success: boolean
	valid_count: number
	invalid_count: number
	errors?: string[]
	message: string
}

export interface InvoiceMigrationRequest {
	batch_id: string
	migrate_all?: boolean
	selected_ids?: string[]
}

export interface InvoiceMigrationResponse {
	success: boolean
	migrated_count: number
	failed_count: number
	errors?: string[]
	message: string
}
