'use client'

import React, { useMemo } from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DiagnosticsChatForm } from './DiagnosticsChatForm'
import { DiagnosticsOnboarding } from './DiagnosticsOnboarding'
import { Message } from './Message'
import { Conversation, ConversationContent, ConversationScrollButton } from './elements/Conversation'

interface AIDiagnosticsPanelProps {
	workOrderId?: string
	vehicleId?: number
	baseVehicleId?: number
	dtcCodes?: string[]
	reportedIssue?: string
	className?: string
	onClose?: () => void
}

export function AIDiagnosticsPanel({
	workOrderId,
	vehicleId,
	baseVehicleId,
	dtcCodes = [],
	reportedIssue,
	className = '',
	onClose
}: AIDiagnosticsPanelProps) {
	// Build initial messages with context
	const initialMessages = useMemo<UIMessage[]>(() => {
		if (!reportedIssue && dtcCodes.length === 0 && !baseVehicleId) {
			return []
		}

		let contextParts: string[] = []

		if (reportedIssue) {
			contextParts.push(`Customer reported: ${reportedIssue}`)
		}

		if (dtcCodes.length > 0) {
			contextParts.push(`DTC codes: ${dtcCodes.join(', ')}`)
		}

		if (baseVehicleId) {
			contextParts.push(`Base Vehicle ID: ${baseVehicleId}`)
		}

		if (contextParts.length > 0) {
			return [
				{
					id: 'initial-context',
					role: 'user' as const,
					parts: [
						{
							type: 'text',
							text: `I need help diagnosing this issue:\n\n${contextParts.join('\n')}`
						}
					]
				}
			]
		}

		return []
	}, [reportedIssue, dtcCodes, baseVehicleId])

	// useChat hook for AI streaming (AI SDK v5)
	const chat = useChat({
		id: 'ai-diagnostics',
		// @ts-ignore - api parameter works at runtime
		api: '/api/ai/diagnostics',
		// @ts-ignore - body parameter is supported at runtime
		body: {
			workOrderId,
			selectedVehicleId: vehicleId,
			baseVehicleId
		},
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
						className={`font-bold ${
							chat.status === 'ready'
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
								{isChatLoading && (
									<div className="flex justify-start mt-4">
										<div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-lg px-4 py-3">
											<div className="flex items-center space-x-2">
												<div className="flex space-x-1">
													<div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" />
													<div
														className="w-2 h-2 bg-red-600 rounded-full animate-bounce"
														style={{ animationDelay: '0.1s' }}
													/>
													<div
														className="w-2 h-2 bg-red-600 rounded-full animate-bounce"
														style={{ animationDelay: '0.2s' }}
													/>
												</div>
												<span className="text-sm text-muted-foreground">Mia is thinking...</span>
											</div>
										</div>
									</div>
								)}
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
