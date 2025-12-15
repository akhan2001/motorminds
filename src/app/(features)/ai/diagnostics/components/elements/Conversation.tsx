'use client'

import React from 'react'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'
import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConversationProps {
	children: React.ReactNode
	className?: string
}

export function Conversation({ children, className }: ConversationProps) {
	return (
		<StickToBottom className={cn('flex-1 min-h-0 overflow-hidden', className)}>
			{children}
		</StickToBottom>
	)
}

interface ConversationContentProps {
	children: React.ReactNode
	className?: string
}

export function ConversationContent({ children, className }: ConversationContentProps) {
	return (
		<StickToBottom.Content className={cn('flex-1 overflow-y-auto relative', className)}>
			<div className="h-full py-4">
				{children}
			</div>
		</StickToBottom.Content>
	)
}

export function ConversationScrollButton() {
	const { isAtBottom, scrollToBottom } = useStickToBottomContext()

	if (isAtBottom) return null

	return (
		<div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
			<Button
				variant="default"
				onClick={() => scrollToBottom()}
				className="bg-red-600 hover:bg-red-700 text-white rounded-full pointer-events-auto"
				size="sm"
			>
				<ArrowDown className="w-4 h-4" />
			</Button>
		</div>
	)
}

