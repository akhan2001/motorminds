// src/lib/integrations/motor-daas/index.ts

import { MotorDaasClient } from './client';
import type { MotorAuthConfig } from './auth';

export { MotorDaasClient } from './client';
export { MotorDaasAuth } from './auth';
export type { MotorAuthConfig } from './auth';

/**
 * Get a configured MOTOR DaaS client instance
 */
export function getMotorDaasClient(): MotorDaasClient {
    const publicKey = process.env.MOTOR_DAAS_PUBLIC_KEY;
    const privateKey = process.env.MOTOR_DAAS_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
        throw new Error(
            'MOTOR DaaS credentials not configured. ' +
            'Set MOTOR_DAAS_PUBLIC_KEY and MOTOR_DAAS_PRIVATE_KEY environment variables.'
        );
    }

    return new MotorDaasClient({
        publicKey,
        privateKey,
        baseUrl: process.env.MOTOR_DAAS_BASE_URL || 'https://api.motor.com/v1'
    });
}
