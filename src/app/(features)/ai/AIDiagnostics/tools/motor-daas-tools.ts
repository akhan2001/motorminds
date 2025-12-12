// src/app/(features)/ai/AIDiagnostics/tools/motor-daas-tools.ts

import { tool } from 'ai';
import { z } from 'zod';
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client';
import type {
    MotorVehicleInfo,
    DTCResponse,
    ServiceProcedureResponse,
    PartsResponse,
    MaintenanceScheduleResponse,
    SpecificationsResponse,
    WorkTimeResponse,
    TSBResponse,
    WiringDiagramResponse,
    BulkVehicleAttributesResponse,
    RecommendedFluidsResponse
} from '@/lib/integrations/motor-daas/types';

const motorClient = new MotorDaasClient({
    publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
    privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
    baseUrl: 'https://api.motor.com/v1'
});

export const getVehicleInfoTool = tool<
    { vin: string },
    { success: boolean; data?: MotorVehicleInfo; error?: string; message: string }
>({
    description: 'Get detailed vehicle information by VIN including year, make, model, engine, transmission, and specifications',
    inputSchema: z.object({
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

export const lookupDTCTool = tool<
    { 
        baseVehicleId: number; 
        dtcCode?: string;
        searchTerm?: string;
        engineId?: number;
        submodelId?: number;
        countryId?: number;
        transmissionId?: number;
        driveTypeId?: number;
        bodyStyleId?: number;
        contentSilos?: number[];
        include?: string[];
        itemsPerPage?: number;
        pageIndex?: number;
    },
    { success: boolean; data?: DTCResponse; error?: string; message: string }
>({
    description: 'Look up diagnostic trouble code (DTC) definitions, possible causes, and repair procedures for a specific vehicle. Returns summary information for DTC applications including code, display name, and application details.',
    inputSchema: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info'),
        dtcCode: z.string().optional().describe('Specific DTC code to search for (e.g., P0420, B2425-0D). Searches against the DTC code field.'),
        searchTerm: z.string().optional().describe('Search term for DTC code lookup. Alternative to dtcCode parameter.'),
        engineId: z.number().optional().describe('Engine ID (EN) for engine-specific DTCs'),
        submodelId: z.number().optional().describe('Submodel ID (SM) for trim-specific DTCs'),
        countryId: z.number().optional().describe('Country ID (CO), e.g., 1 for USA'),
        transmissionId: z.number().optional().describe('Transmission ID (TR)'),
        driveTypeId: z.number().optional().describe('Drive Type ID (DT)'),
        bodyStyleId: z.number().optional().describe('Body Style ID (BS)'),
        contentSilos: z.array(z.number()).optional().describe('Content Silos array (default: [15] for Diagnostic Trouble Codes)'),
        include: z.array(z.string()).optional().describe('Additional data to include (e.g., ["Counts"])'),
        itemsPerPage: z.number().optional().describe('Number of results per page (max 30)'),
        pageIndex: z.number().optional().describe('Page index for pagination (0-based)')
    }),
    execute: async ({ 
        baseVehicleId, 
        dtcCode, 
        searchTerm,
        engineId,
        submodelId,
        countryId,
        transmissionId,
        driveTypeId,
        bodyStyleId,
        contentSilos,
        include,
        itemsPerPage,
        pageIndex
    }) => {
        try {
            const dtcResponse = await motorClient.getDiagnosticTroubleCodes(baseVehicleId, {
                dtcCode: dtcCode || searchTerm,
                searchTerm: searchTerm || dtcCode,
                engineId,
                submodelId,
                countryId,
                transmissionId,
                driveTypeId,
                bodyStyleId,
                contentSilos,
                include,
                itemsPerPage,
                pageIndex
            });
            
            const count = dtcResponse.applications?.length || 0;
            const searchInfo = dtcCode || searchTerm ? ` for ${dtcCode || searchTerm}` : '';
            
            return {
                success: true,
                data: dtcResponse,
                message: count > 0 
                    ? `Found ${count} DTC application${count === 1 ? '' : 's'}${searchInfo}`
                    : `No DTC applications found${searchInfo}`
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

export const getServiceProcedureTool = tool<
    { baseVehicleId: number; systemId?: number },
    { success: boolean; data?: ServiceProcedureResponse; error?: string; message: string }
>({
    description: 'Get step-by-step service and repair procedures for a specific vehicle system. Includes detailed instructions, diagrams, and technical specifications.',
    inputSchema: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info'),
        systemId: z.number().optional().describe('Specific system ID to get procedures for (e.g., engine, transmission, brakes)')
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

export const getPartsTool = tool<
    { baseVehicleId: number; partType?: string },
    { success: boolean; data?: PartsResponse; error?: string; message: string }
>({
    description: 'Get parts information including part numbers, descriptions, specifications, and interchange numbers',
    inputSchema: z.object({
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

export const getMaintenanceScheduleTool = tool<
    { baseVehicleId: number },
    { success: boolean; data?: MaintenanceScheduleResponse; error?: string; message: string }
>({
    description: 'Get recommended maintenance schedule including service intervals, required parts, and labor times',
    inputSchema: z.object({
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

export const getSpecificationsTool = tool<
    { baseVehicleId: number },
    { success: boolean; data?: SpecificationsResponse; error?: string; message: string }
>({
    description: 'Get vehicle specifications including fluid capacities, fluid types, torque specs, and technical specifications',
    inputSchema: z.object({
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

export const getWorkTimeTool = tool<
    { 
        baseVehicleId: number; 
        searchTerm?: string;
        vmrsCode?: string;
        engineId?: number;
        submodelId?: number;
        countryId?: number;
        transmissionId?: number;
        driveTypeId?: number;
        bodyStyleId?: number;
        contentSilos?: number[];
        taxonomyIDs?: number[];
        groupID?: number;
        subGroupID?: number;
        systemID?: number;
        include?: string[];
        itemsPerPage?: number;
        pageIndex?: number;
    },
    { success: boolean; data?: WorkTimeResponse; error?: string; message: string }
>({
    description: 'Get estimated work times, labor times, or repair hours for vehicle operations. Use this when the user asks about "estimated work time", "labor time", "work hours", "repair time", "how long", "time estimate", or similar questions about repair operations. Returns summary information for estimated work time applications including base labor time, additional labor time, warranty labor time, required skill level, and service type. Supports searching by operation name (e.g., "brake pad replacement", "oil change", "spark plug"), VMRS code, taxonomy, and vehicle attributes. Defaults to Mechanical Repair Labor (GEN5) content silo.',
    inputSchema: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from vehicle info'),
        searchTerm: z.string().optional().describe('Search term for operation name (searches against taxonomy literal name field, supports partial and complete matches)'),
        vmrsCode: z.string().optional().describe('3, 6, or 9 digit VMRS code to filter results'),
        engineId: z.number().optional().describe('Engine ID (EN) for engine-specific work times'),
        submodelId: z.number().optional().describe('Submodel ID (SM) for trim-specific work times'),
        countryId: z.number().optional().describe('Country ID (CO), e.g., 1 for USA'),
        transmissionId: z.number().optional().describe('Transmission ID (TR)'),
        driveTypeId: z.number().optional().describe('Drive Type ID (DT)'),
        bodyStyleId: z.number().optional().describe('Body Style ID (BS)'),
        contentSilos: z.array(z.number()).optional().describe('Content Silos array (28 = Mechanical Repair Labor GEN5, 103 = HD Estimated Work Times)'),
        taxonomyIDs: z.array(z.number()).optional().describe('Taxonomy IDs to filter by'),
        groupID: z.number().optional().describe('Taxonomy group ID'),
        subGroupID: z.number().optional().describe('Taxonomy sub-group ID'),
        systemID: z.number().optional().describe('Taxonomy system ID'),
        include: z.array(z.string()).optional().describe('Additional data to include (e.g., ["Counts", "VMRSDetails"])'),
        itemsPerPage: z.number().optional().describe('Number of results per page (max 30)'),
        pageIndex: z.number().optional().describe('Page index for pagination (0-based)')
    }),
    execute: async ({ 
        baseVehicleId, 
        searchTerm,
        vmrsCode,
        engineId,
        submodelId,
        countryId,
        transmissionId,
        driveTypeId,
        bodyStyleId,
        contentSilos,
        taxonomyIDs,
        groupID,
        subGroupID,
        systemID,
        include,
        itemsPerPage,
        pageIndex
    }) => {
        try {
            // Set defaults: ContentSilos=28 (Mechanical Repair Labor GEN5), Include=Counts
            const workTimes = await motorClient.getEstimatedWorkTimes(baseVehicleId, {
                searchTerm,
                vmrsCode,
                engineId,
                submodelId,
                countryId,
                transmissionId,
                driveTypeId,
                bodyStyleId,
                contentSilos: contentSilos || [28], // Default to Mechanical Repair Labor (GEN5)
                taxonomyIDs,
                groupID,
                subGroupID,
                systemID,
                include: include || ['Counts'], // Default to include counts
                itemsPerPage,
                pageIndex
            });

            const count = workTimes.applications?.length || workTimes.workTimes?.length || 0;
            const searchInfo = searchTerm ? ` for "${searchTerm}"` : (vmrsCode ? ` for VMRS ${vmrsCode}` : '');

            return {
                success: true,
                data: workTimes,
                message: count > 0
                    ? `Found ${count} work time application${count === 1 ? '' : 's'}${searchInfo}`
                    : `No work time applications found${searchInfo}`
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

export const getTSBTool = tool<
    { baseVehicleId: number; system?: string },
    { success: boolean; data?: TSBResponse; error?: string; message: string }
>({
    description: 'Get Technical Service Bulletins (TSBs) for known issues, recalls, and manufacturer recommendations',
    inputSchema: z.object({
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

export const getWiringDiagramsTool = tool<
    { baseVehicleId: number; saeSystemId?: number; saeSubjectId?: number; searchTerm?: string },
    { success: boolean; data?: WiringDiagramResponse; error?: string; message: string }
>({
    description: 'Get wiring diagrams for electrical system diagnosis and repair. Useful for tracing circuits, finding component locations, and diagnosing electrical issues.',
    inputSchema: z.object({
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

export const getBulkVehicleAttributesTool = tool<
    { baseVehicleIds: number[]; attributeStandard?: 'MOTOR' | 'VCDB' },
    { success: boolean; data?: BulkVehicleAttributesResponse; error?: string; message: string }
>({
    description: 'Get complete attribute information for multiple vehicles at once. Useful for comparing vehicles or batch processing.',
    inputSchema: z.object({
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

export const getRecommendedFluidsTool = tool<
    { 
        baseVehicleId: number; 
        engineId?: number; 
        submodelId?: number;
        contentSilos?: number[];
        includeImages?: boolean;
        transmissionId?: number;
        driveTypeId?: number;
    },
    { success: boolean; data?: RecommendedFluidsResponse; error?: string; message: string }
>({
    description: 'Get recommended fluids and capacities for a vehicle including engine oil, transmission fluid, coolant, brake fluid, and other fluids. Provides OEM specifications and fill capacities. Use contentSilos=[117] for custom fluid recommendations.',
    inputSchema: z.object({
        baseVehicleId: z.number().describe('MOTOR base vehicle ID'),
        engineId: z.number().optional().describe('MOTOR engine ID for engine-specific fluids'),
        submodelId: z.number().optional().describe('MOTOR submodel ID for trim-specific fluids'),
        contentSilos: z.array(z.number()).optional().describe('Content silos to include (e.g., [117] for Custom Fluid Recommendations)'),
        includeImages: z.boolean().optional().describe('Include image data in response'),
        transmissionId: z.number().optional().describe('MOTOR transmission ID'),
        driveTypeId: z.number().optional().describe('MOTOR drive type ID')
    }),
    execute: async ({ baseVehicleId, engineId, submodelId, contentSilos, includeImages, transmissionId, driveTypeId }) => {
        try {
            const fluids = await motorClient.getRecommendedFluids(
                baseVehicleId,
                engineId,
                submodelId,
                {
                    contentSilos,
                    include: includeImages ? ['Image'] : undefined,
                    transmissionId,
                    driveTypeId
                }
            );

            if (fluids.totalCount === 0) {
                return {
                    success: true,
                    data: fluids,
                    message: 'No fluid recommendations found for this vehicle'
                };
            }

            const fluidTypes = fluids.applications
                .map(f => f.fluidType)
                .filter(Boolean)
                .join(', ');

            return {
                success: true,
                data: fluids,
                message: `Found ${fluids.totalCount} fluid recommendations: ${fluidTypes}`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get recommended fluids',
                message: 'Could not retrieve fluid recommendations'
            };
        }
    }
});