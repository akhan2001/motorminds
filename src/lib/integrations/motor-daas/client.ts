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
    MotorDaasError
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

    /**
     * Get diagnostic trouble codes for a vehicle
     * Based on MOTOR API: /Information/Vehicles/Attributes/BaseVehicleID/{ID}/Content/Summaries/Of/DiagnosticTroubleCodes
     */
    async getDiagnosticTroubleCodes(
        baseVehicleId: number,
        dtcCode?: string
    ): Promise<DTCResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/DiagnosticTroubleCodes`;
        
        // MOTOR API requires ContentSilos=15 for Diagnostic Trouble Codes
        // Use SearchTerm parameter for DTC code search (not "code")
        const params: Record<string, string | number> = {
            ContentSilos: 15,
            AttributeStandard: 'MOTOR'
        };
        
        if (dtcCode) {
            params.SearchTerm = dtcCode;
        }
        
        const cacheKey = MotorDaasCache.generateKey(endpoint, params);

        const cached = this.cache.get<DTCResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<DTCResponse>(endpoint, 'GET', params);

        // Cache DTC data for 6 hours
        this.cache.set(cacheKey, response, 21600);

        return response;
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
        operation?: string
    ): Promise<WorkTimeResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/EstimatedWorkTimes`;
        const params = operation ? { operation } : undefined;
        const cacheKey = MotorDaasCache.generateKey(endpoint, params);

        const cached = this.cache.get<WorkTimeResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<WorkTimeResponse>(endpoint, 'GET', params);

        // Cache for 12 hours
        this.cache.set(cacheKey, response, 43200);

        return response;
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
            
            // Add query parameters to the path if present
            if (queryParams) {
                const params = new URLSearchParams();
                Object.entries(queryParams).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, String(v)));
                    } else {
                        params.append(key, String(value));
                    }
                });
                const queryString = params.toString();
                if (queryString) {
                    fullPath = `${fullPath}?${queryString}`;
                }
            }

            // Use signingPath for authentication, fullPath for actual URL
            // buildAuthenticatedUrl will now properly handle baseUrl with pathname
            const url = this.auth.buildAuthenticatedUrl(this.baseUrl, fullPath, method, signingPath);

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