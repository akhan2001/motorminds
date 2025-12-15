// @ts-ignore - streamText is available at runtime from ai package
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getMotorTools } from '@/app/(features)/ai/diagnostics/tools/motor-daas-tools'

const requestSchema = z.object({
	messages: z.array(z.any()),
	shopId: z.string().optional(),
	vehicleId: z.number().optional(),
	baseVehicleId: z.number().optional(),
	workOrderId: z.string().optional(),
	dtcCodes: z.array(z.string()).optional(),
	reportedIssue: z.string().optional()
})

export async function POST(request: NextRequest) {
	try {
		// 1. Parse and validate request
		const body = await request.json()
		const parseResult = requestSchema.safeParse(body)

		if (!parseResult.success) {
			return Response.json({ error: 'Invalid request', issues: parseResult.error.issues }, { status: 400 })
		}

		const { messages, shopId, vehicleId, baseVehicleId, dtcCodes, reportedIssue } = parseResult.data

		// 2. Validate environment variables
		if (!process.env.MOTOR_DAAS_PUBLIC_KEY || !process.env.MOTOR_DAAS_PRIVATE_KEY) {
			console.error('MOTOR DaaS credentials not configured')
			return Response.json({ error: 'MOTOR DaaS credentials not configured' }, { status: 500 })
		}

		if (!process.env.OPENAI_API_KEY) {
			console.error('OpenAI API key not configured')
			return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 })
		}

		// 3. Get tools
		const tools = getMotorTools()

		// 5. Build system prompt
		const systemPrompt = `You are an automotive diagnostic assistant powered by MOTOR DaaS.

Your capabilities:
- Test MOTOR DaaS API connection using the helloWorld tool

${baseVehicleId ? `Current vehicle context: Base Vehicle ID ${baseVehicleId}` : ''}
${dtcCodes && dtcCodes.length > 0 ? `Active DTC codes: ${dtcCodes.join(', ')}` : ''}
${reportedIssue ? `Customer reported issue: ${reportedIssue}` : ''}

Be helpful, accurate, and professional.`

		// 6. Convert messages to model format
		const coreMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
			{ role: 'system', content: systemPrompt }
		]

		// Convert UI messages to core messages
		for (const msg of messages) {
			if (msg.role === 'user' || msg.role === 'assistant') {
				// Extract text content from parts array (AI SDK v5 format)
				let content = ''
				if (msg.parts && Array.isArray(msg.parts)) {
					const textParts = msg.parts.filter((part: any) => part.type === 'text')
					content = textParts.map((part: any) => part.text).join('\n')
				} else if (msg.content) {
					content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
				} else if (msg.text) {
					content = msg.text
				}

				if (content) {
					coreMessages.push({
						role: msg.role,
						content
					})
				}
			}
		}

		// 7. Stream AI response
		const result = streamText({
			model: openai('gpt-4'),
			messages: coreMessages,
			tools,
			maxSteps: 5
		})

		// 8. Return stream
		return result.toDataStreamResponse()
	} catch (error) {
		console.error('Diagnostics API error:', error)
		return Response.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

