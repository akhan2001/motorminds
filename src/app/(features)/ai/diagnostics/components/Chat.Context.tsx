'use client'

import React, { createContext, useContext } from 'react'

interface ChatContextValue {
	sendMessage: (text: string) => Promise<void>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({
	children,
	sendMessage,
}: {
	children: React.ReactNode
	sendMessage: (text: string) => Promise<void>
}) {
	return (
		<ChatContext.Provider value={{ sendMessage }}>
			{children}
		</ChatContext.Provider>
	)
}

export function useChatContext() {
	const context = useContext(ChatContext)
	if (!context) {
		throw new Error('useChatContext must be used within ChatProvider')
	}
	return context
}

export function useChatContextOptional() {
	return useContext(ChatContext)
}

