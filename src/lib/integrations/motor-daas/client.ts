// src/lib/integrations/motor-daas/client.ts

import { MotorDaasAuth } from './auth';
import { MotorDaasCache } from './cache';
import { MotorDaasRateLimiter } from './rate-limiter';
import {
    MotorAuthConfig,
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
    RecommendedFluidsResponse,
    MotorDaasError,
    YearResponse,
    MakeResponse,
    ModelResponse,
    EngineResponse,
    SubmodelResponse
} from './types';

export class MotorDaasClient {
    private auth: MotorDaasAuth;
    private cache: MotorDaasCache;
    private rateLimiter: MotorDaasRateLimiter;
    private baseUrl: string;

    constructor(config: MotorAuthConfig) {
        this.auth = new MotorDaasAuth(config);
        this.cache = new MotorDaasCache({
            defaultTTL: 3600, // 1 hour
            maxSize: 1000
        });
        this.rateLimiter = new MotorDaasRateLimiter(1500, 15);
        this.baseUrl = config.baseUrl;
    }

    /**
     * Test HelloWorld endpoint - simple test to verify authentication
     */
    async testHelloWorld(): Promise<{ Text: string }> {
        const endpoint = '/HelloWorld';
        const response = await this.makeRequest<{ Text: string }>(endpoint);
        return response;
    }

    /**
     * Get vehicle information by VIN
     * Based on MOTOR API Swagger: /Information/Vehicles/Search/VIN/{VIN}
     */
    async getVehicleInfo(vin: string): Promise<MotorVehicleInfo> {
        // Try the correct endpoint format from Swagger docs
        const endpoint = `/Information/Vehicles/Search/VIN/${vin}`;
        const cacheKey = MotorDaasCache.generateKey(endpoint);

        // Check cache first
        const cached = this.cache.get<MotorVehicleInfo>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<MotorVehicleInfo>(endpoint);

        // Cache for 24 hours (vehicle info rarely changes)
        this.cache.set(cacheKey, response, 86400);

        return response;
    }

    async getYears(): Promise<YearResponse> {
        const endpoint = '/Information/Vehicles/Search/Years';
        const cacheKey = MotorDaasCache.generateKey(endpoint);

        const cached = this.cache.get<YearResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<YearResponse>(endpoint);

        // Cache for 7 days (years rarely change)
        this.cache.set(cacheKey, response, 604800); // 7 days

        return response;
    }

