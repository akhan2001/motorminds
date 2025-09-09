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

declare module 'ai' {
    export interface Message {
        id: string
        role: 'user' | 'assistant' | 'system'
        content: string
        parts?: Array<{
            type: string
            text?: string
            content?: string
            state?: string
            [key: string]: any
        }>
        [key: string]: any
    }

    export class StreamingTextResponse extends Response {
        constructor(res: ReadableStream, init?: ResponseInit)
    }
}
