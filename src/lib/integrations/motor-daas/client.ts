// src/lib/integrations/motor-daas/client.ts

import { MotorDaasAuth, MotorAuthConfig } from './auth'
import { buildAuthQueryString, buildMotorUrl, buildStandardQueryParams } from './client.utils'
import { MOTOR_API_DEFAULTS } from './constants/constants'

export interface YearResponse {
    Year: number;
    Links?: Array<{ Href: string; Rel: string; Count?: number }>
}

export interface MakeResponse {
    MakeID: number;
    MakeName: string;
    Links?: Array<{ Href: string; Rel: string; Count?: number }>;
}

export interface ModelResponse {
    ModelID: number;
    ModelName: string;
    Type ?: {
        Type: string;
        VehicleTypeID: number;
    };
    SubModels ?: Array<{
        SubModelID: number;
        SubModelName: string;
    }>;
    Countries ?: Array<{
        Code: string;
        CountryID: number;
        Name: string;
    }>;
    BaseVehicles ?: Array<{
        BaseVehicleID: number;
        BaseVehicleName?: string;
    }>;
    Links ?: Array<{ Href: string; Rel: string; Count?: number }>;
}

export interface EngineResponse {
    Aspiration: string;
    BlockType: string;
    CID: string;
    CylinderCC: string;
    CylinderHeadType: string;
    CylinderLiter: string;
    Cylinders: string;
    Description: string;
    Designation: string;
    EngineBoreInch: string;
    EngineBoreMetric: string;
    EngineID: number;
    FuelDeliveryInfo?: {
        ControlType: string;
        FuelDeliveryID: number;
        SubType: string;
        SystemDesign: string;
        Type: string;
    };
    FuelType: string;
    HorsePower: string;
    IgnitionSystem: string;
    KilowattPower: string;
    Manufacturer: string;
    ManufacturerType: string;
    Valves: string;
    Version: string;
}

