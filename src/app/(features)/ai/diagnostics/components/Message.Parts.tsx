'use client'

import React from 'react'
import { type UIMessage as VercelMessage } from '@ai-sdk/react'
import { BrainIcon, CheckIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tool } from './elements/Tool'
import { useMessageInfoContext } from './Message.Context'
import { WiringDiagramsToolRenderer } from './tool-renderers/WiringDiagramsToolRenderer'
import { OEMComponentsToolRenderer } from './tool-renderers/OEMComponentsToolRenderer'
import { RelatedDiagramsToolRenderer } from './tool-renderers/RelatedDiagramsToolRenderer'

// Type definitions based on AI SDK v5 structure
type TextUIPart = { type: 'text'; text: string }
type ToolUIPart = {
	type: string
	toolCallId?: string
	state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
	input?: any
	output?: any
}
type DynamicToolUIPart = {
	type: 'dynamic-tool'
	toolName: string
	state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
}
type ReasoningUIPart = {
	type: 'reasoning'
	text: string
	state?: 'streaming' | 'complete'
}

function MessagePartText({ textPart }: { textPart: TextUIPart }) {
	const { id, isLoading, readOnly, isUserMessage } = useMessageInfoContext()

	return (
		<div
			className={cn(
				'text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none w-full min-w-0 overflow-wrap-anywhere break-words',
				isUserMessage && 'text-gray-900 dark:text-gray-100 font-medium'
			)}
		>
			{textPart.text}
		</div>
	)
}

function MessagePartDynamicTool({ toolPart }: { toolPart: DynamicToolUIPart }) {
	return (
		<Tool
			icon={
				toolPart.state === 'input-streaming' ? (
					<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />
				) : (
					<CheckIcon strokeWidth={1.5} size={12} className="text-gray-500 dark:text-gray-400" />
				)
			}
			label={
				<div>
					{toolPart.state === 'input-streaming' ? 'Running ' : 'Ran '}
					<span className="text-gray-500 dark:text-gray-400">{`${toolPart.toolName}`}</span>
				</div>
			}
		/>
	)
}

function MessagePartTool({ toolPart }: { toolPart: ToolUIPart }) {
	return (
		<Tool
			icon={
				toolPart.state === 'input-streaming' ? (
					<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />
				) : (
					<CheckIcon strokeWidth={1.5} size={12} className="text-gray-500 dark:text-gray-400" />
				)
			}
			label={
				<div>
					{toolPart.state === 'input-streaming' ? 'Running ' : 'Ran '}
					<span className="text-gray-500 dark:text-gray-400">{`${toolPart.type.replace('tool-', '')}`}</span>
				</div>
			}
		/>
	)
}

function MessagePartReasoning({ reasoningPart }: { reasoningPart: ReasoningUIPart }) {
	return (
		<Tool
			icon={
				reasoningPart.state === 'streaming' ? (
					<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />
				) : (
					<BrainIcon strokeWidth={1.5} size={12} className="text-gray-500 dark:text-gray-400" />
				)
			}
			label={reasoningPart.state === 'streaming' ? 'Thinking...' : 'Reasoned'}
		>
			{reasoningPart.text}
		</Tool>
	)
}

