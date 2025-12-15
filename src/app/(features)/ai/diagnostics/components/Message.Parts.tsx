'use client'

import React from 'react'
import { MotorToolDisplay, isMotorTool } from './MotorToolDisplay'
import type { UIMessage } from '@ai-sdk/react'

interface MessagePartSwitcherProps {
	message: UIMessage
}

export function MessagePartSwitcher({ message }: MessagePartSwitcherProps) {
	const parts = message.parts || []

	return (
		<div className="space-y-2">
			{parts.map((part: any, idx: number) => {
				switch (part.type) {
					case 'text':
						return <MessagePartText key={idx} text={part.text} />
					case 'tool-call':
						return <MessagePartTool key={idx} part={part} message={message} />
					case 'tool-result':
						// Tool results are handled within tool-call parts
						return null
					default:
						return null
				}
			})}
		</div>
	)
}

interface MessagePartTextProps {
	text: string
}

function MessagePartText({ text }: MessagePartTextProps) {
	return (
		<div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
			{text}
		</div>
	)
}

interface MessagePartToolProps {
	part: any
	message: UIMessage
}

function MessagePartTool({ part, message }: MessagePartToolProps) {
	const toolName = part.toolName

	if (!isMotorTool(toolName)) {
		return null
	}

	// Find corresponding tool result
	const toolResultPart = message.parts?.find(
		(p: any) => p.type === 'tool-result' && p.toolCallId === part.toolCallId
	) as any

	return (
		<MotorToolDisplay
			toolName={toolName}
			input={part.args}
			output={toolResultPart?.result || toolResultPart?.output}
			state={toolResultPart ? 'output-available' : 'output-streaming'}
		/>
	)
}

