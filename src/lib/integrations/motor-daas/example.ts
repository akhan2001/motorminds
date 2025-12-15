// src/lib/integrations/motor-daas/example.ts
// Simple HelloWorld example

import { MotorDaasClient } from './client';
import type { MotorAuthConfig } from './auth';

/**
 * Example: Test MOTOR DaaS HelloWorld endpoint
 * 
 * Usage:
 * ```typescript
 * const client = new MotorDaasClient({
 *   publicKey: 'YOUR_PUBLIC_KEY',
 *   privateKey: 'YOUR_PRIVATE_KEY',
 *   baseUrl: 'https://api.motor.com/v1'
 * });
 * 
 * // Simple HelloWorld
 * const result = await client.helloWorld();
 * console.log(result.Text); // "Hello World"
 * 
 * // With correlation ID for tracking
 * const result2 = await client.helloWorld('my-correlation-id-123');
 * 
 * // Generic request method
 * const data = await client.request('/Information/YMME/Years', 'GET', {
 *   min: '1990'
 * });
 * ```
 */
export async function testHelloWorld(config: MotorAuthConfig, correlationId?: string) {
    const client = new MotorDaasClient(config);
    const result = await client.helloWorld(correlationId);
    return result;
}
