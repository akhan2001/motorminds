import { streamText, convertToModelMessages, stepCountIs } from 'ai'

import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { source } from 'common-tags'
import { createClient } from '@/utils/supabase/server'

import { getModel } from '@/lib/ai/model'
import { getTools } from '@/app/(features)/ai/diagnostics/tools'
import { AI_DIAGNOSTICS_PROMPT, LIMITATIONS_PROMPT, COMPLIANCE_PROMPT, MOTOR_API_PROMPT, DIAGNOSTIC_WORKFLOW_PROMPT } from '@/app/(features)/ai/diagnostics/tools/prompts'

const requestSchema = z.object({
	messages: z.array(z.any()),
	shopId: z.string().optional(),
	sessionId: z.string().optional(),
	vehicleId: z.number().optional(),
	baseVehicleId: z.number().optional(),
	workOrderId: z.string().optional(),
	vehicleContext: z.object({
		vin: z.string().optional(),
		make: z.string().optional(),
		model: z.string().optional(),
		year: z.number().optional(),
	}).optional(),
	model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'gpt-4.1-mini']).optional(),
})

export async function POST(request: NextRequest) {
	try {
		// 1. Parse and validate request
		const body = await request.json()
		const { data, error } = requestSchema.safeParse(body)

		if (error) {
			return Response.json(
				{
					error: 'Invalid request',
					issues: error.issues
				},
				{
					status: 400
				}
			)
		}

		const { messages, shopId, sessionId, vehicleId, baseVehicleId, vehicleContext, model: requestedModel } = data

		// 2. Validate shopId (required for routing)
		if (!shopId) {
			return Response.json(
				{ error: 'shopId is required' },
				{ status: 400 }
			)
		}

		// 3. Get auth token
		const authorization = request.headers.get('authorization')
		const accessToken = authorization?.replace('Bearer ', '')

		// 4. Get AI opt-in level (simplified for now)
		let aiOptInLevel: 'disabled' | 'schema' | 'full' = 'full'
		let isLimited = false

		// TODO: Add permission logic here
		// ...

		// 5. Load previous messages if sessionId provided
		let allMessages = messages || []
		if (sessionId && shopId) {
			try {
				const supabase = await createClient()
				// Verify session belongs to shop
				const { data: session } = await supabase
					.from('mia_sessions')
					.select('id')
					.eq('shop_id', shopId)
					.eq('session_id', sessionId)
					.single()

				if (session) {
					// Load previous messages
					const { data: previousMessages } = await supabase
						.from('mia_messages')
						.select('*')
						.eq('session_id', sessionId)
						.order('created_at', { ascending: true })

					if (previousMessages && previousMessages.length > 0) {
						// Convert database messages to UIMessage format
						const convertedPreviousMessages = previousMessages.map((msg) => ({
							id: msg.id,
							role: msg.role,
							parts: [
								{
									type: 'text',
									text: msg.content,
								},
							],
							metadata: msg.metadata,
						}))
						// Merge with new messages (avoid duplicates)
						const existingIds = new Set(convertedPreviousMessages.map((m) => m.id))
						const newMessages = (messages || []).filter((m: any) => !existingIds.has(m.id))
						allMessages = [...convertedPreviousMessages, ...newMessages]
					}
				}
			} catch (error) {
				console.error('Error loading previous messages:', error)
				// Continue with provided messages if loading fails
			}
		}

		// 6. Clean messages (last 7 only)
		const cleanedMessages = allMessages.slice(-7)

		// 7. Get model
		const modelResult = await getModel({
			provider: 'openai',
			model: requestedModel ?? 'gpt-4.1-mini', // Default to gpt-4.1-mini for higher rate limits
			routingKey: shopId,
			isLimited,
		})

		if (modelResult.error) {
			return Response.json(
				{ error: modelResult.error.message },
				{ status: 500 }
			)
		}

		// 8. Build context string - prioritize vehicleContext for richer context
		const contextString = vehicleContext
			? `Vehicle: ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}${vehicleContext.vin ? `, VIN: ${vehicleContext.vin}` : ''}${baseVehicleId ? ` (Base Vehicle ID: ${baseVehicleId})` : ''}`
			: baseVehicleId
				? `Base Vehicle ID: ${baseVehicleId}`
				: vehicleId
					? `Vehicle ID: ${vehicleId}`
					: 'No vehicle context'

		// 9. Build system prompt - Simplified for Hello World testing
		// const systemPrompt = `You are an automotive diagnostic AI assistant integrated with MOTOR DaaS.

		// Your current capabilities:
		// - Test MOTOR DaaS API connection using the helloWorld tool

		// How to use your tools:
		// - When users ask to "test the connection", "say hello", or want to verify the MOTOR API is working, use the helloWorld tool
		// - The helloWorld tool will test the connection to MOTOR DaaS and return a simple "Hello World" message

		// Scope:
		// - You MUST only answer questions related to vehicle diagnostics and automotive topics
		// - You MUST decline all other questions politely and redirect to automotive topics

		// ${contextString ? `Current vehicle context: ${contextString}` : ''}

		// Be helpful, accurate, and professional.`

		const systemPrompt = source`
			${AI_DIAGNOSTICS_PROMPT}
			${DIAGNOSTIC_WORKFLOW_PROMPT}
			${LIMITATIONS_PROMPT}
			${COMPLIANCE_PROMPT}
			${MOTOR_API_PROMPT}
			${contextString ? `Current vehicle context: ${contextString}` : ''}
			Be helpful, accurate, and professional.
		`

		// 10. Build messages
		const convertedMessages = convertToModelMessages(cleanedMessages)

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

		// 11. Setup abort controller
		const abortController = new AbortController()
		request.signal.addEventListener('abort', () => abortController.abort())

		// 12. Validate MOTOR DaaS credentials
		if (!process.env.MOTOR_DAAS_PUBLIC_KEY || !process.env.MOTOR_DAAS_PRIVATE_KEY) {
			return Response.json(
				{ error: 'MOTOR DaaS credentials not configured' },
				{ status: 500 }
			)
		}

		// 13. Get tools (with error handling)
		let tools
		try {
			// Create a mock MotorDaasClient for getTools (it's not used for Perplexity tools)
			const { MotorDaasClient } = await import('@/lib/integrations/motor-daas/client')
			const motorClient = new MotorDaasClient({
				publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
				privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
				baseUrl: 'https://api.motor.com/v1'
			})

			tools = await getTools({
				shopId,
				vehicleId,
				authorization: authorization || undefined,
				aiOptInLevel,
				accessToken: accessToken || undefined,
				motorClient,
			})
		} catch (toolError) {
			console.error('Failed to initialize tools:', toolError)
			return Response.json(
				{
					error: 'Failed to initialize tools',
					message: toolError instanceof Error ? toolError.message : 'Unknown error'
				},
				{ status: 500 }
			)
		}

		// 14. Stream response
		const result = streamText({
			model: modelResult.model,
			stopWhen: stepCountIs(5),
			messages: coreMessages,
			...(modelResult.providerOptions && { providerOptions: modelResult.providerOptions }),
			tools,
			abortSignal: abortController.signal,
		})

		// 15. Save messages to database if sessionId provided
		if (sessionId && shopId) {
			try {
				const supabase = await createClient()
				// Verify session belongs to shop
				const { data: session } = await supabase
					.from('mia_sessions')
					.select('id')
					.eq('shop_id', shopId)
					.eq('session_id', sessionId)
					.single()

				if (session) {
					// Save user messages (last message if it's from user)
					const lastMessage = cleanedMessages[cleanedMessages.length - 1]
					if (lastMessage && lastMessage.role === 'user') {
						const content = lastMessage.parts?.find((p: any) => p.type === 'text')?.text || ''
						if (content) {
							await supabase.from('mia_messages').insert({
								session_id: sessionId,
								role: 'user',
								content,
								metadata: lastMessage.metadata || {},
							})
						}
					}

					// Update session updated_at
					await supabase
						.from('mia_sessions')
						.update({
							updated_at: new Date().toISOString(),
						})
						.eq('shop_id', shopId)
						.eq('session_id', sessionId)
				}
			} catch (error) {
				console.error('Error saving messages:', error)
				// Don't fail the request if saving fails
			}
		}

		// 16. Return stream with callback to save assistant messages
		return result.toUIMessageStreamResponse({
			originalMessages: cleanedMessages,
			sendReasoning: true,
			onError: (error: any) => {
				if (error == null) return 'unknown error'
				if (typeof error === 'string') return error
				if (error instanceof Error) return error.message
				return JSON.stringify(error)
			},
			async onFinish(result) {
				// Save assistant response if sessionId provided
				if (sessionId && shopId && result.text) {
					try {
						const supabase = await createClient()
						// Verify session belongs to shop
						const { data: session } = await supabase
							.from('mia_sessions')
							.select('id')
							.eq('shop_id', shopId)
							.eq('session_id', sessionId)
							.single()

						if (session) {
							await supabase.from('mia_messages').insert({
								session_id: sessionId,
								role: 'assistant',
								content: result.text,
								metadata: {
									finishReason: result.finishReason,
									usage: result.usage,
								},
							})

							// Update session updated_at
							await supabase
								.from('mia_sessions')
								.update({
									updated_at: new Date().toISOString(),
								})
								.eq('shop_id', shopId)
								.eq('session_id', sessionId)
						}
					} catch (error) {
						console.error('Error saving assistant message:', error)
						// Don't fail if saving fails
					}
				}
			},
		})
	} catch (error) {
		console.error('Diagnostics API error:', error)
		return Response.json(
			{ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}