// src/app/(features)/ai/diagnostics/tools/motor-daas-tools.ts

import { tool } from 'ai'
import { z } from 'zod'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

const motorClient = new MotorDaasClient({
	publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
	privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
	baseUrl: 'https://api.motor.com/v1'
})

export const helloWorldTool = tool({
	description: 'Test connection to MOTOR DaaS API. Returns a simple "Hello World" message to verify the API is working.',
	inputSchema: z.object({}),
	execute: async () => {
		try {
			console.log('[helloWorldTool] Starting MOTOR DaaS HelloWorld call...')
			const result = await motorClient.helloWorld()
			console.log('[helloWorldTool] Success:', result)
			return {
				success: true,
				message: result.Text || 'Hello World',
				note: 'MOTOR DaaS API connection successful'
			}
		} catch (error) {
			console.error('[helloWorldTool] Error:', error)
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			const errorDetails = error instanceof Error && 'statusCode' in error 
				? `Status ${(error as any).statusCode}: ${errorMessage}`
				: errorMessage
			
			return {
				success: false,
				error: errorDetails,
				message: `Failed to connect to MOTOR DaaS API: ${errorDetails}`,
				details: error instanceof Error ? {
					name: error.name,
					message: error.message,
					...(error as any).statusCode && { statusCode: (error as any).statusCode },
					...(error as any).errorCode && { errorCode: (error as any).errorCode }
				} : undefined
			}
		}
	}
})

export const getMotorTools = () => ({
	helloWorld: helloWorldTool
})
