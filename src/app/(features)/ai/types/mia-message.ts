interface MiaMessage {
    id: string
    session_id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    metadata: {
        timestamp?: string
        parts?: Product[] // AI recommended parts
        sources?: string[] // Perplexity sources
        context?: any // Additional context
    }
    created_at: string
}