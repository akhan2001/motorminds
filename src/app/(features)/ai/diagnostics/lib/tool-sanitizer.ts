/**
 * Tool sanitizer for AI Diagnostics
 * Sanitizes tool outputs based on AI opt-in level
 */

export type DiagnosticAiOptInLevel = 'vehicle_only' | 'vehicle_and_work_orders' | 'full'

/**
 * Sanitizes a message part based on the AI opt-in level
 * - vehicle_only: Show vehicle-related tool outputs, filter customer data
 * - vehicle_and_work_orders: Show vehicle and work order outputs, anonymize customer info
 * - full: All outputs shown
 */
export function sanitizeMessagePart(part: any, aiOptInLevel: DiagnosticAiOptInLevel): any {
	// If not a tool part, return as-is
	if (!part.type?.startsWith('tool-')) {
		return part
	}

	// If opt-in is vehicle_only, filter customer data from tool outputs
	if (aiOptInLevel === 'vehicle_only') {
		// Allow MOTOR API tool outputs (vehicle data only)
		// Filter out customer information from any tool outputs
		if (part.result && typeof part.result === 'object') {
			const sanitized = { ...part.result }
			// Remove customer-specific fields
			delete sanitized.customer_name
			delete sanitized.customer_email
			delete sanitized.customer_phone
			delete sanitized.customer_address
			return {
				...part,
				result: sanitized,
			}
		}
		return part
	}

	// If opt-in is vehicle_and_work_orders, anonymize customer info
	if (aiOptInLevel === 'vehicle_and_work_orders') {
		// Allow vehicle and work order data, but anonymize customer names/contact
		if (part.result && typeof part.result === 'object') {
			const sanitized = { ...part.result }
			// Anonymize customer information
			if (sanitized.customer_name) sanitized.customer_name = '[Anonymized]'
			if (sanitized.customer_email) sanitized.customer_email = '[Anonymized]'
			if (sanitized.customer_phone) sanitized.customer_phone = '[Anonymized]'
			return {
				...part,
				result: sanitized,
			}
		}
		return part
	}

	// Full access - return everything
	return part
}

/**
 * Sanitizes all parts in a message
 */
export function sanitizeMessage(message: any, aiOptInLevel: DiagnosticAiOptInLevel): any {
	if (!message.parts) {
		return message
	}

	return {
		...message,
		parts: message.parts.map((part: any) => sanitizeMessagePart(part, aiOptInLevel)),
	}
}
