// src/lib/integrations/motor-daas/index.ts

/**
 * MOTOR DaaS Integration
 * 
 * This module provides integration with MOTOR Data as a Service (DaaS) API
 * for automotive diagnostic and repair information.
 * 
 * Features:
 * - Vehicle information lookup by VIN
 * - Diagnostic trouble code (DTC) definitions
 * - Service procedures and repair instructions
 * - Parts information and interchange data
 * - Maintenance schedules
 * - Vehicle specifications and fluid capacities
 * - Labor time estimates
 * - Technical Service Bulletins (TSBs)
 * 
 * Usage:
 * ```typescript
 * import { MotorDaasClient } from '@/lib/integrations/motor-daas';
 * 
 * const client = new MotorDaasClient({
 *   publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
 *   privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
 *   baseUrl: 'https://api.motor.com/v1'
 * });
 * 
 * // Look up vehicle by VIN
 * const vehicleInfo = await client.getVehicleInfo('1HGBH41JXMN109186');
 * 
 * // Look up DTC codes
 * const dtcInfo = await client.getDiagnosticTroubleCodes(
 *   vehicleInfo.baseVehicleId,
 *   'P0420'
 * );
 * ```
 */

export { MotorDaasClient } from './client';
export { MotorDaasAuth } from './auth';
export { MotorDaasCache } from './cache';
export { MotorDaasRateLimiter } from './rate-limiter';

export type {
    MotorAuthConfig,
    MotorVehicleInfo,
    DTCCode,
    DTCResponse,
    ServiceProcedure,
    ServiceProcedureResponse,
    Part,
    PartsResponse,
    MaintenanceItem,
    MaintenanceScheduleResponse,
    VehicleSpecification,
    SpecificationsResponse,
    WorkTime,
    WorkTimeResponse,
    TechnicalServiceBulletin,
    TSBResponse,
    WiringDiagram,
    WiringDiagramResponse,
    VehicleAttributes,
    BulkVehicleAttributesResponse,
    MotorApiResponse,
    MotorDaasError,
    RateLimitInfo,
    CacheEntry,
    CacheConfig
} from './types';

/**
 * Create a singleton instance of MotorDaasClient
 */
let clientInstance: InstanceType<typeof MotorDaasClient> | null = null;

export function getMotorDaasClient(): InstanceType<typeof MotorDaasClient> {
    if (!clientInstance) {
        const publicKey = process.env.MOTOR_DAAS_PUBLIC_KEY;
        const privateKey = process.env.MOTOR_DAAS_PRIVATE_KEY;

        if (!publicKey || !privateKey) {
            throw new Error(
                'MOTOR DaaS credentials not configured. Please set MOTOR_DAAS_PUBLIC_KEY and MOTOR_DAAS_PRIVATE_KEY environment variables.'
            );
        }

        const { MotorDaasClient } = require('./client');

        clientInstance = new MotorDaasClient({
            publicKey,
            privateKey,
            baseUrl: process.env.MOTOR_DAAS_BASE_URL || 'https://api.motor.com/v1'
        });
    }

    return clientInstance;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetMotorDaasClient(): void {
    clientInstance = null;
}