    /**
     * Get diagnostic trouble codes for a vehicle
     * Based on MOTOR API: /Information/Vehicles/Attributes/BaseVehicleID/{ID}/Content/Summaries/Of/DiagnosticTroubleCodes
     */
    async getDiagnosticTroubleCodes(
        baseVehicleId: number,
        options?: {
            dtcCode?: string;
            contentSilos?: number[];
            itemsPerPage?: number;
            pageIndex?: number;
            saeSubjectId?: number;
            saeSystemId?: number;
            searchTerm?: string;
            include?: string[];
            // Vehicle attribute IDs
            countryId?: number; // CO
            engineId?: number; // EN
            submodelId?: number; // SM
            transmissionId?: number; // TR
            driveTypeId?: number; // DT
            bodyStyleId?: number; // BS
            bedTypeId?: number; // BD
            brakeTypeId?: number; // BR
            axleTypeId?: number; // AX
            cabTypeId?: number; // CB
            springId?: number; // SP
            steeringId?: number; // ST
            wheelBaseId?: number; // WB
            manufactureBodyCodeId?: number; // MB
        }
    ): Promise<DTCResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/DiagnosticTroubleCodes`;
        
        // MOTOR API requires ContentSilos=15 for Diagnostic Trouble Codes
        const params: Record<string, string | number | number[] | string[]> = {
            ContentSilos: options?.contentSilos || [15],
            AttributeStandard: 'MOTOR'
        };
        
        // Add optional parameters
        if (options?.dtcCode) {
            params.SearchTerm = options.dtcCode;
        }
        if (options?.searchTerm) {
            params.SearchTerm = options.searchTerm;
        }
        if (options?.itemsPerPage) {
            params.ItemsPerPage = options.itemsPerPage;
        }
        if (options?.pageIndex !== undefined) {
            params.PageIndex = options.pageIndex;
        }
        if (options?.saeSubjectId) {
            params.SAESubjectID = options.saeSubjectId;
        }
        if (options?.saeSystemId) {
            params.SAESystemID = options.saeSystemId;
        }
        if (options?.include) {
            params.Include = options.include;
        }
        
        // Vehicle attribute IDs
        if (options?.countryId) params.CO = options.countryId;
        if (options?.engineId) params.EN = options.engineId;
        if (options?.submodelId) params.SM = options.submodelId;
        if (options?.transmissionId) params.TR = options.transmissionId;
        if (options?.driveTypeId) params.DT = options.driveTypeId;
        if (options?.bodyStyleId) params.BS = options.bodyStyleId;
        if (options?.bedTypeId) params.BD = options.bedTypeId;
        if (options?.brakeTypeId) params.BR = options.brakeTypeId;
        if (options?.axleTypeId) params.AX = options.axleTypeId;
        if (options?.cabTypeId) params.CB = options.cabTypeId;
        if (options?.springId) params.SP = options.springId;
        if (options?.steeringId) params.ST = options.steeringId;
        if (options?.wheelBaseId) params.WB = options.wheelBaseId;
        if (options?.manufactureBodyCodeId) params.MB = options.manufactureBodyCodeId;
        
        const cacheKey = MotorDaasCache.generateKey(endpoint, params);

        const cached = this.cache.get<DTCResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        // Make request - API returns { Body: { Applications: [] }, Header: { PagingInfo: {} } }
        const response = await this.makeRequest<{
            Body?: {
                Applications?: any[];
            };
            Header?: {
                PagingInfo?: {
                    TotalItemCount?: number;
                };
            };
            Applications?: any[]; // Direct response format
        }>(endpoint, 'GET', params);

        // Parse response - makeRequest already unwraps Body if present
        const applications = Array.isArray(response?.Applications) 
            ? response.Applications 
            : (response?.Body?.Applications || []);
        
        const totalCount = response?.Header?.PagingInfo?.TotalItemCount 
            || applications.length;

        // Map to DTCResponse format
        const dtcResponse: DTCResponse = {
            baseVehicleId,
            applications: applications.map((app: any) => ({
                Item: {
                    Code: app.Item?.Code || app.Code || '',
                    DTCID: app.Item?.DTCID || app.DTCID || 0
                },
                ApplicationID: app.ApplicationID || 0,
                AttributeMappings: app.AttributeMappings || [],
                ContentSilos: app.ContentSilos || [],
                DisplayName: app.DisplayName || '',
                IsActive: app.IsActive !== undefined ? app.IsActive : true,
                Links: app.Links || [],
                Qualifiers: app.Qualifiers || []
            })),
            totalCount
        };

        // Cache DTC data for 6 hours
        this.cache.set(cacheKey, dtcResponse, 21600);

        return dtcResponse;
    }

    /**
     * Get service procedures for a vehicle
     */
    async getServiceProcedures(
        baseVehicleId: number,
        systemId?: number
    ): Promise<ServiceProcedureResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/ServiceProcedures`;
        const params = systemId ? { systemId } : undefined;
        const cacheKey = MotorDaasCache.generateKey(endpoint, params);

        const cached = this.cache.get<ServiceProcedureResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<ServiceProcedureResponse>(endpoint, 'GET', params);

        // Cache for 12 hours
        this.cache.set(cacheKey, response, 43200);

