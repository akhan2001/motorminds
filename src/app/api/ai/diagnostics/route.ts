/**
 * AI Diagnostics API Route
 * 
 * Following Supabase patterns:
 * - Static system prompt (cacheable)
 * - Dynamic context in assistant message
 * - Stateless tools with dependency injection
 * - AI SDK handles tool chaining (maxSteps)
 */

import { streamText, convertToModelMessages, maxSteps } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { source } from 'common-tags';

import { getModel } from '@/lib/ai/model';
import { getTools } from '@/app/(features)/ai/diagnostics/tools';
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client';
import {
	AI_DIAGNOSTICS_PROMPT,
	LIMITATIONS_PROMPT,
	COMPLIANCE_PROMPT,
	MOTOR_API_PROMPT,
	DIAGNOSTIC_WORKFLOW_PROMPT,
} from '@/app/(features)/ai/diagnostics/tools/prompts';
import type { DiagnosticAiOptInLevel } from '@/app/(features)/ai/diagnostics/tools/tool-filter';

const requestSchema = z.object({
	messages: z.array(z.any()),
	shopId: z.string().optional(),
	sessionId: z.string().optional(),
	vehicleId: z.number().optional(),
	baseVehicleId: z.number().optional(),
	engineId: z.number().optional(),
	workOrderId: z.string().optional(),
	vehicleContext: z
		.object({
			vin: z.string().optional(),
			make: z.string().optional(),
			model: z.string().optional(),
			year: z.number().optional(),
			baseVehicleId: z.number().optional(),
			engineId: z.number().optional(),
			engineName: z.string().optional(),
			engineData: z.any().optional(),
		})
		.optional(),
	model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'gpt-4.1-mini']).optional(),
});

/**
 * Build vehicle context string for AI
 */
function buildVehicleContext(params: {
	vehicleContext?: {
		year?: number;
		make?: string;
		model?: string;
		vin?: string;
		baseVehicleId?: number;
		engineId?: number;
		engineName?: string;
		engineData?: any;
	};
	vehicleId?: number;
	baseVehicleId?: number;
	engineId?: number;
}): string {
	const { vehicleContext, vehicleId, baseVehicleId, engineId } = params;
	
	// Use vehicleContext for richer context
	const finalEngineId = vehicleContext?.engineId || engineId;
	const finalEngineName = vehicleContext?.engineName;
	const engineData = vehicleContext?.engineData;
	const finalBaseVehicleId = vehicleContext?.baseVehicleId || baseVehicleId;
	
	// Build engine details string
	let engineDetails = '';
	if (engineData && engineData.EngineID) {
		const engineParts: string[] = [];
		engineParts.push(`Engine ID: ${engineData.EngineID}`);
		if (engineData.Description) engineParts.push(`Description: ${engineData.Description}`);
		if (engineData.Designation) engineParts.push(`Designation: ${engineData.Designation}`);
		if (engineData.CylinderLiter) engineParts.push(`${engineData.CylinderLiter}L`);
		if (engineData.Cylinders) engineParts.push(`${engineData.Cylinders} cylinders`);
		if (engineData.FuelType) engineParts.push(`Fuel: ${engineData.FuelType}`);
		if (engineData.Aspiration) engineParts.push(`Aspiration: ${engineData.Aspiration}`);
		if (engineData.HorsePower) engineParts.push(`${engineData.HorsePower} HP`);
		if (engineData.KilowattPower) engineParts.push(`${engineData.KilowattPower} kW`);
		if (engineData.Valves) engineParts.push(`${engineData.Valves} valves`);
		if (engineData.BlockType) engineParts.push(`Block: ${engineData.BlockType}`);
		if (engineData.CylinderHeadType) engineParts.push(`Head: ${engineData.CylinderHeadType}`);
		if (engineData.IgnitionSystem) engineParts.push(`Ignition: ${engineData.IgnitionSystem}`);
		if (engineData.Manufacturer) engineParts.push(`Manufacturer: ${engineData.Manufacturer}`);
		if (engineData.Version) engineParts.push(`Version: ${engineData.Version}`);
		if (engineData.CID) engineParts.push(`CID: ${engineData.CID}`);
		if (engineData.CylinderCC) engineParts.push(`CC: ${engineData.CylinderCC}`);
		
		engineDetails = ` Engine: ${engineParts.join(', ')}.`;
	} else if (finalEngineId) {
		engineDetails = finalEngineName 
			? ` Engine ID: ${finalEngineId} (${finalEngineName}).`
			: ` Engine ID: ${finalEngineId}.`;
	}
	
	if (vehicleContext?.year && vehicleContext?.make && vehicleContext?.model) {
		return `Vehicle: ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}${vehicleContext.vin ? `, VIN: ${vehicleContext.vin}` : ''}${finalBaseVehicleId ? ` (Base Vehicle ID: ${finalBaseVehicleId})` : ''}.${engineDetails}`;
	}
	
	if (finalBaseVehicleId) {
		return `Base Vehicle ID: ${finalBaseVehicleId}${finalEngineId ? `, Engine ID: ${finalEngineId}` : ''}`;
	}
	
	if (vehicleId) {
		return `Vehicle ID: ${vehicleId}${finalEngineId ? `, Engine ID: ${finalEngineId}` : ''}`;
	}
	
	return 'No vehicle context';
}