export interface MotorApiResponse<T> {
    Body?: T;
    Header?: {
        Date?: string;
        Messages?: Array<{ Code: string; LongDescription: string; ShortDescription: string; Type: string }>;
        IdentifierType?: string;
        Identifier?: string;
        Package?: string;
        Status?: string;
        StatusCode?: number;
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

// Service Procedures types
export interface ServiceProcedureCategory {
    Article: string;
    ID: number;
    Product?: string;
    ProductType?: string;
}

export interface ServiceProcedureItem {
    ProcedureID: number;
}

export interface ServiceProcedureApplication {
    ApplicationID: number;
    DisplayName?: string;
    SortOrderSequence?: number;
    Category?: ServiceProcedureCategory;
    Item?: ServiceProcedureItem;
    Position?: {
        Name: string;
        PositionID: number;
        PCDBPositionID?: number;
        Type?: string;
    };
    Taxonomy?: {
        Action?: string;
        CommonName?: string;
        GroupID?: number;
        GroupName?: string;
        LiteralName?: string;
        SubGroupID?: number;
        SubGroupName?: string;
        SystemID?: number;
        SystemName?: string;
        TaxonomyID?: number;
    };
    ContentSilos?: Array<{ ID: number; Name: string }>;
    IsActive?: boolean;
    Links?: Array<{ Href: string; Rel: string; Count?: number }>;
}

export interface ServiceProceduresSummaryResponse {
    Applications: Array<ServiceProcedureApplication>;
}

export interface ServiceProcedureDocument {
    DocumentID: number;
    Name?: string;
    Caption?: string;
    Format?: string;
    Type?: string;
    Sequence?: number;
    IsActive?: boolean;
    IsGenericImage?: boolean;
    AnchorDocumentID?: number;
    Notes?: Array<{ NoteID: number; Text: string }>;
    Links?: Array<{ Href: string; Rel: string; Count?: number }>;
}

export interface ServiceProcedureDetailItem {
    ProcedureID?: number;
    Sequence?: number;
    Schema?: string;
    Data?: string; // HTML/text content of the procedure
    IsActive?: boolean;
    ReferenceSet?: {
        Documents?: Array<ServiceProcedureDocument>;
    };
}

export interface ServiceProcedureDetail {
    ApplicationID: number;
    Category?: ServiceProcedureCategory;
    Position?: {
        Name: string;
        PositionID: number;
    };
    ContentSilos?: Array<{ ID: number; Name: string }>;
    IsActive?: boolean;
    Items?: Array<ServiceProcedureDetailItem>;
    Links?: Array<{ Href: string; Rel: string; Count?: number }>;
}

export interface ServiceProcedureDetailsResponse {
    ServiceProcedures: Array<ServiceProcedureDetail>;
}

export class MotorDaasClient {
    private auth: MotorDaasAuth;
    private baseUrl: string;

    constructor(config: MotorAuthConfig) {
        this.auth = new MotorDaasAuth(config);
        this.baseUrl = config.baseUrl || 'https://api.motor.com/v1';
    }

    /**
     * Get available years
     * Endpoint: /v1/Information/YMME/Years
     * @param options - Query parameters
     * @returns Array of YearResponse objects
     */
    async getYears(options?: {
        min?: number;
        max?: number;
        vehicleTypes?: number[];
        withRel?: string[];
        attributeStandard?: "MOTOR"; // default
    }): Promise<YearResponse[]> {
        const endpoint = 'Information/YMME/Years';
    
        const queryParams: Record<string, string> = {
            AttributeStandard: 'MOTOR'
        };
        
        if (options?.min) {
            queryParams.Min = options.min.toString();
        }
        if (options?.max) {
            queryParams.Max = options.max.toString();
        }
        if (options?.vehicleTypes && options.vehicleTypes.length > 0) {
            queryParams.VehicleTypes = options.vehicleTypes.join(',');
        }
        if (options?.withRel && options.withRel.length > 0) {
            queryParams.WithRel = options.withRel.join(',');
        }
        
        return this.request<YearResponse[]>(endpoint, 'GET', queryParams);
    }

    /**
     * Get available makes for a specific year
     * Endpoint: /v1/Information/YMME/Years/{Year}/Makes
     * @param year - The year to get makes for
     * @param options - Query parameters
     * @returns Array of MakeResponse objects
     */
    async getMakes(
        year: number,
        options?: {
            vehicleTypes?: number[];
            withRel?: string[];
        }
    ): Promise<MakeResponse[]> {
        const endpoint = `Information/YMME/Years/${year}/Makes`;
    
        const queryParams: Record<string, string> = {
            AttributeStandard: 'MOTOR'
        };
    
        if (options?.vehicleTypes && options.vehicleTypes.length > 0) {
            queryParams.VehicleTypes = options.vehicleTypes.join(',');
        }
        if (options?.withRel && options.withRel.length > 0) {
            queryParams.WithRel = options.withRel.join(',');
        }

        return this.request<MakeResponse[]>(endpoint, 'GET', queryParams);
    }

    /**
     * Get models for a specific year and make
     * Endpoint: /v1/Information/YMME/Years/{Year}/Makes/{MakeID}/Models
     * @param year - The year of the models to get
     * @param makeID - The ID of the make to get models for
     * @param options - Query parameters
     * @returns Array of ModelResponse objects
     */
    async getModels(
        year: number,
        makeID: number,
        options?: {
            vehicleTypes?: number[];
            countryIDs?: number[];
            withRel?: string[];
        }
    ): Promise<ModelResponse[]> {
        const endpoint = `/Information/YMME/Years/${year}/Makes/${makeID}/Models`;
        
        const queryParams: Record<string, string> = {
            AttributeStandard: 'MOTOR'
        };
        
        if (options?.vehicleTypes && options.vehicleTypes.length > 0) {
            queryParams.VehicleTypes = options.vehicleTypes.join(',');
        }
        if (options?.countryIDs && options.countryIDs.length > 0) {
            queryParams.CO = options.countryIDs.join(',');
        }
        if (options?.withRel && options.withRel.length > 0) {
            queryParams.WithRel = options.withRel.join(',');
        }
        
        return this.request<ModelResponse[]>(endpoint, 'GET', queryParams);
    }

    /**
     * Get engines for a specific year, make, and model
     * Endpoint: /v1/Information/YMME/Years/{Year}/Makes/{MakeID}/Models/{ModelID}/Engines
     * @param year - The year of the vehicle
     * @param makeID - The ID of the make
     * @param modelID - The ID of the model
     * @param options - Query parameters
     * @returns Array of EngineResponse objects
     */
    async getEngines(
        year: number,
        makeID: number,
        modelID: number,
        options?: {
            vehicleTypes?: number[];
            countryIDs?: number[];
        }
    ): Promise<EngineResponse[]> {
        const endpoint = `/Information/YMME/Years/${year}/Makes/${makeID}/Models/${modelID}/Engines`;
        
        const queryParams: Record<string, string> = {
            AttributeStandard: 'MOTOR'
        };
        
        if (options?.vehicleTypes && options.vehicleTypes.length > 0) {
            queryParams.VehicleTypes = options.vehicleTypes.join(',');
        }
        if (options?.countryIDs && options.countryIDs.length > 0) {
            queryParams.CO = options.countryIDs.join(',');
        }
        
        return this.request<EngineResponse[]>(endpoint, 'GET', queryParams);
    }

    /**
     * Get base vehicle ID for a YMME selection
     * Endpoint: /v1/Information/YMME/Years/{Year}/Makes/{MakeID}/Models/{ModelID}/BaseVehicle
     * @param year - The year
     * @param makeID - The make ID
     * @param modelID - The model ID
     * @returns Base vehicle information including BaseVehicleID
     */
    async getBaseVehicle(
        year: number,
        makeID: number,
        modelID: number
    ): Promise<{
        BaseVehicleID: number;
        Year: number;
        Make: { MakeID: number; MakeName: string };
        Model: { ModelID: number; ModelName: string };
        Links?: Array<{ Href: string; Rel: string }>;
    }> {
        const endpoint = `/Information/YMME/Years/${year}/Makes/${makeID}/Models/${modelID}/BaseVehicle`;
        
        const queryParams: Record<string, string> = {
            AttributeStandard: 'MOTOR'
        };
        
        return this.request<{
            BaseVehicleID: number;
            Year: number;
            Make: { MakeID: number; MakeName: string };
            Model: { ModelID: number; ModelName: string };
            Links?: Array<{ Href: string; Rel: string }>;
        }>(endpoint, 'GET', queryParams);
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
        // Normalize endpoint: ensure it starts with / but doesn't duplicate /v1
        // baseUrl is already https://api.motor.com/v1
        let endpointPath = endpoint
        if (endpointPath.startsWith('/v1/')) {
            endpointPath = endpointPath.slice(4) // Remove '/v1/'
        } else if (endpointPath.startsWith('/v1')) {
            endpointPath = endpointPath.slice(3) // Remove '/v1'
        }
        if (!endpointPath.startsWith('/')) {
            endpointPath = `/${endpointPath}`
        }
        
        // Build URL (baseUrl already includes /v1)
        const url = buildMotorUrl(this.baseUrl, endpointPath)
        
        // For authentication signature, use the full pathname from the URL
        // This ensures the signature matches the actual request path
        const uriPath = url.pathname

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

        const data = await response.json();
        
        // Handle both response formats:
        // 1. Wrapped: { Body: [...], Header: {...} }
        // 2. Direct array: [...]
        if (data && typeof data === 'object' && 'Body' in data && data.Body !== undefined) {
            return data.Body as T;
        }
        
        // If it's an array directly or the data itself, return it
        return data as T;
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

    /**
     * Get service procedures summary
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Summaries/Of/ServiceProcedures
     */
    async getServiceProceduresSummary(
        baseVehicleId: number,
        options?: {
            contentSilos?: number[]
            engineId?: number
            pageIndex?: number
            itemsPerPage?: number
            searchTerm?: string
        }
    ): Promise<ServiceProceduresSummaryResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/ServiceProcedures`

        const queryParams: Record<string, string> = {
            AttributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
        }

        if (options?.contentSilos && options.contentSilos.length > 0) {
            queryParams.ContentSilos = options.contentSilos.join(',')
        }
        if (options?.engineId) {
            queryParams.EN = options.engineId.toString()
        }
        if (options?.pageIndex !== undefined) {
            queryParams.PageIndex = options.pageIndex.toString()
        }
        if (options?.itemsPerPage !== undefined) {
            queryParams.ItemsPerPage = options.itemsPerPage.toString()
        }
        if (options?.searchTerm) {
            queryParams.SearchTerm = options.searchTerm
        }

        return this.request<ServiceProceduresSummaryResponse>(endpoint, 'GET', queryParams)
    }

    /**
     * Get service procedure details by application ID
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Details/Of/ServiceProcedures/{ApplicationID}
     */
    async getServiceProcedureDetails(
        baseVehicleId: number,
        applicationId: number,
        engineId?: number
    ): Promise<ServiceProcedureDetailsResponse> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Details/Of/ServiceProcedures/${applicationId}`

        const queryParams: Record<string, string> = {
            AttributeStandard: MOTOR_API_DEFAULTS.ATTRIBUTE_STANDARD,
        }

        if (engineId) {
            queryParams.EN = engineId.toString()
        }

        return this.request<ServiceProcedureDetailsResponse>(endpoint, 'GET', queryParams)
    }

    /**
     * Get service procedure document (image)
     * Endpoint: /v1/Information/Vehicles/Attributes/BaseVehicleID/{BaseVehicleID}/Content/Documents/Of/ServiceProcedures/{DocumentID}
     * Returns binary data (Blob)
     */
    async getServiceProcedureDocument(
        baseVehicleId: number,
        documentId: number
    ): Promise<{ blob: Blob; contentType: string }> {
        const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Documents/Of/ServiceProcedures/${documentId}`
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
