// src/lib/integrations/motor-daas/client.ts

import { MotorDaasAuth, MotorAuthConfig } from './auth'
import { buildAuthQueryString, buildMotorUrl, buildStandardQueryParams } from './client.utils'
import { MOTOR_API_DEFAULTS } from './constants'

export interface MotorApiResponse<T> {
    Body?: T;
    Header?: {
        StatusCode?: number;
        Messages?: Array<{ Type: string; Code?: string; ShortDescription?: string; LongDescription?: string }>;
        Status?: string;
    };
}

// Content type for MOTOR DaaS API
export type ContentType = 'WiringDiagrams' | 'ServiceProcedures' | 'OEMComponents' | string;

// Response types for new methods
export interface WiringDiagramsTaxonomyWithRelationResponse {
    Subjects: Array<{ ID: number; Name: string }>;
}

export interface OEMComponent {
    ComponentID?: number;
    DisplayName?: string;
    Description?: string;
    PartNumber?: string;
    PartNumbers?: Array<{ PartNumber: string; Description?: string }>;
    Links?: Array<{ Href: string; Rel: string }>;
}

export interface OEMComponentsSummaryResponse {
    Applications: Array<OEMComponent & {
        ApplicationID: number;
        ContentSilos?: Array<{ ID: number; Name: string }>;
    }>;
}

export interface OEMComponentsSummaryWithRelationResponse {
    Applications: Array<OEMComponent & {
        ApplicationID: number;
        ContentSilos?: Array<{ ID: number; Name: string }>;
    }>;
}

export interface WiringDiagramsSummaryWithRelationResponse {
    Applications: Array<{
        ApplicationID: number;
        DisplayName: string;
        ContentSilos?: Array<{ ID: number; Name: string }>;
        Links?: Array<{ Href: string; Rel: string }>;
    }>;
}

export interface OEMComponentDetail {
    ComponentID?: number;
    DisplayName?: string;
    Description?: string;
    PartNumber?: string;
    PartNumbers?: Array<{ PartNumber: string; Description?: string }>;
    Location?: string;
    ConnectorID?: number;
    PinNumber?: string;
    WireColor?: string;
    WireGauge?: string;
    Notes?: string;
}

export interface OEMComponentsDetailListResponse {
    Components: Array<OEMComponentDetail>;
}

export class MotorDaasClient {
    private auth: MotorDaasAuth;
    private baseUrl: string;

    constructor(config: MotorAuthConfig) {
        this.auth = new MotorDaasAuth(config);
        this.baseUrl = config.baseUrl || 'https://api.motor.com/v1';
    }

    /**
     * Simple HelloWorld test
     * Endpoint: /v1/HelloWorld
     */
    async helloWorld(correlationId?: string): Promise<{ Text: string }> {
        const uriPath = '/v1/HelloWorld'
        const url = buildMotorUrl(this.baseUrl, '/HelloWorld')

        // Build authenticated query string
        const authParams = this.auth.buildAuthQueryParams('GET', uriPath)
        url.search = buildAuthQueryString(authParams, undefined, correlationId)

        const headers: HeadersInit = {
            'Accept': 'application/json'
        };

        // Add correlation ID header if provided
        if (correlationId) {
            headers['X-CorrelationID'] = correlationId;
        }

        const finalUrl = url.toString();
        // console.log('[MOTOR DaaS] HelloWorld request:', {
        //     url: finalUrl,
        //     uriPath,
        //     method: 'GET',
        //     hasAuthParams: !!authParams.ApiKey
        // });

        const response = await fetch(finalUrl, {
            method: 'GET',
            headers
        });

        console.log('[MOTOR DaaS] HelloWorld response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (!response.ok) {
            await this.handleError(response);
        }

        const data: MotorApiResponse<{ Text: string }> = await response.json();
        // console.log('[MOTOR DaaS] HelloWorld success:', data);

        // Extract Body if wrapped
        return data.Body || data as any;
    }

