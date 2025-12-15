'use client'

import React from 'react'
import type { UIMessage } from '@ai-sdk/react'
import { MessageProvider, useMessageInfoContext } from './Message.Context'
import {
	MessageDisplayContainer,
	MessageDisplayMainArea,
	MessageDisplayContent,
	MessageDisplayProfileImage
} from './Message.Display'
import { MessagePartSwitcher } from './Message.Parts'

interface MessageProps {
	id: string
	message: UIMessage
	isLoading?: boolean
	readOnly?: boolean
	onDelete?: (id: string) => void
	onEdit?: (id: string, content: string) => void
	onCancelEdit?: () => void
}

export function Message({
	id,
	message,
	isLoading = false,
	readOnly = false,
	onDelete,
	onEdit,
	onCancelEdit
}: MessageProps) {
	const isUser = message.role === 'user'
	const isAssistant = message.role === 'assistant'

	return (
		<MessageProvider
			id={id}
			message={message}
			isLoading={isLoading}
			readOnly={readOnly}
			onDelete={onDelete}
			onEdit={onEdit}
			onCancelEdit={onCancelEdit}
		>
			<MessageDisplayContainer isUser={isUser}>
				<MessageDisplayMainArea isUser={isUser}>
					{isUser ? (
						<>
							<MessageDisplayContent isUser={isUser}>
								<MessageContent message={message} isUser={isUser} />
							</MessageDisplayContent>
							<MessageDisplayProfileImage isUser={true} />
						</>
					) : (
						<>
							<MessageDisplayProfileImage isUser={false} />
							<MessageDisplayContent isUser={isUser}>
								<MessageContent message={message} isUser={isUser} />
							</MessageDisplayContent>
						</>
					)}
				</MessageDisplayMainArea>
			</MessageDisplayContainer>
		</MessageProvider>
	)
}

interface MessageContentProps {
	message: UIMessage
	isUser: boolean
}

function MessageContent({ message, isUser }: MessageContentProps) {
	if (isUser) {
		// User messages: just show text
		const textParts = message.parts?.filter((part: any) => part.type === 'text') || []
		const textContent = textParts.map((part: any) => part.text).join('')

		if (!textContent) return null

		return <div className="text-sm whitespace-pre-wrap">{textContent}</div>
	}

	// Assistant messages: show all parts (text, tools, etc.)
	return <MessagePartSwitcher message={message} />
}

