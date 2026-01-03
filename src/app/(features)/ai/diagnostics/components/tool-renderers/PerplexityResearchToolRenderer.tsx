'use client'

import React from 'react'
import { ExternalLink, Loader2, CheckIcon, AlertCircle } from 'lucide-react'
import { Tool } from '../elements/Tool'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownComponents } from '../Message.Markdown'

type ToolUIPart = {
	type: string
	toolCallId?: string
	state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
	input?: any
	output?: any
}

export function PerplexityResearchToolRenderer({ toolPart }: { toolPart: ToolUIPart }) {
	const { state, input, output } = toolPart

	if (state === 'input-streaming' || state === 'input-available') {
		return (
			<Tool
				icon={<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />}
				label={
					<div>
						<span>Searching online for </span>
						<span className="text-gray-500 dark:text-gray-400">research information</span>
					</div>
				}
			/>
		)
	}

	if (state === 'output-error') {
		return (
			<Tool
				icon={<AlertCircle strokeWidth={1.5} size={12} className="text-red-600 dark:text-red-400" />}
				label={
					<div>
						<span className="text-red-600 dark:text-red-400">Research failed</span>
					</div>
				}
			>
				<div className="text-xs text-red-600 dark:text-red-400">
					{typeof output === 'string' ? output : output?.error || 'Unknown error occurred'}
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
			parsedResult = { content: String(output) }
		}

		// Handle error case
		if (parsedResult.error) {
			return (
				<Tool
					icon={<AlertCircle strokeWidth={1.5} size={12} className="text-red-600 dark:text-red-400" />}
					label={
						<div>
							<span className="text-red-600 dark:text-red-400">Research error</span>
						</div>
					}
				>
					<div className="text-xs text-red-600 dark:text-red-400">
						{parsedResult.error}
					</div>
				</Tool>
			)
		}

		const citations = parsedResult.citations || []
		const searchResults = parsedResult.searchResults || []
		const content = parsedResult.content || ''

		// Render inline content directly (not in collapsible Tool)
		return (
			<div className="space-y-3 w-full max-w-full mt-2 overflow-hidden">
				{/* Status indicator */}
				<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
					<CheckIcon strokeWidth={1.5} size={14} className="text-green-600 dark:text-green-400" />
					<span>Found research results</span>
					{citations.length > 0 && (
						<span className="text-gray-500 dark:text-gray-400">
							({citations.length} source{citations.length !== 1 ? 's' : ''})
						</span>
					)}
				</div>

				{/* Research content */}
				{content && (
					<div className="text-sm max-w-none break-words">
						<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
							{content}
						</ReactMarkdown>
					</div>
				)}

				{/* Sources & References */}
				{(citations.length > 0 || searchResults.length > 0) && (
					<div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
						<div className="text-xs font-medium text-gray-700 dark:text-gray-300">
							Sources & References:
						</div>
						<div className="space-y-1">
							{citations.map((url: string, idx: number) => (
								<a
									key={idx}
									href={url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 underline break-all"
								>
									<ExternalLink size={10} className="flex-shrink-0" />
									<span className="break-all">{url}</span>
								</a>
							))}
							{searchResults.slice(0, 3).map((result: any, idx: number) => (
								<a
									key={`result-${idx}`}
									href={result.url}
									target="_blank"
									rel="noopener noreferrer"
									className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
								>
									<div className="flex items-start gap-2">
										<ExternalLink size={10} className="mt-0.5 flex-shrink-0" />
										<div className="flex-1 min-w-0">
											<div className="font-medium break-words">{result.title || result.url}</div>
											{result.snippet && (
												<div className="text-gray-600 dark:text-gray-400 text-xs mt-1 line-clamp-2 break-words">
													{result.snippet}
												</div>
											)}
										</div>
									</div>
								</a>
							))}
						</div>
					</div>
				)}
			</div>
		)
	}

	return null
}