    /**
     * Make authenticated request with query string auth
     */
    async request<T>(
        endpoint: string,
        method: string = 'GET',
        queryParams?: Record<string, string>,
        correlationId?: string
    ): Promise<T> {
        // Ensure endpoint starts with /v1
        const uriPath = endpoint.startsWith('/v1') ? endpoint : `/v1${endpoint}`
        const url = buildMotorUrl(this.baseUrl, endpoint)

        // Build authenticated query string with additional params
        const authParams = this.auth.buildAuthQueryParams(method, uriPath)
        url.search = buildAuthQueryString(authParams, queryParams, correlationId)

        const headers: HeadersInit = {
            'Accept': 'application/json'
        };

        if (correlationId) {
            headers['X-CorrelationID'] = correlationId;
        }

        const response = await fetch(url.toString(), {
            method,
            headers
        });

        if (!response.ok) {
            await this.handleError(response);
        }

        const data: MotorApiResponse<T> = await response.json();
        return (data.Body !== undefined ? data.Body : data) as T;
    }

    /**
     * Get wiring diagrams taxonomy (subjects/categories)
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Taxonomies/Of/WiringDiagrams
     */
    async getWiringDiagramsTaxonomy(
        baseVehicleId: number,
        options?: {
            engineId?: number
            resultType?: 'DrillDown' | 'List'
        }
    ): Promise<{ Subjects: Array<{ ID: number; Name: string }> }> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Taxonomies/Of/WiringDiagrams`

        const queryParams = buildStandardQueryParams({
            contentSilos: MOTOR_API_DEFAULTS.WIRING_DIAGRAMS_CONTENT_SILO,
            resultType: options?.resultType || MOTOR_API_DEFAULTS.DEFAULT_RESULT_TYPE,
            attributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
            engineId: options?.engineId,
        })

        return this.request<{ Subjects: Array<{ ID: number; Name: string }> }>(endpoint, 'GET', queryParams)
    }

    /**
     * Get wiring diagrams summary (list of diagrams)
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Summaries/Of/WiringDiagrams
     */
    async getWiringDiagramsSummary(
        baseVehicleId: number,
        options?: {
            subjectId?: number
            searchTerm?: string
            engineId?: number
            pageIndex?: number
            itemsPerPage?: number
        }
    ): Promise<{
        Applications: Array<{
            ApplicationID: number
            DisplayName: string
            Item?: {
                DocumentCount?: number
            }
            SAESubjects?: Array<{
                ID: number
                Name: string
                Systems?: Array<{
                    ID: number
                    Name: string
                    IsActive?: boolean
                }>
            }>
            ContentSilos?: Array<{ ID: number; Name: string }>
            Links?: Array<{ Href: string; Rel: string }>
        }>
    }> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/WiringDiagrams`

        const queryParams = buildStandardQueryParams({
            contentSilos: MOTOR_API_DEFAULTS.WIRING_DIAGRAMS_CONTENT_SILO,
            attributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
            subjectId: options?.subjectId,
            searchTerm: options?.searchTerm,
            engineId: options?.engineId,
            pageIndex: options?.pageIndex,
            itemsPerPage: options?.itemsPerPage,
        })

