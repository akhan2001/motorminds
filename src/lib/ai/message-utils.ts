import type { UIMessage } from 'ai'

/**
 * Prepares messages for API transmission by cleaning and limiting history
 */
export function prepareMessagesForAPI(messages: UIMessage[]): UIMessage[] {
    // Limit to last 7 messages to reduce context size
    const MAX_CHAT_HISTORY = 7

    const slicedMessages = messages.slice(-MAX_CHAT_HISTORY)

    // Clean messages before sending to model
    const cleanedMessages = slicedMessages.map((message) => {
        // Remove 'results' field from assistant messages
        if (message.role === 'assistant' && 'results' in message) {
            const cleanedMsg = { ...message } as UIMessage & { results?: unknown }
            delete cleanedMsg.results
            return cleanedMsg as UIMessage
        }

        // Clean tool parts - remove invalid states
        if (message.role === 'assistant' && message.parts) {
            const cleanedParts = message.parts
                .filter((part: any) => {
                    // Filter out invalid tool states
                    if (part.type?.startsWith('tool-') || part.type === 'tool') {
                        const invalidStates = ['input-streaming', 'input-available', 'output-error']
                        return !invalidStates.includes(part.state)
                    }
                    return true
                })
                .map((part: any) => {
                    // Remove any IDs that OpenAI won't recognize
                    const cleanedPart = { ...part }
                    // Remove internal IDs that might cause issues
                    if (cleanedPart.id) {
                        delete cleanedPart.id
                    }
                    if (cleanedPart.messageId) {
                        delete cleanedPart.messageId
                    }
                    return cleanedPart
                })

            return { ...message, parts: cleanedParts }
        }

        // Remove any IDs from the message itself
        const cleanedMessage = { ...message }
        // Keep the id field as it's needed by the AI SDK, but ensure it's a simple string
        if (cleanedMessage.id && typeof cleanedMessage.id === 'string') {
            // Ensure ID is a simple format OpenAI can handle
            if (cleanedMessage.id.length > 50) {
                // Generate a simpler ID if it's too complex
                cleanedMessage.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
        }

        return cleanedMessage
    })

    return cleanedMessages
}