function MessagePartHelloWorld({ toolPart }: { toolPart: ToolUIPart }) {
	const { state, input, output } = toolPart

	if (state === 'input-streaming') {
		return (
			<Tool
				icon={<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />}
				label={
					<div>
						<span>Running </span>
						<span className="text-gray-500 dark:text-gray-400">helloWorld</span>
					</div>
				}
			/>
		)
	}

	if (state === 'output-error') {
		return (
			<Tool
				icon={<CheckIcon strokeWidth={1.5} size={12} className="text-red-600 dark:text-red-400" />}
				label={
					<div>
						<span className="text-red-600 dark:text-red-400">Failed to run </span>
						<span className="text-gray-500 dark:text-gray-400">helloWorld</span>
					</div>
				}
			>
				<div className="text-xs text-red-600 dark:text-red-400">
					{typeof output === 'string' ? output : 'Unknown error occurred'}
				</div>
			</Tool>
		)
	}

	if (state === 'output-available' && output) {
		let parsedResult: any
		
		try {
			if (typeof output === 'string') {
				parsedResult = JSON.parse(output)
			} else {
				parsedResult = output
			}
		} catch {
			parsedResult = { message: String(output) }
		}

		return (
			<Tool
				icon={<CheckIcon strokeWidth={1.5} size={12} className="text-green-600 dark:text-green-400" />}
				label={
					<div>
						<span>Ran </span>
						<span className="text-gray-500 dark:text-gray-400">helloWorld</span>
					</div>
				}
			>
				<div className="space-y-2">
					{parsedResult.success !== false ? (
						<>
							{parsedResult.message && (
								<div className="text-xs text-gray-700 dark:text-gray-300">
									<strong className="text-gray-900 dark:text-gray-100">Message:</strong>{' '}
									{parsedResult.message || parsedResult.Text || 'HelloWorld!'}
								</div>
							)}
							{parsedResult.Text && !parsedResult.message && (
								<div className="text-xs text-gray-700 dark:text-gray-300">{parsedResult.Text}</div>
							)}
							{parsedResult.note && (
								<div className="text-xs text-gray-500 dark:text-gray-400">{parsedResult.note}</div>
							)}
						</>
					) : (
						<div className="text-xs text-red-600 dark:text-red-400">
							<strong>Error:</strong> {parsedResult.error || parsedResult.message || 'Unknown error'}
						</div>
					)}
				</div>
			</Tool>
		)
	}

	return null
}

function MessagePartWiringDiagrams({ toolPart }: { toolPart: ToolUIPart }) {
	return <WiringDiagramsToolRenderer toolPart={toolPart} />
}

function MessagePartOEMComponents({ toolPart }: { toolPart: ToolUIPart }) {
	return <OEMComponentsToolRenderer toolPart={toolPart} />
}

function MessagePartRelatedDiagrams({ toolPart }: { toolPart: ToolUIPart }) {
	return <RelatedDiagramsToolRenderer toolPart={toolPart} />
}

function MessagePartRelatedOEMComponents({ toolPart }: { toolPart: ToolUIPart }) {
	return <OEMComponentsToolRenderer toolPart={toolPart} />
}

function MessagePartDiagramComponents({ toolPart }: { toolPart: ToolUIPart }) {
	return <OEMComponentsToolRenderer toolPart={toolPart} />
}

const MessagePart = {
	Text: MessagePartText,
	Dynamic: MessagePartDynamicTool,
	Tool: MessagePartTool,
	Reasoning: MessagePartReasoning,
	HelloWorld: MessagePartHelloWorld,
	WiringDiagrams: MessagePartWiringDiagrams,
	OEMComponents: MessagePartOEMComponents,
	RelatedDiagrams: MessagePartRelatedDiagrams,
	RelatedOEMComponents: MessagePartRelatedOEMComponents,
	DiagramComponents: MessagePartDiagramComponents,
} as const

export function MessagePartSwitcher({
	part,
	isLastPart,
}: {
	part: NonNullable<VercelMessage['parts']>[number]
	isLastPart?: boolean
}) {
	switch (part.type) {
		case 'dynamic-tool': {
			return <MessagePart.Dynamic toolPart={part as DynamicToolUIPart} />
		}
		case 'tool-helloWorld': {
			return <MessagePart.HelloWorld toolPart={part as ToolUIPart} />
		}
		case 'tool-getWiringDiagrams': {
			return <MessagePart.WiringDiagrams toolPart={part as ToolUIPart} />
		}
		case 'tool-getOEMComponents': {
			return <MessagePart.OEMComponents toolPart={part as ToolUIPart} />
		}
		case 'tool-getRelatedWiringDiagrams': {
			return <MessagePart.RelatedDiagrams toolPart={part as ToolUIPart} />
		}
		case 'tool-getRelatedOEMComponents': {
			return <MessagePart.RelatedOEMComponents toolPart={part as ToolUIPart} />
		}
		case 'tool-getDiagramComponents': {
			return <MessagePart.DiagramComponents toolPart={part as ToolUIPart} />
		}
		case 'reasoning':
			return <MessagePart.Reasoning reasoningPart={part as ReasoningUIPart} />
		case 'text':
			return <MessagePart.Text textPart={part as TextUIPart} />
		case 'tool-call':
		case 'tool-result':
			// These are handled differently - tool-call becomes tool-{name} in AI SDK v5
			return null
		default:
			// For other tool types, use generic renderer
			if (part.type.startsWith('tool-')) {
				return <MessagePart.Tool toolPart={part as ToolUIPart} />
			}
			return null
	}
}
