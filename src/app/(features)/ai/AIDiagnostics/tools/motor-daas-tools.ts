// src/app/(features)/ai/AIDiagnostics/tools/motor-daas-tools.ts

import { tool } from 'ai';
import { z } from 'zod';
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client';

const motorClient = new MotorDaasClient({
    publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
    privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
    baseUrl: 'https://api.motor.com/v1'
});

export const getVehicleInfoTool = tool({
    description: 'Get detailed vehicle information by VIN including year, make, model, engine, transmission, and specifications',
    parameters: z.object({
        vin: z.string().length(17).describe('17-character Vehicle Identification Number')
    }),
    execute: async ({ vin }) => {
        try {
            const vehicleInfo = await motorClient.getVehicleInfo(vin);
            return {
                success: true,
                data: vehicleInfo,
                message: `Retrieved information for ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve vehicle information',
                message: 'Could not find vehicle information for the provided VIN'
            };
        }
    }
});

export const lookupDTCTool = tool({
    description: 'Look up diagnostic trouble code (DTC) definitions, possible causes, and repair procedures for a specific vehicle',
    parameters: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info'),
        dtcCode: z.string().optional().describe('Specific DTC code (e.g., P0420) to look up. If not provided, returns all DTCs for the vehicle')
    }),
    execute: async ({ baseVehicleId, dtcCode }) => {
        try {
            const dtcResponse = await motorClient.getDiagnosticTroubleCodes(baseVehicleId, dtcCode);

            if (dtcResponse.codes.length === 0) {
                return {
                    success: true,
                    data: dtcResponse,
                    message: dtcCode
                        ? `No information found for DTC code ${dtcCode}`
                        : 'No DTC codes found for this vehicle'
                };
            }

            return {
                success: true,
                data: dtcResponse,
                message: dtcCode
                    ? `Found definition for DTC ${dtcCode}`
                    : `Found ${dtcResponse.totalCount} DTC codes`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to lookup DTC',
                message: 'Could not retrieve DTC information'
            };
        }
    }
});

export const getServiceProcedureTool = tool({
    description: 'Get detailed service and repair procedures for a vehicle, including step-by-step instructions, specifications, and warnings',
    parameters: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info'),
        systemId: z.number().optional().describe('Specific system ID to filter procedures (e.g., engine, transmission, brakes)')
    }),
    execute: async ({ baseVehicleId, systemId }) => {
        try {
            const procedures = await motorClient.getServiceProcedures(baseVehicleId, systemId);

            return {
                success: true,
                data: procedures,
                message: `Found ${procedures.totalCount} service procedures`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get service procedures',
                message: 'Could not retrieve service procedures'
            };
        }
    }
});

export const getPartsTool = tool({
    description: 'Get parts information including part numbers, descriptions, specifications, and interchange numbers',
    parameters: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info'),
        partType: z.string().optional().describe('Specific part type to search for (e.g., "brake pad", "oil filter")')
    }),
    execute: async ({ baseVehicleId, partType }) => {
        try {
            const parts = await motorClient.getParts(baseVehicleId, partType);

            return {
                success: true,
                data: parts,
                message: partType
                    ? `Found ${parts.totalCount} parts matching "${partType}"`
                    : `Found ${parts.totalCount} parts`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get parts',
                message: 'Could not retrieve parts information'
            };
        }
    }
});

export const getMaintenanceScheduleTool = tool({
    description: 'Get recommended maintenance schedule including service intervals, required parts, and labor times',
    parameters: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info')
    }),
    execute: async ({ baseVehicleId }) => {
        try {
            const schedule = await motorClient.getMaintenanceSchedules(baseVehicleId);

            return {
                success: true,
                data: schedule,
                message: `Found ${schedule.totalCount} maintenance items`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get maintenance schedule',
                message: 'Could not retrieve maintenance schedule'
            };
        }
    }
});

export const getSpecificationsTool = tool({
    description: 'Get vehicle specifications including fluid capacities, fluid types, torque specs, and technical specifications',
    parameters: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info')
    }),
    execute: async ({ baseVehicleId }) => {
        try {
            const specs = await motorClient.getSpecifications(baseVehicleId);

            return {
                success: true,
                data: specs,
                message: `Retrieved ${specs.totalCount} specifications`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get specifications',
                message: 'Could not retrieve vehicle specifications'
            };
        }
    }
});

export const getWorkTimeTool = tool({
    description: 'Get estimated labor times for repair operations to calculate accurate labor costs',
    parameters: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info'),
        operation: z.string().optional().describe('Specific operation to get labor time for (e.g., "brake pad replacement")')
    }),
    execute: async ({ baseVehicleId, operation }) => {
        try {
            const workTimes = await motorClient.getEstimatedWorkTimes(baseVehicleId, operation);

            return {
                success: true,
                data: workTimes,
                message: operation
                    ? `Found labor time for "${operation}"`
                    : `Found ${workTimes.totalCount} labor time estimates`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get work times',
                message: 'Could not retrieve labor time estimates'
            };
        }
    }
});

export const getTSBTool = tool({
    description: 'Get Technical Service Bulletins (TSBs) for known issues, recalls, and manufacturer recommendations',
    parameters: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info'),
        system: z.string().optional().describe('Specific system to filter TSBs (e.g., "engine", "transmission")')
    }),
    execute: async ({ baseVehicleId, system }) => {
        try {
            const tsbs = await motorClient.getTechnicalServiceBulletins(baseVehicleId, system);

            return {
                success: true,
                data: tsbs,
                message: system
                    ? `Found ${tsbs.totalCount} TSBs for ${system}`
                    : `Found ${tsbs.totalCount} TSBs`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get TSBs',
                message: 'Could not retrieve Technical Service Bulletins'
            };
        }
    }
});

export const getWiringDiagramsTool = tool({
    description: 'Get wiring diagrams for electrical system diagnosis and repair. Useful for tracing circuits, finding component locations, and diagnosing electrical issues.',
    parameters: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info'),
        saeSystemId: z.number().optional().describe('SAE System ID to filter diagrams'),
        saeSubjectId: z.number().optional().describe('SAE Subject ID to filter diagrams'),
        searchTerm: z.string().optional().describe('Search term to find specific diagrams (e.g., "headlight", "fuel pump")')
    }),
    execute: async ({ baseVehicleId, saeSystemId, saeSubjectId, searchTerm }) => {
        try {
            const diagrams = await motorClient.getWiringDiagrams(baseVehicleId, {
                saeSystemId,
                saeSubjectId,
                searchTerm
            });

            return {
                success: true,
                data: diagrams,
                message: searchTerm
                    ? `Found ${diagrams.totalCount} wiring diagrams matching "${searchTerm}"`
                    : `Found ${diagrams.totalCount} wiring diagrams`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get wiring diagrams',
                message: 'Could not retrieve wiring diagrams'
            };
        }
    }
});

export const getBulkVehicleAttributesTool = tool({
    description: 'Get complete attribute information for multiple vehicles at once. Useful for comparing vehicles or batch processing.',
    parameters: z.object({
        baseVehicleIds: z.array(z.number()).describe('Array of base vehicle IDs to lookup'),
        attributeStandard: z.enum(['MOTOR', 'VCDB']).optional().describe('Attribute standard to use (default: MOTOR)')
    }),
    execute: async ({ baseVehicleIds, attributeStandard }) => {
        try {
            const attributes = await motorClient.getBulkVehicleAttributes(
                baseVehicleIds,
                attributeStandard as 'MOTOR' | 'VCDB'
            );

            return {
                success: true,
                data: attributes,
                message: `Retrieved attributes for ${attributes.vehicles.length} vehicles`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get vehicle attributes',
                message: 'Could not retrieve bulk vehicle attributes'
            };
        }
    }
});