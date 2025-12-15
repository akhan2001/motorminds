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
			const result = await motorClient.helloWorld()
			return {
				success: true,
				message: result.Text || 'Hello World',
				note: 'MOTOR DaaS API connection successful'
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				message: 'Failed to connect to MOTOR DaaS API'
			}
		}
	}
})

export const getMotorTools = () => ({
	helloWorld: helloWorldTool
})
