"use client"

import { Card, CardContent } from '@/components/ui/card'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
}

interface DiagnosticsMessageProps {
    message: Message
    onAddMessage: (content: string, role: 'user' | 'assistant') => void
}

export function DiagnosticsMessage({ message, onAddMessage }: DiagnosticsMessageProps) {
    const isUser = message.role === 'user'

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <Card className={`max-w-[80%] ${isUser
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-[#111111] border-[#2a2a2a]'
                }`}>
                <CardContent className="p-3">
                    <p className={`text-sm ${isUser ? 'text-white' : 'text-gray-300'}`}>
                        {message.content}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
