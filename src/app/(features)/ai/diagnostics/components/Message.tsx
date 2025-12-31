'use client'

import React from 'react'
import type { UIMessage } from '@ai-sdk/react'
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
	const { isLoading } = useMessageInfoContext()
	
	if (isUser) {
		// User messages: just show text
		const textParts = message.parts?.filter((part: any) => part.type === 'text') || []
		const textContent = textParts.map((part: any) => part.text).join('')

		if (!textContent) return null

		return <div className="text-sm whitespace-pre-wrap">{textContent}</div>
	}

	// Assistant messages: show all parts (text, tools, etc.)
	const parts = message.parts || []
	const partsCount = parts.length

	// If no parts, check if message has content directly (fallback for older format)
	if (partsCount === 0) {
		const content = (message as any).content
		if (content) {
			return (
				<div className="text-sm prose prose-sm dark:prose-invert max-w-none break-words prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:font-semibold prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold">
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{content}
					</ReactMarkdown>
				</div>
			)
		}
		
		// Show loading indicator if message is loading, otherwise show "No content available"
		if (isLoading) {
			return (
				<div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span>Thinking...</span>
				</div>
			)
		}
		
		return (
			<div className="text-sm text-gray-500 dark:text-gray-400 italic">
				No content available
			</div>
		)
	}

	return (
		<div className="space-y-2 w-full min-w-0 overflow-hidden">
			{parts.map((part: any, idx: number) => (
				<div key={idx} className="w-full min-w-0 overflow-hidden">
					<MessagePartSwitcher
						part={part}
						isLastPart={idx === partsCount - 1}
					/>
				</div>
			))}
		</div>
	)
}

