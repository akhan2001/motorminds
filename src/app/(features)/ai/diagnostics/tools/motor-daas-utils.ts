/**
 * Utility functions for MOTOR DaaS tool error handling
 * 
 * Simplified following Supabase patterns:
 * - No global state
 * - Simple error formatting
 */

/**
 * Format tool error response (Supabase-style: simple string for minor errors)
 * For major errors, returns structured object with details
 */
export function formatToolError(error: unknown, toolName: string): string | {
	success: false
	error: string
	message: string
	retryAfter?: number
} {
	// Log for debugging
	console.error(`[${toolName}] Error:`, error)

	// Handle specific error types with user-friendly messages
	if (error instanceof Error && 'statusCode' in error) {
		const statusCode = (error as any).statusCode
		const errorCode = (error as any).errorCode

		// Rate limit error (429) - include retry info
		if (statusCode === 429) {
			return {
				success: false,
				error: 'Rate limit exceeded',
				message: 'The MOTOR API allows 1500 requests per 15 minutes. Please wait a moment and try again.',
				retryAfter: 900,
			}
		}

		// Authentication error (401)
		if (statusCode === 401) {
			return `Authentication failed. Please check MOTOR DaaS credentials.`
		}

		// Forbidden error (403) - usually timestamp issue
		if (statusCode === 403) {
			return `Request forbidden. This may be due to a timestamp mismatch. Please try again.`
		}

		// Not found error (404)
		if (statusCode === 404) {
			return `Data not found for this vehicle configuration.`
		}

		// Generic HTTP error
		return `MOTOR API error (HTTP ${statusCode}): ${error.message || 'Unknown error'}`
	}

	// Network errors
	if (error instanceof TypeError && error.message.includes('fetch')) {
		return `Network error. Unable to connect to MOTOR API. Please check your internet connection.`
	}

	// Generic error fallback
	return `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
}