        return this.request<{
            Applications: Array<{
                ApplicationID: number
                DisplayName: string
                Item?: {
                    DocumentCount?: number
                }
                SAESubjects?: Array<{
                    ID: number
                    Name: string
                    Systems?: Array<{
                        ID: number
                        Name: string
                        IsActive?: boolean
                    }>
                }>
                ContentSilos?: Array<{ ID: number; Name: string }>
                Links?: Array<{ Href: string; Rel: string }>
            }>
        }>(endpoint, 'GET', queryParams)
    }

    /**
     * Get wiring diagram details
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Details/Of/WiringDiagrams/{ApplicationID}
     */
    async getWiringDiagramDetails(
        baseVehicleId: number,
        applicationId: number,
        engineId?: number
    ): Promise<{
        ApplicationID?: number;
        DisplayName?: string;
        Description?: string;
        Documents?: Array<{
            DocumentID: number;
            DocumentType?: string;
            Links?: Array<{ Href: string; Rel: string }>;
        }>;
        Applications?: Array<{
            ApplicationID?: number;
            DisplayName?: string;
            Documents?: Array<{
                DocumentID: number;
                DocumentType?: string;
                Links?: Array<{ Href: string; Rel: string }>;
            }>;
            Item?: {
                DocumentCount?: number;
            };
            Links?: Array<{ Href: string; Rel: string }>;
        }>;
        Components?: Array<any>;
        Connectors?: Array<any>;
    }> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Details/Of/WiringDiagrams/${applicationId}`

        const queryParams = buildStandardQueryParams({
            attributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
            engineId,
        })

        return this.request<{
            ApplicationID?: number;
            DisplayName?: string;
            Description?: string;
            Documents?: Array<{
                DocumentID: number;
                DocumentType?: string;
                Links?: Array<{ Href: string; Rel: string }>;
            }>;
            Applications?: Array<{
                ApplicationID?: number;
                DisplayName?: string;
                Documents?: Array<{
                    DocumentID: number;
                    DocumentType?: string;
                    Links?: Array<{ Href: string; Rel: string }>;
                }>;
                Item?: {
                    DocumentCount?: number;
                };
                Links?: Array<{ Href: string; Rel: string }>;
            }>;
            Components?: Array<any>;
            Connectors?: Array<any>;
        }>(endpoint, 'GET', queryParams);
    }

    /**
     * Get wiring diagram document (image/PDF)
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Documents/Of/WiringDiagrams/{DocumentID}
     * Returns binary data (Blob)
     */
    async getWiringDiagramDocument(
        baseVehicleId: number,
        documentId: number
    ): Promise<{ blob: Blob; contentType: string }> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Documents/Of/WiringDiagrams/${documentId}`
        const uriPath = `/v1${endpoint}`
        const url = buildMotorUrl(this.baseUrl, endpoint)

        // Build authenticated query string with AttributeStandard
        const authParams = this.auth.buildAuthQueryParams('GET', uriPath)
        url.search = buildAuthQueryString(authParams, {
            AttributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
        })

        const headers: HeadersInit = {
            'Accept': '*/*' // Accept any content type for binary data
        };

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            await this.handleError(response);
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const blob = await response.blob();

        return { blob, contentType };
    }

    /**
     * Get wiring diagrams taxonomy with relation
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Taxonomies/Of/WiringDiagrams/RelatedTo/{ContentType}/{ApplicationID}
     */
    async getWiringDiagramsTaxonomyWithRelation(
        baseVehicleId: number,
        contentType: ContentType,
        applicationId: number,
        options?: {
            engineId?: number
            resultType?: 'DrillDown' | 'List'
        }
    ): Promise<WiringDiagramsTaxonomyWithRelationResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Taxonomies/Of/WiringDiagrams/RelatedTo/${contentType}/${applicationId}`

        const queryParams = buildStandardQueryParams({
            contentSilos: MOTOR_API_DEFAULTS.WIRING_DIAGRAMS_CONTENT_SILO,
            resultType: options?.resultType || MOTOR_API_DEFAULTS.DEFAULT_RESULT_TYPE,
            attributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
            engineId: options?.engineId,
        })

        return this.request<WiringDiagramsTaxonomyWithRelationResponse>(endpoint, 'GET', queryParams)
    }

    /**
     * Get OEM components summary
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Summaries/Of/OEMComponents
     */
    async getOEMComponentsSummary(
        baseVehicleId: number,
        options?: {
            engineId?: number
            pageIndex?: number
            itemsPerPage?: number
            searchTerm?: string
        }
    ): Promise<OEMComponentsSummaryResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/OEMComponents`

        const queryParams = buildStandardQueryParams({
            attributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
            engineId: options?.engineId,
            pageIndex: options?.pageIndex,
            itemsPerPage: options?.itemsPerPage,
            searchTerm: options?.searchTerm,
        })

        return this.request<OEMComponentsSummaryResponse>(endpoint, 'GET', queryParams)
    }

    /**
     * Get OEM components summary with relation
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Summaries/Of/OEMComponents/RelatedTo/{ContentType}/{ApplicationID}
     */
    async getOEMComponentsSummaryWithRelation(
        baseVehicleId: number,
        contentType: ContentType,
        applicationId: number,
        options?: {
            engineId?: number
            pageIndex?: number
            itemsPerPage?: number
        }
    ): Promise<OEMComponentsSummaryWithRelationResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/OEMComponents/RelatedTo/${contentType}/${applicationId}`

        const queryParams = buildStandardQueryParams({
            attributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
            engineId: options?.engineId,
            pageIndex: options?.pageIndex,
            itemsPerPage: options?.itemsPerPage,
        })

        return this.request<OEMComponentsSummaryWithRelationResponse>(endpoint, 'GET', queryParams)
    }

    /**
     * Get wiring diagrams summary with relation
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Summaries/Of/WiringDiagrams/RelatedTo/{ContentType}/{ApplicationID}
     */
    async getWiringDiagramsSummaryWithRelation(
        baseVehicleId: number,
        contentType: ContentType,
        applicationId: number,
        options?: {
            engineId?: number
            pageIndex?: number
            itemsPerPage?: number
        }
    ): Promise<WiringDiagramsSummaryWithRelationResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/WiringDiagrams/RelatedTo/${contentType}/${applicationId}`

        const queryParams = buildStandardQueryParams({
            contentSilos: MOTOR_API_DEFAULTS.WIRING_DIAGRAMS_CONTENT_SILO,
            attributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
            engineId: options?.engineId,
            pageIndex: options?.pageIndex,
            itemsPerPage: options?.itemsPerPage,
        })

        return this.request<WiringDiagramsSummaryWithRelationResponse>(endpoint, 'GET', queryParams)
    }

    /**
     * Get OEM components detail list by application and document
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Details/Of/{ContentType}/{ApplicationID}/Documents/{DocumentID}/OEMComponents
     */
    async getOEMComponentsDetailListByApplicationAndDocument(
        baseVehicleId: number,
        contentType: ContentType,
        applicationId: number,
        documentId: number
    ): Promise<OEMComponentsDetailListResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Details/Of/${contentType}/${applicationId}/Documents/${documentId}/OEMComponents`

        const queryParams = buildStandardQueryParams({
            attributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
        })

        return this.request<OEMComponentsDetailListResponse>(endpoint, 'GET', queryParams)
    }

    private async handleError(response: Response): Promise<never> {
        let errorMessage = `MOTOR API error: ${response.status}`;
        let errorCode = 'API_ERROR';

        try {
            const errorText = await response.text();
            console.error('[MOTOR DaaS] Error response body:', errorText);

            const errorData: MotorApiResponse<unknown> = JSON.parse(errorText);

            if (errorData.Header?.Messages) {
                const errors = errorData.Header.Messages.filter(m => m.Type === 'Error');
                if (errors.length > 0) {
                    errorMessage = errors[0].LongDescription || errors[0].ShortDescription || errorMessage;
                    errorCode = errors[0].Code || errorCode;
                }
            }
        } catch (parseError) {
            console.error('[MOTOR DaaS] Failed to parse error response:', parseError);
            // Not JSON, use default
        }

        // User-friendly error messages
        if (response.status === 401) {
            errorMessage = 'Authentication failed. Check your MOTOR DaaS credentials and signature.';
            errorCode = 'AUTH_FAILED';
        } else if (response.status === 429) {
            errorMessage = 'Rate limit exceeded. 1500 requests per 15 minutes allowed.';
            errorCode = 'RATE_LIMIT_EXCEEDED';
        } else if (response.status === 403) {
            errorMessage = 'Access forbidden. Check timestamp is within 15 minutes.';
            errorCode = 'FORBIDDEN';
        }

        const error = new Error(errorMessage) as Error & { statusCode: number; errorCode: string };
        error.statusCode = response.status;
        error.errorCode = errorCode;
        throw error;
    }
}
