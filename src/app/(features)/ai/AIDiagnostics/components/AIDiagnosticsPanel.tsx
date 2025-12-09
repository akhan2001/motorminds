// src/app/(features)/ai/AIDiagnostics/components/AIDiagnosticsPanel.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DiagnosticsForm } from './DiagnosticsForm'
import { MotorToolDisplay, isMotorTool } from './MotorToolDisplay'
import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const messagesContainerRef = useRef<HTMLDivElement>(null)

	// Build initial messages with context
	const initialMessages = React.useMemo<UIMessage[]>(() => {
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
		api: '/api/ai/diagnostics',
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

	// Auto-scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [chat.messages])

	const handleFormSubmit = (messageText: string) => {
		console.log('[AI Diagnostics] Submitting message:', messageText)
		console.log('[AI Diagnostics] Current messages count:', chat.messages.length)
		
		// sendMessage requires a CreateUIMessage object, not a string
		// Even though docs say it accepts string, the implementation checks for object properties
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
		} else {
			console.error('[AI Diagnostics] sendMessage not available. Chat keys:', Object.keys(chat))
		}
	}

	return (
		<div className={`flex flex-col h-full bg-white dark:bg-[#0a0a0a] ${className}`}>
			{/* Header */}
			{/* <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#222222] bg-gray-50 dark:bg-[#131313] px-4 py-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Sparkles className="w-5 h-5 text-red-600 dark:text-red-500" />
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Diagnostics</h2>
					</div>
					{onClose && (
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={onClose}
							className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#222222] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>
				{workOrderId && (
					<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Work Order: {workOrderId}</p>
				)}
			</div> */}

			{/* Messages Container */}
			<div
				ref={messagesContainerRef}
				className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800"
			>
				{/* Debug info */}
				{process.env.NODE_ENV === 'development' && (
					<div className="text-xs text-gray-500 mb-2">
						Messages: {chat.messages.length} | Status: <span className={`font-bold ${chat.status === 'ready' ? 'text-green-500' : chat.status === 'streaming' ? 'text-yellow-500' : 'text-red-500'}`}>{chat.status}</span>
					</div>
				)}

				{chat.messages.length === 0 && (
					<div className="flex flex-col items-center justify-center h-full text-center">
						<Sparkles className="w-12 h-12 text-red-600 dark:text-red-500 mb-4 opacity-50" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
							AI-Powered Diagnostics
						</h3>
						<p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
							Describe the vehicle issue, provide DTC codes, or ask diagnostic questions.
							The AI will help analyze the problem and provide repair guidance.
						</p>
						<div className="mt-6 grid grid-cols-1 gap-2 max-w-md text-left">
							<ExamplePrompt onClick={() => handleFormSubmit("What does DTC P0420 mean?")}>
								What does DTC P0420 mean?
							</ExamplePrompt>
							<ExamplePrompt onClick={() => handleFormSubmit("Customer reports rough idle and check engine light")}>
								Customer reports rough idle and check engine light
							</ExamplePrompt>
							<ExamplePrompt onClick={() => handleFormSubmit("How do I diagnose a misfire on cylinder 3?")}>
								How do I diagnose a misfire on cylinder 3?
							</ExamplePrompt>
						</div>
					</div>
				)}

				{chat.messages.map((message: UIMessage) => (
					<MessageDisplay key={message.id} message={message} />
				))}

				<div ref={messagesEndRef} />
			</div>

			{/* Input Form */}
			<div className="flex-shrink-0 border-t border-gray-200 dark:border-[#222222] bg-gray-50 dark:bg-[#131313] p-4">
				<DiagnosticsForm
					onSubmit={handleFormSubmit}
					isLoading={chat.status === 'streaming' || chat.status === 'submitted'}
					onStop={chat.stop}
				/>
			</div>
		</div>
	)
}

// Message Display Component
function MessageDisplay({ message }: { message: UIMessage }) {
	const isUser = message.role === 'user'
	const isAssistant = message.role === 'assistant'

	// Extract text content from parts array (AI SDK 5.0)
	const textParts = message.parts?.filter(part => part.type === 'text') || []
	const textContent = textParts.map(part => (part as any).text).join('')

	// Extract tool calls from parts array (AI SDK 5.0)
	const toolCallParts = message.parts?.filter(part => part.type === 'tool-call') || []

	return (
		<div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
			<div className={`max-w-[80%] ${isUser ? 'bg-red-600 dark:bg-red-600 text-white' : 'bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-100'} rounded-lg px-4 py-3`}>
				{/* User Message */}
				{isUser && textContent && (
					<div className="text-sm whitespace-pre-wrap">{textContent}</div>
				)}

				{/* Assistant Message */}
				{isAssistant && (
					<div className="space-y-2">
						{/* Text Content */}
						{textContent && (
							<div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
								{textContent}
							</div>
						)}

						{/* Tool Calls */}
						{toolCallParts.map((toolPart: any, idx: number) => {
							const toolName = toolPart.toolName
							if (!isMotorTool(toolName)) return null

							// Find corresponding tool result
							const toolResultPart = message.parts?.find(
								(part: any) => part.type === 'tool-result' && part.toolCallId === toolPart.toolCallId
							) as any

							return (
								<MotorToolDisplay
									key={idx}
									toolName={toolName}
									input={toolPart.args}
									output={toolResultPart?.result || toolResultPart?.output}
									state={toolResultPart ? 'output-available' : 'output-streaming'}
								/>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}

// Example Prompt Button
function ExamplePrompt({
	onClick,
	children
}: {
	onClick: () => void
	children: React.ReactNode
}) {
	return (
		<button
			onClick={onClick}
			className="text-left text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 py-2 transition-colors"
		>
			{children}
		</button>
	)
}