export async function POST(request: NextRequest) {
	try {
		// 1. Parse and validate request
		const body = await request.json();
		const { data, error } = requestSchema.safeParse(body);

		if (error) {
			return Response.json(
				{ error: 'Invalid request', issues: error.issues },
				{ status: 400 }
			);
		}

		const {
			messages,
			shopId,
			sessionId,
			vehicleId,
			baseVehicleId,
			engineId,
			vehicleContext,
			model: requestedModel,
		} = data;

		// 2. Validate shopId
		if (!shopId) {
			return Response.json(
				{ error: 'shopId is required' },
				{ status: 400 }
			);
		}

		// 3. Get auth token
		const authorization = request.headers.get('authorization');
		const accessToken = authorization?.replace('Bearer ', '');

		// 4. Get AI opt-in level (default to full for now)
		// TODO: Fetch from shop settings
		const aiOptInLevel: DiagnosticAiOptInLevel = 'full';
		const isLimited = false;

		// 5. Clean messages (last 7 only)
		const cleanedMessages = (messages || []).slice(-7);

		// 6. Get model
		const modelResult = await getModel({
			provider: 'openai',
			model: (requestedModel ?? 'gpt-4o-mini') as any,
			routingKey: shopId,
			isLimited,
		});

		if (modelResult.error) {
			return Response.json(
				{ error: modelResult.error.message },
				{ status: 500 }
			);
		}

		// 7. Build context string
		const finalBaseVehicleId = vehicleContext?.baseVehicleId || baseVehicleId;
		const finalEngineId = vehicleContext?.engineId || engineId;
		
		const contextString = buildVehicleContext({
			vehicleContext,
			vehicleId,
			baseVehicleId: finalBaseVehicleId,
			engineId: finalEngineId,
		});

		// 8. Build system prompt (STATIC - cacheable with Bedrock)
		// Following Supabase pattern: keep system prompt static for caching
		const systemPrompt = source`
			${AI_DIAGNOSTICS_PROMPT}
			${DIAGNOSTIC_WORKFLOW_PROMPT}
			${LIMITATIONS_PROMPT}
			${COMPLIANCE_PROMPT}
			${MOTOR_API_PROMPT}
			Be helpful, accurate, and professional.
		`;

		// 9. Build messages with dynamic context in assistant message
		// Following Supabase pattern: dynamic context goes in assistant message, not system
		const convertedMessages = await convertToModelMessages(cleanedMessages);

		const coreMessages = [
			{
				role: 'system' as const,
				content: systemPrompt,
				...(modelResult.promptProviderOptions && {
					providerOptions: modelResult.promptProviderOptions,
				}),
			},
			{
				// Dynamic context in assistant message (Supabase pattern)
				role: 'assistant' as const,
				content: `Shop ID: ${shopId}. ${contextString}`,
			},
			...convertedMessages,
		];

		// 10. Setup abort controller
		const abortController = new AbortController();
		request.signal.addEventListener('abort', () => abortController.abort());

		// 11. Validate MOTOR DaaS credentials
		if (!process.env.MOTOR_DAAS_PUBLIC_KEY || !process.env.MOTOR_DAAS_PRIVATE_KEY) {
			return Response.json(
				{ error: 'MOTOR DaaS credentials not configured' },
				{ status: 500 }
			);
		}

		// 12. Create Motor client and get tools
		let tools;
		try {
			const motorClient = new MotorDaasClient({
				publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
				privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
				baseUrl: 'https://api.motor.com/v1',
			});

			// Get tools with context injected via closure
			tools = await getTools({
				shopId,
				vehicleId,
				baseVehicleId: finalBaseVehicleId,
				engineId: finalEngineId,
				authorization: authorization || undefined,
				aiOptInLevel,
				accessToken: accessToken || undefined,
				motorClient,
			});
		} catch (toolError) {
			console.error('Failed to initialize tools:', toolError);
			return Response.json(
				{
					error: 'Failed to initialize tools',
					message: toolError instanceof Error ? toolError.message : 'Unknown error',
				},
				{ status: 500 }
			);
		}

		// 13. Stream response
		// Following Supabase pattern: maxSteps limits tool roundtrips, AI SDK handles chaining
		const result = streamText({
			model: modelResult.model,
			maxSteps: 5, // Limit tool calling rounds (Supabase uses stepCountIs(5))
			messages: coreMessages,
			...(modelResult.providerOptions && {
				providerOptions: modelResult.providerOptions,
			}),
			tools,
			abortSignal: abortController.signal,
		});

		// 14. Return stream
		return result.toUIMessageStreamResponse({
			originalMessages: cleanedMessages,
			sendReasoning: true,
			onError: (error: any) => {
				if (error == null) return 'unknown error';
				if (typeof error === 'string') return error;
				if (error instanceof Error) return error.message;
				return JSON.stringify(error);
			},
		});
	} catch (error) {
		console.error('Diagnostics API error:', error);
		return Response.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
