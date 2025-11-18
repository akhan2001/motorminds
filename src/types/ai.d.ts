declare module 'ai/react' {
    export interface Message {
        id: string
        role: 'user' | 'assistant' | 'system'
        content: string
        [key: string]: any
    }

    export interface UseChatHelpers {
        messages: Message[]
        input: string
        setInput: (input: string) => void
        handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void
        isLoading: boolean
        stop: () => void
        setMessages: (messages: Message[] | ((messages: Message[]) => Message[])) => void
        reload: () => Promise<string | null | undefined>
        error: Error | undefined
    }

    export interface UseChatOptions {
        api?: string
        body?: Record<string, any>
        onError?: (error: Error) => void
        [key: string]: any
    }

    export function useChat(options?: UseChatOptions): UseChatHelpers
}

// Removed 'ai' module declaration to let the package provide its own types
// The ai@5.0.93 package includes tool, streamText, StreamingTextResponse, etc.

