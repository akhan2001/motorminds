'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

interface DiagnosticsOnboardingProps {
	onSendMessage: (text: string) => void
}

const examplePrompts = [
	'Customer reports rough idle and CEL, no codes stored',
	'P0300 random misfire, already replaced plugs and coils',
	'Intermittent no-start, cranks fine but won\'t fire',
	'AC blows warm at idle, cold when driving',
	'Transmission slipping between 2nd and 3rd, no CEL',
	'ABS and traction control lights on after brake job',
	'Customer hears clicking noise from front end when turning',
	'Battery keeps dying overnight, already tested alternator',
	'P0171 and P0174 together, lean codes both banks',
	'Coolant leak but can\'t find the source, no visible drips',
]

export function DiagnosticsOnboarding({ onSendMessage }: DiagnosticsOnboardingProps) {
	return (
		<div className="flex flex-col items-center justify-center h-full text-center">
			<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
				AI-Powered Diagnostics
			</h3>
			<p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
				Describe the vehicle issue, provide DTC codes, or ask diagnostic questions.
				The AI will help analyze the problem and provide repair guidance.
			</p>
			<div className="grid grid-cols-1 gap-2 max-w-md text-left">
				{examplePrompts.map((prompt, index) => (
					<button
						key={index}
						onClick={() => onSendMessage(prompt)}
						className="text-left text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 py-2 transition-colors"
					>
						{prompt}
					</button>
				))}
			</div>
		</div>
	)
}

