'use client'

import React, { createContext, useContext } from 'react'
import type { UIMessage } from '@ai-sdk/react'

interface MessageInfoContextValue {
	id: string
	message: UIMessage
	isLoading?: boolean
	readOnly?: boolean
	isUserMessage?: boolean
	state?: 'editing' | 'idle'
	isLastMessage?: boolean
}

interface MessageActionsContextValue {
	onDelete?: (id: string) => void
	onEdit?: (id: string, content: string) => void
	onCancelEdit?: () => void
}

const MessageInfoContext = createContext<MessageInfoContextValue | null>(null)
const MessageActionsContext = createContext<MessageActionsContextValue | null>(null)

export function MessageProvider({
	children,
	id,
	message,
	isLoading = false,
	readOnly = false,
	onDelete,
	onEdit,
	onCancelEdit
}: {
	children: React.ReactNode
	id: string
	message: UIMessage
	isLoading?: boolean
	readOnly?: boolean
	onDelete?: (id: string) => void
	onEdit?: (id: string, content: string) => void
	onCancelEdit?: () => void
}) {
	const infoValue: MessageInfoContextValue = {
		id,
		message,
		isLoading,
		readOnly,
		isUserMessage: message.role === 'user',
		state: 'idle',
		isLastMessage: false
	}

	const actionsValue: MessageActionsContextValue = {
		onDelete,
		onEdit,
		onCancelEdit
	}

	return (
		<MessageInfoContext.Provider value={infoValue}>
			<MessageActionsContext.Provider value={actionsValue}>
				{children}
			</MessageActionsContext.Provider>
		</MessageInfoContext.Provider>
	)
}

export function useMessageInfoContext() {
	const context = useContext(MessageInfoContext)
	if (!context) {
		throw new Error('useMessageInfoContext must be used within MessageProvider')
	}
	return context
}

export function useMessageActionsContext() {
	const context = useContext(MessageActionsContext)
	return context // Can be null if no actions provided
}

