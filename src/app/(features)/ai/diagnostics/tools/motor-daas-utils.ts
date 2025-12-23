/**
 * Utility functions for MOTOR DaaS tool error handling and response formatting
 */

import { DEFAULT_BASE_VEHICLE_ID, DEFAULT_ENGINE_ID } from '@/lib/integrations/motor-daas/constants/constants'

/**
 * Get default vehicle ID (for development/testing)
 */
export function getDefaultVehicleId(baseVehicleId?: number): number {
	return baseVehicleId || DEFAULT_BASE_VEHICLE_ID
}

/**
 * Get default engine ID (for development/testing)
 */
export function getDefaultEngineId(engineId?: number): number {
	return engineId || DEFAULT_ENGINE_ID
}

/**
 * Format tool error response
 * Extracted from repeated error handling in all tools
 */
export function formatToolError(error: unknown, toolName: string): {
	success: false
	error: string
	message: string
	retryAfter?: number
	details?: {
		name?: string
		message?: string
		statusCode?: number
		errorCode?: string
	}
} {
	// Log for debugging
	console.error(`[${toolName}] Error:`, error)

	// Handle specific error types with user-friendly messages
	if (error instanceof Error && 'statusCode' in error) {
		const statusCode = (error as any).statusCode
		const errorCode = (error as any).errorCode

		// Rate limit error (429)
		if (statusCode === 429) {
			return {
				success: false,
				error: 'Rate limit exceeded. The MOTOR API allows 1500 requests per 15 minutes. Please wait a moment and try again.',
				message: `Unable to fetch data due to rate limiting. Please try again in a few minutes.`,
				retryAfter: 900, // 15 minutes in seconds
				details: {
					name: error.name,
					message: error.message,
					statusCode,
					errorCode,
				},
			}
		}

		// Authentication error (401)
		if (statusCode === 401) {
			return {
				success: false,
				error: 'Authentication failed. Please check MOTOR DaaS credentials.',
				message: 'Unable to authenticate with MOTOR API. Please contact support if this persists.',
				details: {
					name: error.name,
					message: error.message,
					statusCode,
					errorCode,
				},
			}
		}

		// Forbidden error (403) - usually timestamp issue
		if (statusCode === 403) {
			return {
				success: false,
				error: 'Request forbidden. This may be due to a timestamp mismatch. Please try again.',
				message: 'Unable to access data. The request was rejected. Please try again.',
				details: {
					name: error.name,
					message: error.message,
					statusCode,
					errorCode,
				},
			}
		}

		// Not found error (404)
		if (statusCode === 404) {
			return {
				success: false,
				error: 'Data not found for this vehicle configuration.',
				message: 'No data is available for the specified vehicle. Try a different vehicle or search term.',
				details: {
					name: error.name,
					message: error.message,
					statusCode,
					errorCode,
				},
			}
		}

		// Generic HTTP error
		const errorMessage = error.message || 'Unknown error'
		return {
			success: false,
			error: `MOTOR API error (HTTP ${statusCode}, Code: ${errorCode || 'N/A'}): ${errorMessage}`,
			message: `Failed to fetch data from MOTOR API. ${errorMessage}`,
			details: {
				name: error.name,
				message: error.message,
				statusCode,
				errorCode,
			},
		}
	}

	// Network errors (e.g., fetch failed, timeout)
	if (error instanceof TypeError && error.message.includes('fetch')) {
		return {
			success: false,
			error: 'Network error. Unable to connect to MOTOR API. Please check your internet connection and try again.',
			message: 'Connection to MOTOR API failed. Please try again.',
		}
	}

	// Generic error fallback
	const errorMessage = error instanceof Error ? error.message : 'Unknown error'
	return {
		success: false,
		error: `An unexpected error occurred: ${errorMessage}`,
		message: `An unexpected error occurred while processing your request. ${errorMessage}`,
	}
}

