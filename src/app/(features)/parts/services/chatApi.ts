import { ChatMessage } from '../hooks/useChat'

interface SendMessageRequest {
    message: string
    vehicleContext?: any
    sessionId: string
}

interface SendMessageResponse {
    success: boolean
    message: string
    products?: any[]
    sources?: any[]
    error?: string
}

interface SessionResponse {
    session: {
        session_id: string
        [key: string]: any
    }
}

interface MessagesResponse {
    messages: any[]
}

class ChatApiService {
    async initializeSession(): Promise<SessionResponse> {
        const response = await fetch('/api/mia/session')
        const data = await response.json()
        
        if (!data.session) {
            throw new Error('Failed to initialize session')
        }
        
        return data
    }
    
    async getMessages(sessionId: string): Promise<MessagesResponse> {
        const response = await fetch(`/api/mia/messages?sessionId=${sessionId}`)
        const data = await response.json()
        
        return data
    }
    
    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
        const response = await fetch('/api/mia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        })
        
        const data = await response.json()
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to send message')
        }
        
        return data
    }
    
    async updateSessionContext(sessionId: string, vehicleContext: any): Promise<void> {
        const response = await fetch('/api/mia/session', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, vehicleContext })
        })
        
        if (!response.ok) {
            throw new Error('Failed to update session context')
        }
    }
    
    async clearSession(sessionId: string): Promise<void> {
        const response = await fetch(`/api/mia/session?sessionId=${sessionId}`, {
            method: 'DELETE'
        })
        
        if (!response.ok) {
            throw new Error('Failed to clear session')
        }
    }
}

export const chatApi = new ChatApiService()
