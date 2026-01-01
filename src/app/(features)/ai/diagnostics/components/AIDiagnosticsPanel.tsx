'use client'

import React, { useMemo, useState } from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { DiagnosticsChatForm } from './DiagnosticsChatForm'
import { DiagnosticsOnboarding } from './DiagnosticsOnboarding'
import { Message } from './Message'
import { Conversation, ConversationContent, ConversationScrollButton } from './elements/Conversation'
import type { SandboxVehicle } from './VehicleSelector'

interface AIDiagnosticsPanelProps {
	shopId?: string
	sessionId?: string
	workOrderId?: string
	vehicleId?: number
	baseVehicleId?: number
	vehicleContext?: SandboxVehicle | null
	dtcCodes?: string[]
	reportedIssue?: string
	className?: string
	onClose?: () => void
}

export function AIDiagnosticsPanel({
	shopId,
	sessionId,
	workOrderId,
	vehicleId,
	baseVehicleId,
	vehicleContext,
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
	const chat = useChat({
		id: 'ai-diagnostics',
		transport: new DefaultChatTransport({
			api: '/api/ai/diagnostics',
			async prepareSendMessagesRequest({ messages, ...options }: { messages: UIMessage[]; [key: string]: any }) {
				// Build vehicle context object from vehicleContext if available
				const vehicleContextData = vehicleContext
					? {
							year: vehicleContext.year,
							make: vehicleContext.make,
							model: vehicleContext.model,
							vin: vehicleContext.vin
						}
					: undefined

				return {
					...options,
					body: {
						messages,
						shopId: shopId || '',
						sessionId,
						workOrderId,
						vehicleId: vehicleId || vehicleContext?.motorId,
						baseVehicleId: baseVehicleId || vehicleContext?.baseVehicleId,
						engineId: vehicleContext?.engineId,
						vehicleContext: vehicleContextData
					}
				}
			}
		}),
		messages: initialMessages,
		onError: (error: Error) => {
			console.error('AI Diagnostics error:', error)
		}
	})

	// Track immediate loading state when message is submitted
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleFormSubmit = async (messageText: string) => {
		if (typeof chat.sendMessage === 'function') {
			// Set loading state immediately
			setIsSubmitting(true)
			
			try {
				await chat.sendMessage({
					role: 'user',
					parts: [
						{
							type: 'text',
							text: messageText
						}
					]
				})
			} catch (error) {
				console.error('Error sending message:', error)
				setIsSubmitting(false)
			}
		}
	}

	const hasMessages = chat.messages.length > 0
	// Show loading immediately on submit OR when chat is streaming/submitted
	const isChatLoading = isSubmitting || chat.status === 'streaming' || chat.status === 'submitted'
	
	// Reset submitting state when chat status changes to ready (message sent)
	React.useEffect(() => {
		if (chat.status === 'ready' && isSubmitting) {
			setIsSubmitting(false)
		}
	}, [chat.status, isSubmitting])

	return (
		<div className={`flex flex-col h-full bg-white dark:bg-[#0a0a0a] ${className}`}>

			{/* Conversation Container */}
			<Conversation>
				{hasMessages || isSubmitting ? (
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
								{/* Show loading message immediately when submitting but before streaming starts */}
								{isSubmitting && chat.status !== 'streaming' && (
									<Message
										key="loading-placeholder"
										id="loading-placeholder"
										message={{
											id: 'loading-placeholder',
											role: 'assistant',
											content: '',
											parts: []
										} as UIMessage}
										isLoading={true}
									/>
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