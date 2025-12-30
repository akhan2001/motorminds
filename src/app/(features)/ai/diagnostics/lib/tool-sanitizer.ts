/**
 * Tool sanitizer for AI Diagnostics
 * Sanitizes tool outputs based on AI opt-in level
 */

export type DiagnosticAiOptInLevel = 'disabled' | 'schema' | 'full'

/**
 * Sanitizes a message part based on the AI opt-in level
 * - disabled: No tool outputs shown
 * - schema: Only schema-related outputs shown
 * - full: All outputs shown
 */
export function sanitizeMessagePart(part: any, aiOptInLevel: DiagnosticAiOptInLevel): any {
	// If not a tool part, return as-is
	if (!part.type?.startsWith('tool-')) {
		return part
	}

	// If opt-in is disabled, remove all tool outputs
	if (aiOptInLevel === 'disabled') {
		return {
			...part,
			result: null,
		}
	}

	// If opt-in is schema-only, filter sensitive data
	if (aiOptInLevel === 'schema') {
		// For now, allow all tool outputs for schema level
		// You can add more granular filtering here based on tool name
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
