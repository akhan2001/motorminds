'use client'

import React, { useMemo } from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { DiagnosticsChatForm } from './DiagnosticsChatForm'
import { DiagnosticsOnboarding } from './DiagnosticsOnboarding'
import { Message } from './Message'
import { Conversation, ConversationContent, ConversationScrollButton } from './elements/Conversation'

interface AIDiagnosticsPanelProps {
	shopId?: string
	workOrderId?: string
	vehicleId?: number
	baseVehicleId?: number
	dtcCodes?: string[]
	reportedIssue?: string
	className?: string
	onClose?: () => void
}

export function AIDiagnosticsPanel({
	shopId,
	workOrderId,
	vehicleId,
	baseVehicleId,
	dtcCodes = [],
	reportedIssue,
	className = '',
	onClose
}: AIDiagnosticsPanelProps) {
	// Start with empty messages - context will be passed via API body params
	const initialMessages = useMemo<UIMessage[]>(() => {
		return []
	}, [])

	// useChat hook for AI streaming (AI SDK v5)
	// Using DefaultChatTransport to properly configure the API endpoint
	const chat = useChat({
		id: 'ai-diagnostics',
		transport: new DefaultChatTransport({
			api: '/api/ai/diagnostics',
			async prepareSendMessagesRequest({ messages, ...options }: { messages: UIMessage[]; [key: string]: any }) {
				return {
					...options,
					body: {
						messages,
						shopId: shopId || '',
						vehicleId,
						baseVehicleId,
						workOrderId
					}
				}
			}
		}),
		messages: initialMessages,
		onError: (error: Error) => {
			console.error('AI Diagnostics error:', error)
		}
	})

	const handleFormSubmit = (messageText: string) => {
		if (typeof chat.sendMessage === 'function') {
			chat.sendMessage({
				role: 'user',
				parts: [
					{
						type: 'text',
						text: messageText
					}
				]
			})
		}
	}

	const hasMessages = chat.messages.length > 0
	const isChatLoading = chat.status === 'streaming' || chat.status === 'submitted'

	return (
		<div className={`flex flex-col h-full bg-white dark:bg-[#0a0a0a] ${className}`}>
			{/* Debug info */}
			{process.env.NODE_ENV === 'development' && (
				<div className="flex-shrink-0 px-6 py-2 text-xs text-gray-500 border-b border-gray-200 dark:border-[#222222]">
					Messages: {chat.messages.length} | Status:{' '}
					<span
						className={`font-bold ${chat.status === 'ready'
								? 'text-green-500'
								: chat.status === 'streaming'
									? 'text-yellow-500'
									: 'text-red-500'
							}`}
					>
						{chat.status}
					</span>
				</div>
			)}

			{/* Conversation Container */}
			<Conversation>
				{hasMessages ? (
					<>
						<ConversationContent>
							<div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full px-4">
								{chat.messages.map((message: UIMessage) => (
									<Message
										key={message.id}
										id={message.id}
										message={message}
										isLoading={isChatLoading && message.id === chat.messages[chat.messages.length - 1]?.id}
									/>
								))}
							</div>
						</ConversationContent>
						<ConversationScrollButton />
					</>
				) : (
					<ConversationContent>
						<DiagnosticsOnboarding onSendMessage={handleFormSubmit} />
					</ConversationContent>
				)}
			</Conversation>

			{/* Input Form */}
			<div className="flex-shrink-0 border-t border-gray-200 dark:border-[#222222] bg-gray-50 dark:bg-[#131313] p-4">
				<DiagnosticsChatForm
					onSubmit={handleFormSubmit}
					isLoading={isChatLoading}
					onStop={chat.stop}
				/>
			</div>
		</div>
	)
}
