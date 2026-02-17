import { tool } from 'ai'
import { z } from 'zod'
import {
	DIAGNOSTIC_COMPONENTS,
	inferDiagnosticComponent,
} from '@/lib/services/diagnostics-3d-locator-service'

export const getRenderingTools = () => ({
	rename_chat: tool({
		description:
			'Rename the current chat session when the current chat name does not describe the conversation topic.',
		inputSchema: z.object({
			newName: z.string().describe('The new name for the chat session. Five words or less.'),
		}),
		execute: async () => {
			return { status: 'Chat rename request sent to client' }
		},
	}),

	showComponentLocation: tool({
		description:
			'Display an embedded 3D component location block in the chat conversation for a specific vehicle component.',
		inputSchema: z.object({
			component: z.enum(DIAGNOSTIC_COMPONENTS).describe('Canonical component id to locate in 3D.'),
			confidence: z.number().min(0).max(1).optional(),
			possibleIssue: z.string().min(1).optional(),
			explanation: z.string().min(1).optional(),
			userPrompt: z.string().min(1).optional(),
		}),
		execute: async ({ component, confidence, possibleIssue, explanation, userPrompt }) => {
			const inferred = inferDiagnosticComponent(userPrompt || component)
			return {
				component,
				confidence: confidence ?? inferred.confidence,
				possibleIssue: possibleIssue ?? inferred.possibleIssue,
				explanation: explanation ?? inferred.explanation,
				userPrompt: userPrompt ?? `Locate ${component} in the vehicle`,
			}
		},
	}),
})