        return response;
    }

    /**
     * Get parts information for a vehicle
     */
    async getParts(
        baseVehicleId: number,
        partType?: string
    ): Promise<PartsResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/Parts`;
        const params = partType ? { partType } : undefined;
        const cacheKey = MotorDaasCache.generateKey(endpoint, params);

        const cached = this.cache.get<PartsResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<PartsResponse>(endpoint, 'GET', params);

        // Cache for 6 hours
        this.cache.set(cacheKey, response, 21600);

        return response;
    }

    /**
     * Get maintenance schedule for a vehicle
     */
    async getMaintenanceSchedules(
        baseVehicleId: number
    ): Promise<MaintenanceScheduleResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/MaintenanceSchedules`;
        const cacheKey = MotorDaasCache.generateKey(endpoint);

        const cached = this.cache.get<MaintenanceScheduleResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<MaintenanceScheduleResponse>(endpoint);

        // Cache for 24 hours
        this.cache.set(cacheKey, response, 86400);

        return response;
    }

    /**
     * Get vehicle specifications and fluid capacities
     */
    async getSpecifications(
        baseVehicleId: number
    ): Promise<SpecificationsResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/Specifications`;
        const cacheKey = MotorDaasCache.generateKey(endpoint);

        const cached = this.cache.get<SpecificationsResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<SpecificationsResponse>(endpoint);

        // Cache for 24 hours (specs don't change)
        this.cache.set(cacheKey, response, 86400);

        return response;
    }

    /**
     * Get estimated work times for repairs
     */
    async getEstimatedWorkTimes(
        baseVehicleId: number,
        options?: {
            contentSilos?: number[];
            taxonomyIDs?: number[];
            groupID?: number;
            subGroupID?: number;
            systemID?: number;
            itemsPerPage?: number;
            pageIndex?: number;
            searchTerm?: string;
            vmrsCode?: string;
            include?: string[];
            partTerminologyIDs?: number[];
            // Vehicle attribute IDs
            countryId?: number; // CO
            engineId?: number; // EN
            submodelId?: number; // SM
            transmissionId?: number; // TR
            driveTypeId?: number; // DT
            bodyStyleId?: number; // BS
            bedTypeId?: number; // BD
            brakeTypeId?: number; // BR
            axleTypeId?: number; // AX
            cabTypeId?: number; // CB
            springId?: number; // SP
            steeringId?: number; // ST
            wheelBaseId?: number; // WB
            manufactureBodyCodeId?: number; // MB
        }
    ): Promise<WorkTimeResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/EstimatedWorkTimes`;
        
        const params: Record<string, string | number | number[] | string[]> = {
            AttributeStandard: 'MOTOR'
        };
        
        // Content Silos (28 = Mechanical Repair Labor (GEN5), 103 = HD Estimated Work Times)
        if (options?.contentSilos) {
            params.ContentSilos = options.contentSilos;
        }
        
        // Taxonomy parameters
        if (options?.taxonomyIDs) {
            params.TaxonomyIDs = options.taxonomyIDs;
        }
        if (options?.groupID) {
            params.GroupID = options.groupID;
        }
        if (options?.subGroupID) {
            params.SubGroupID = options.subGroupID;
        }
        if (options?.systemID) {
            params.SystemID = options.systemID;
        }
        
        // Pagination
        if (options?.itemsPerPage) {
            params.ItemsPerPage = options.itemsPerPage;
        }
        if (options?.pageIndex !== undefined) {
            params.PageIndex = options.pageIndex;
        }
        
        // Search
        if (options?.searchTerm) {
            params.SearchTerm = options.searchTerm;
        }
        if (options?.vmrsCode) {
            params.VMRSCode = options.vmrsCode;
        }
        
        // Include additional data
        if (options?.include) {
            params.Include = options.include;
        }
        if (options?.partTerminologyIDs) {
            params.PartTerminologyIDs = options.partTerminologyIDs;
        }
        
        // Vehicle attribute IDs
        if (options?.countryId) params.CO = options.countryId;
        if (options?.engineId) params.EN = options.engineId;
        if (options?.submodelId) params.SM = options.submodelId;
        if (options?.transmissionId) params.TR = options.transmissionId;
        if (options?.driveTypeId) params.DT = options.driveTypeId;
        if (options?.bodyStyleId) params.BS = options.bodyStyleId;
        if (options?.bedTypeId) params.BD = options.bedTypeId;
        if (options?.brakeTypeId) params.BR = options.brakeTypeId;
        if (options?.axleTypeId) params.AX = options.axleTypeId;
        if (options?.cabTypeId) params.CB = options.cabTypeId;
        if (options?.springId) params.SP = options.springId;
        if (options?.steeringId) params.ST = options.steeringId;
        if (options?.wheelBaseId) params.WB = options.wheelBaseId;
        if (options?.manufactureBodyCodeId) params.MB = options.manufactureBodyCodeId;
        
        const cacheKey = MotorDaasCache.generateKey(endpoint, params);

        const cached = this.cache.get<WorkTimeResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        // Make request - API returns { Body: { Applications: [] }, Header: { PagingInfo: {} } }
        const response = await this.makeRequest<{
            Body?: {
                Applications?: any[];
            };
            Header?: {
                PagingInfo?: {
                    TotalItemCount?: number;
                };
            };
            Applications?: any[]; // Direct response format
        }>(endpoint, 'GET', params);

        // Parse response - makeRequest already unwraps Body if present
        const applications = Array.isArray(response?.Applications) 
            ? response.Applications 
            : (response?.Body?.Applications || []);
        
        const totalCount = response?.Header?.PagingInfo?.TotalItemCount 
            || applications.length;

        // Map to WorkTimeResponse format
        const workTimeResponse: WorkTimeResponse = {
            baseVehicleId,
            applications: applications.map((app: any) => ({
                Category: app.Category || { ID: 0 },
                IsMatch: app.IsMatch !== undefined ? app.IsMatch : false,
                Items: app.Items || [],
                OptionalWorkTimes: app.OptionalWorkTimes || [],
                AdditionalWorkTimes: app.AdditionalWorkTimes || [],
                ApplicationID: app.ApplicationID || 0,
                AttributeMappings: app.AttributeMappings || [],
                ContentSilos: app.ContentSilos || [],
                DisplayName: app.DisplayName || '',
                IsActive: app.IsActive !== undefined ? app.IsActive : true,
                Links: app.Links || [],
                Qualifiers: app.Qualifiers || [],
                Position: app.Position,
                Taxonomy: app.Taxonomy,
                Vehicle: app.Vehicle,
                AppRelationType: app.AppRelationType
            })),
            totalCount
        };

        // Cache for 12 hours
        this.cache.set(cacheKey, workTimeResponse, 43200);

        return workTimeResponse;
    }

    /**
     * Get technical service bulletins for a vehicle
     */
    async getTechnicalServiceBulletins(
        baseVehicleId: number,
        system?: string
    ): Promise<TSBResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/TechnicalServiceBulletins`;
        const params = system ? { system } : undefined;
        const cacheKey = MotorDaasCache.generateKey(endpoint, params);

        const cached = this.cache.get<TSBResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<TSBResponse>(endpoint, 'GET', params);

        // Cache for 6 hours (TSBs updated periodically)
        this.cache.set(cacheKey, response, 21600);

        return response;
    }

    /**
     * Get wiring diagrams for a vehicle
     */
    async getWiringDiagrams(
        baseVehicleId: number,
        options?: {
            saeSystemId?: number;
            saeSubjectId?: number;
            oemComponentId?: number;
            searchTerm?: string;
        }
    ): Promise<WiringDiagramResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/WiringDiagrams`;
        const params = {
            ContentSilos: 56, // Wiring Diagrams silo
            ...options
        };
        const cacheKey = MotorDaasCache.generateKey(endpoint, params);

        const cached = this.cache.get<WiringDiagramResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<WiringDiagramResponse>(endpoint, 'GET', params);

        // Cache for 24 hours (wiring diagrams don't change)
        this.cache.set(cacheKey, response, 86400);

        return response;
    }

    /**
     * Get bulk vehicle attributes for multiple vehicles at once
     */
    async getBulkVehicleAttributes(
        baseVehicleIds: number[],
        attributeStandard: 'MOTOR' | 'VCDB' = 'MOTOR'
    ): Promise<BulkVehicleAttributesResponse> {
        const endpoint = '/Information/Vehicles/Search/BulkVehicleAttributes';
        const cacheKey = MotorDaasCache.generateKey(endpoint, { baseVehicleIds, attributeStandard });

        const cached = this.cache.get<BulkVehicleAttributesResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<BulkVehicleAttributesResponse>(
            endpoint,
            'POST',
            undefined,
            {
                BaseVehicleIDs: baseVehicleIds,
                AttributeStandard: attributeStandard
            }
        );

        // Cache for 24 hours (attributes rarely change)
        this.cache.set(cacheKey, response, 86400);

        return response;
    }

    /**
     * Get recommended fluids for a vehicle
     * Based on MOTOR API: /Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Summaries/Of/RecommendedFluids
     */
    async getRecommendedFluids(
        baseVehicleId: number,
        engineId?: number,
        submodelId?: number,
        options?: {
            contentSilos?: number[]; // e.g., [117] for Custom Fluid Recommendations
            include?: string[]; // e.g., ['Image']
            transmissionId?: number; // TR
            driveTypeId?: number; // DT
            bodyStyleId?: number; // BS
            bedTypeId?: number; // BD
            brakeTypeId?: number; // BR
            countryId?: number; // CO
        }
    ): Promise<RecommendedFluidsResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/RecommendedFluids`;
        
        const queryParams: Record<string, unknown> = {
            AttributeStandard: 'MOTOR'
        };
        
        if (engineId) queryParams.EN = engineId;
        if (submodelId) queryParams.SM = submodelId;
        
        // Add optional parameters
        if (options?.contentSilos) queryParams.ContentSilos = options.contentSilos;
        if (options?.include) queryParams.Include = options.include;
        if (options?.transmissionId) queryParams.TR = options.transmissionId;
        if (options?.driveTypeId) queryParams.DT = options.driveTypeId;
        if (options?.bodyStyleId) queryParams.BS = options.bodyStyleId;
        if (options?.bedTypeId) queryParams.BD = options.bedTypeId;
        if (options?.brakeTypeId) queryParams.BR = options.brakeTypeId;
        if (options?.countryId) queryParams.CO = options.countryId;

        const cacheKey = MotorDaasCache.generateKey(endpoint, queryParams);
        const cached = this.cache.get<RecommendedFluidsResponse>(cacheKey);
        if (cached) return cached;

        // Note: makeRequest already handles authentication and unwraps Body if it exists

        const response = await this.makeRequest<{
            Body?: {
                Applications: any[];
                Attributes: any;
            };
            Header?: any;
            // Direct response format (without Body wrapper)
            Applications?: any[];
            Attributes?: any;
        }>(endpoint, 'GET', queryParams);

        // makeRequest already unwraps Body if it exists (returns data.Body at line 499)
        // So response is already the Body object: { Applications: [], Attributes: {} }
        // We just need to access response.Applications directly
        const applications = Array.isArray(response?.Applications) ? response.Applications : [];
        
        if (process.env.NODE_ENV === 'development') {
            console.log('[MOTOR DaaS] Recommended Fluids Response (Body unwrapped by makeRequest):');
            console.log(JSON.stringify(response, null, 2));
            
            if (applications.length === 0) {
                console.log(`[MOTOR DaaS] No fluid applications found for BaseVehicleID ${baseVehicleId}${engineId ? `, EngineID ${engineId}` : ''}${submodelId ? `, SubmodelID ${submodelId}` : ''}`);
                console.log('[MOTOR DaaS] Expected Application Structure (when data is available):');
                console.log(JSON.stringify({
                    Attributes: {
                        // Attributes object with fluid specifications (Specification, Capacity, etc.)
                    },
                    DisplayName: "string - Fluid display name",
                    IsActive: true,
                    Links: [
                        {
                            Href: "string - URI to additional information",
                            Rel: "string - Link type",
                            Count: 0
                        }
                    ],
                    Position: {
                        Name: "string - Position literal name",
                        PCDBPositionID: 0,
                        PositionID: 0,
                        Type: "MOTOR_Position"
                    },
                    Qualifiers: [
                        {
                            Description: "string - Qualifier description",
                            Family: "string - Qualifier family",
                            IsActive: true,
                            QualifierID: 0,
                            Sequence: 0,
                            Type: "string - Qualifier type"
                        }
                    ],
                    Taxonomy: {
                        Action: "string",
                        CommonName: "string - Common fluid name (e.g., 'Engine Oil')",
                        GroupID: 0,
                        GroupName: "string",
                        InfoObject: {
                            Description: "string",
                            InfoObjectID: 0
                        },
                        LiteralName: "string - Literal fluid name",
                        SubGroupID: 0,
                        SubGroupName: "string",
                        SystemID: 0,
                        SystemName: "string",
                        TaxonomyID: 0,
                        ReplacementTaxonomy: {}
                    }
                }, null, 2));
            } else {
                console.log(`[MOTOR DaaS] Found ${applications.length} fluid applications`);
                console.log('[MOTOR DaaS] Sample Application Structure (from actual response):');
                console.log(JSON.stringify(applications[0], null, 2));
            }
        }

        const fluidsResponse: RecommendedFluidsResponse = {
            baseVehicleId,
            engineId,
            submodelId,
            applications: applications.map((app: any) => ({
                positionId: app.Position?.PositionID,
                positionDescription: app.Position?.Name || app.Position?.Description || app.Position?.Type,
                positionPCDBId: app.Position?.PCDBPositionID,
                positionType: app.Position?.Type,
                fluidType: app.Taxonomy?.CommonName || app.Taxonomy?.LiteralName || app.DisplayName || 'Unknown Fluid',
                displayName: app.DisplayName,
                isActive: app.IsActive,
                // Attributes can contain various fields like Specification, Capacity, etc.
                attributes: app.Attributes || {},
                specification: app.Attributes?.Specification,
                capacity: app.Attributes?.Capacity,
                links: app.Links?.map((link: any) => ({
                    href: link.Href,
                    rel: link.Rel,
                    count: link.Count
                })) || [],
                qualifiers: app.Qualifiers?.map((q: any) => ({
                    qualifierId: q.QualifierID,
                    description: q.Description,
                    family: q.Family,
                    type: q.Type,
                    isActive: q.IsActive,
                    sequence: q.Sequence
                })) || [],
                taxonomy: {
                    action: app.Taxonomy?.Action,
                    commonName: app.Taxonomy?.CommonName,
                    literalName: app.Taxonomy?.LiteralName,
                    systemName: app.Taxonomy?.SystemName,
                    groupName: app.Taxonomy?.GroupName,
                    groupId: app.Taxonomy?.GroupID,
                    subGroupName: app.Taxonomy?.SubGroupName,
                    subGroupId: app.Taxonomy?.SubGroupID,
                    systemId: app.Taxonomy?.SystemID,
                    taxonomyId: app.Taxonomy?.TaxonomyID,
                    infoObject: app.Taxonomy?.InfoObject ? {
                        description: app.Taxonomy.InfoObject.Description,
                        infoObjectId: app.Taxonomy.InfoObject.InfoObjectID
                    } : undefined,
                    replacementTaxonomy: app.Taxonomy?.ReplacementTaxonomy
                }
            })),
            totalCount: applications.length
        };

        // Cache for 24 hours
        this.cache.set(cacheKey, fluidsResponse, 86400);
        return fluidsResponse;
    }

    /**
     * Make authenticated request to MOTOR DaaS API
     */
    private async makeRequest<T>(
        relativePath: string,
        method: string = 'GET',
        queryParams?: Record<string, unknown>,
        bodyData?: unknown
    ): Promise<T> {
        // Check rate limit
        if (!this.rateLimiter.canMakeRequest()) {
            const rateLimitInfo = this.rateLimiter.getRateLimitInfo();
            const waitSeconds = Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000);
            throw this.createError(
                `Rate limit exceeded. Please wait ${waitSeconds} seconds.`,
                429,
                'RATE_LIMIT_EXCEEDED'
            );
        }

        try {
            // Build authenticated URL
            // MOTOR API requires /v1/ prefix in the relative path for signing
            // Ensure path starts with / and doesn't duplicate /v1/
            let fullPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
            
            // Extract base URL pathname to check if /v1 is already included
            const baseUrlObj = new URL(this.baseUrl);
            const baseUrlPath = baseUrlObj.pathname;
            
            // For signing, we need the full path including /v1/
            // The signing path should be: /v1/Information/...
            const signingPath = baseUrlPath.endsWith('/v1') || baseUrlPath.endsWith('/v1/') 
                ? `${baseUrlPath.replace(/\/$/, '')}${fullPath}`
                : `/v1${fullPath}`;
            
            // Build query parameters separately (don't add to fullPath yet)
            // buildAuthenticatedUrl will handle adding them in the correct order
            let queryString = '';
            if (queryParams) {
                const params = new URLSearchParams();
                Object.entries(queryParams).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, String(v)));
                    } else {
                        params.append(key, String(value));
                    }
                });
                queryString = params.toString();
            }

            // Use signingPath for authentication, fullPath (without query) + queryString for actual URL
            // buildAuthenticatedUrl will add query params and auth params in correct order
            const url = this.auth.buildAuthenticatedUrl(
                this.baseUrl, 
                queryString ? `${fullPath}?${queryString}` : fullPath, 
                method, 
                signingPath
            );

            // Log URL in development for debugging
            if (process.env.NODE_ENV === 'development') {
                console.log(`[MOTOR DaaS] ${method} ${fullPath}`);
                console.log(`[MOTOR DaaS] Full URL: ${url.replace(/Sig=[^&]+/, 'Sig=***')}`); // Hide signature
            }

            // Record request for rate limiting
            this.rateLimiter.recordRequest();

            // Build request options
            const options: RequestInit = {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            // Add body for POST/PUT requests
            if (bodyData && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(bodyData);
            }

            // Make request
            const response = await fetch(url, options);

            if (!response.ok) {
                throw await this.handleErrorResponse(response);
            }

            const data = await response.json();

            // MOTOR API wraps responses in a standard format
            // Check if it's a wrapped response
            if (data.Header && data.Body !== undefined) {
                // Check for API-level errors in messages
                if (data.Header.Messages && data.Header.Messages.length > 0) {
                    const errors = data.Header.Messages.filter((m: { Type: string }) => m.Type === 'Error');
                    if (errors.length > 0) {
                        throw this.createError(
                            errors[0].LongDescription || errors[0].ShortDescription,
                            data.Header.StatusCode,
                            errors[0].Code
                        );
                    }
                }
                return data.Body as T;
            }

            return data as T;

        } catch (error) {
            if (error instanceof Error && 'statusCode' in error) {
                throw error;
            }

            throw this.createError(
                error instanceof Error ? error.message : 'Unknown error occurred',
                500,
                'REQUEST_FAILED'
            );
        }
    }

    /**
     * Handle error responses from API
     */
    private async handleErrorResponse(response: Response): Promise<MotorDaasError> {
        let errorMessage = `MOTOR DaaS API error: ${response.status} ${response.statusText}`;
        let errorCode = 'API_ERROR';

        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
            if (errorData.code) {
                errorCode = errorData.code;
            }
        } catch {
            // If error response is not JSON, use default message
        }

        // Provide user-friendly messages
        if (response.status === 401) {
            errorMessage = 'Authentication failed. Please check your MOTOR DaaS credentials.';
            errorCode = 'AUTH_FAILED';
        } else if (response.status === 403) {
            errorMessage = 'Access denied. Your account may not have permission for this resource.';
            errorCode = 'ACCESS_DENIED';
        } else if (response.status === 404) {
            errorMessage = 'Resource not found. The requested vehicle or data may not be available.';
            errorCode = 'NOT_FOUND';
        } else if (response.status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
            errorCode = 'RATE_LIMIT_EXCEEDED';
        } else if (response.status >= 500) {
            errorMessage = 'MOTOR DaaS service is temporarily unavailable. Please try again later.';
            errorCode = 'SERVICE_UNAVAILABLE';
        }

        return this.createError(errorMessage, response.status, errorCode);
    }

    /**
     * Create standardized error object
     */
    private createError(
        message: string,
        statusCode?: number,
        errorCode?: string
    ): MotorDaasError {
        const error = new Error(message) as Error & MotorDaasError;
        error.message = message;
        error.statusCode = statusCode;
        error.errorCode = errorCode;
        return error;
    }

    /**
     * Get rate limit information
     */
    getRateLimitInfo() {
        return this.rateLimiter.getRateLimitInfo();
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
}