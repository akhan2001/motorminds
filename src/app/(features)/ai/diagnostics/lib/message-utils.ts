/**
 * Message preparation utilities for AI Diagnostics
 * Prepares messages before sending to the AI API
 */

/**
 * Prepares messages for the AI API
 * - Limits to last 7 messages for context window optimization
 * - Removes results field from assistant messages
 * - Filters out tools with invalid states
 * - Ensures proper message format
 */
export function prepareMessagesForAPI(rawMessages: any[]): any[] {
	// Only returns last 7 messages
	return (rawMessages || []).slice(-7).map((msg: any) => {
		// Remove results field from assistant messages (not needed for API)
		if (msg && msg.role === 'assistant' && 'results' in msg) {
			const cleanedMsg = { ...msg }
			delete cleanedMsg.results
			return cleanedMsg
		}

		// Filter out tools with invalid states
		if (msg && msg.role === 'assistant' && msg.parts) {
			const invalidStates = ['input-streaming', 'input-available', 'output-error']
			const cleanedParts = msg.parts.filter((part: any) => {
				if (part.type.startsWith('tool-')) {
					return !invalidStates.includes(part.state)
				}
				return true
			})
			return { ...msg, parts: cleanedParts }
		}

		return msg
	})
}

/**
 * Converts database messages to UIMessage format
 */
export function convertDatabaseMessagesToUIFormat(dbMessages: any[]): any[] {
	return dbMessages.map((msg) => ({
		id: msg.id,
		role: msg.role,
		parts: [
			{
				type: 'text',
				text: msg.content,
			},
		],
		metadata: msg.metadata,
	}))
}

/**
 * Merges previous messages with new messages, avoiding duplicates
 */
export function mergeMessages(previousMessages: any[], newMessages: any[]): any[] {
	const existingIds = new Set(previousMessages.map((m) => m.id))
	const uniqueNewMessages = newMessages.filter((m: any) => !existingIds.has(m.id))
	return [...previousMessages, ...uniqueNewMessages]
}
