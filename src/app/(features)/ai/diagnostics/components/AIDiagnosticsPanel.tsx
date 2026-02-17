'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import * as AICore from 'ai'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { getChatErrorMessage } from '@/app/chat/utils/chat-error'
import { Button } from '@/components/ui/button'
import { DiagnosticsChatForm } from './DiagnosticsChatForm'
import { DiagnosticsOnboarding } from './DiagnosticsOnboarding'
import { Message } from './Message'
import { Conversation, ConversationContent, ConversationScrollButton } from './elements/Conversation'
import { ChatProvider } from './Chat.Context'
import type { SandboxVehicle } from './VehicleSelector'

interface AIDiagnosticsPanelProps {
	shopId?: string
	sessionId?: string
	workOrderId?: string
	vehicleId?: number
	baseVehicleId?: number
	engineId?: number
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
	engineId,
	vehicleContext,
	dtcCodes = [],
	reportedIssue,
	className = '',
	onClose
}: AIDiagnosticsPanelProps) {
	const DefaultChatTransport = (AICore as any).DefaultChatTransport

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
				// Include full engine data for accurate context
				const vehicleContextData = vehicleContext
					? {
							year: vehicleContext.year,
							make: vehicleContext.make,
							model: vehicleContext.model,
							vin: vehicleContext.vin,
							engineId: vehicleContext.engineId,
							engineName: vehicleContext.engineName,
							engineData: vehicleContext.engineData, // Full EngineResponse object
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
						engineId: engineId || vehicleContext?.engineId,
						vehicleContext: vehicleContextData
					}
				}
			}
		}),
		messages: initialMessages,
		onError: (error: Error) => {
			const message = getChatErrorMessage(error)
			toast.error('AI diagnostics request failed', { description: message })
		}
	})

	// Track immediate loading state when message is submitted
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleFormSubmit = useCallback(async (messageText: string) => {
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
	}, [chat])

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
		<ChatProvider sendMessage={handleFormSubmit}>
			<div className={`flex flex-col h-full bg-white dark:bg-[#0a0a0a] ${className}`}>

				{/* Conversation Container */}
				<Conversation>
					{hasMessages || isSubmitting ? (
						<>
							<ConversationContent>
								<div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full px-4">
									{chat.error && (
										<div className="mb-4 flex items-start gap-3 p-4 rounded-lg bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400">
											<AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
											<div className="flex-1 min-w-0">
												<p className="font-medium">Request failed</p>
												<p className="text-sm mt-1 opacity-90">{getChatErrorMessage(chat.error)}</p>
												<Button
													variant="ghost"
													size="sm"
													className="mt-2 h-8 text-red-600 dark:text-red-400 hover:bg-red-500/10"
													onClick={() => chat.clearError?.()}
												>
													Dismiss
												</Button>
											</div>
										</div>
									)}
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
		</ChatProvider>
	)
}