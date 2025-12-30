import { streamText } from 'ai'
import { source } from 'common-tags'
import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getModel } from '@/lib/ai/model'
import { getTools } from '@/app/(features)/ai/diagnostics/tools'
import {
	AI_DIAGNOSTICS_PROMPT,
	LIMITATIONS_PROMPT,
	COMPLIANCE_PROMPT,
	MOTOR_API_PROMPT,
	DIAGNOSTIC_WORKFLOW_PROMPT,
} from '@/app/(features)/ai/diagnostics/tools/prompts'
import { prepareMessagesForAPI } from '@/app/(features)/ai/diagnostics/lib/message-utils'
import { sanitizeMessage, type DiagnosticAiOptInLevel } from '@/app/(features)/ai/diagnostics/lib/tool-sanitizer'

export const maxDuration = 120

const requestSchema = z.object({
	messages: z.array(z.any()),
	shopId: z.string(),
	sessionId: z.string().optional(),
	vehicleId: z.number().optional(),
	baseVehicleId: z.number().optional(),
	workOrderId: z.string().optional(),
	vehicleContext: z
		.object({
			vin: z.string().optional(),
			make: z.string().optional(),
			model: z.string().optional(),
			year: z.number().optional(),
		})
		.optional(),
	model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'gpt-4.1-mini']).optional(),
})

export async function POST(request: NextRequest) {
	try {
		// 1. Parse and validate request
		const body = await request.json()
		const { data, error: parseError } = requestSchema.safeParse(body)

		if (parseError) {
			return Response.json(
				{
					error: 'Invalid request body',
					issues: parseError.issues,
				},
				{ status: 400 }
			)
		}

		const { messages: rawMessages, shopId, sessionId, vehicleId, baseVehicleId, vehicleContext, model: requestedModel } = data

		// 2. Get auth token
		const authorization = request.headers.get('authorization')
		const accessToken = authorization?.replace('Bearer ', '')

		// 3. Determine AI opt-in level
		// TODO: Add proper permission logic
		let aiOptInLevel: DiagnosticAiOptInLevel = 'full'
		let isLimited = false

		// 4. Prepare messages for API (last 7 only, sanitized)
		const preparedMessages = prepareMessagesForAPI(rawMessages || []).map((msg) => sanitizeMessage(msg, aiOptInLevel))

		// 5. Get AI model
		const modelResult = await getModel({
			provider: 'openai',
			model: requestedModel ?? 'gpt-4.1-mini',
			routingKey: shopId,
			isLimited,
		})

		if (modelResult.error) {
			return Response.json({ error: modelResult.error.message }, { status: 500 })
		}

		// 6. Build context string
		const contextString = buildVehicleContext(vehicleContext, baseVehicleId, vehicleId)

		// 7. Build system prompt
		const systemPrompt = source`
			${AI_DIAGNOSTICS_PROMPT}
			${DIAGNOSTIC_WORKFLOW_PROMPT}
			${LIMITATIONS_PROMPT}
			${COMPLIANCE_PROMPT}
			${MOTOR_API_PROMPT}
			${contextString ? `Current vehicle context: ${contextString}` : ''}
			Be helpful, accurate, and professional.
		`

		// 8. Build core messages - convert UIMessages to CoreMessages format
		const convertedMessages = preparedMessages.map((msg: any) => {
			// Extract text content from parts array if present
			let content = ''
			if (msg.parts && Array.isArray(msg.parts)) {
				content = msg.parts
					.filter((part: any) => part.type === 'text')
					.map((part: any) => part.text || part.content || '')
					.join('\n')
			} else if (msg.content) {
				content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
			} else if (msg.text) {
				content = msg.text
			}

			return {
				role: msg.role,
				content: content || '',
			}
		})

		const coreMessages = [
			{
				role: 'system' as const,
				content: systemPrompt,
				...(modelResult.promptProviderOptions && {
					providerOptions: modelResult.promptProviderOptions,
				}),
			},
			{
				role: 'assistant' as const,
				content: `Shop ID: ${shopId}. ${contextString}`,
			},
			...convertedMessages,
		]

		// 9. Setup abort controller
		const abortController = new AbortController()
		request.signal.addEventListener('abort', () => abortController.abort())

		// 10. Validate MOTOR DaaS credentials
		if (!process.env.MOTOR_DAAS_PUBLIC_KEY || !process.env.MOTOR_DAAS_PRIVATE_KEY) {
			return Response.json({ error: 'MOTOR DaaS credentials not configured' }, { status: 500 })
		}

		// 11. Get tools
		const tools = await getToolsWithErrorHandling({
			shopId,
			vehicleId,
			authorization: authorization || undefined,
			aiOptInLevel,
			accessToken: accessToken || undefined,
		})

		if (!tools) {
			return Response.json({ error: 'Failed to initialize tools' }, { status: 500 })
		}

		// 12. Stream response
		const result = streamText({
			model: modelResult.model,
			maxSteps: 5,
			messages: coreMessages,
			...(modelResult.providerOptions && { providerOptions: modelResult.providerOptions }),
			tools,
			abortSignal: abortController.signal,
		})

		// 13. Return stream
		return result.toUIMessageStreamResponse({
			originalMessages: preparedMessages,
			sendReasoning: true,
			onError: handleStreamError,
		})
	} catch (error) {
		console.error('Diagnostics API error:', error)
		return Response.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

// Helper Functions

/**
 * Builds vehicle context string
 */
function buildVehicleContext(vehicleContext: any, baseVehicleId?: number, vehicleId?: number): string {
	if (vehicleContext) {
		return `Vehicle: ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}${vehicleContext.vin ? `, VIN: ${vehicleContext.vin}` : ''}${baseVehicleId ? ` (Base Vehicle ID: ${baseVehicleId})` : ''}`
	}
	if (baseVehicleId) {
		return `Base Vehicle ID: ${baseVehicleId}`
	}
	if (vehicleId) {
		return `Vehicle ID: ${vehicleId}`
	}
	return 'No vehicle context'
}

/**
 * Gets tools with error handling
 */
async function getToolsWithErrorHandling(params: {
	shopId: string
	vehicleId?: number
	authorization?: string
	aiOptInLevel: DiagnosticAiOptInLevel
	accessToken?: string
}): Promise<any | null> {
	try {
		const { MotorDaasClient } = await import('@/lib/integrations/motor-daas/client')
		const motorClient = new MotorDaasClient({
			publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
			privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
			baseUrl: 'https://api.motor.com/v1',
		})

		return await getTools({
			shopId: params.shopId,
			vehicleId: params.vehicleId,
			authorization: params.authorization,
			aiOptInLevel: params.aiOptInLevel,
			accessToken: params.accessToken,
			motorClient,
		})
	} catch (error) {
		console.error('Failed to initialize tools:', error)
		return null
	}
}

/**
 * Handles streaming errors
 */
function handleStreamError(error: any): string {
	if (error == null) return 'unknown error'
	if (typeof error === 'string') return error
	if (error instanceof Error) return error.message
	return JSON.stringify(error)
}
