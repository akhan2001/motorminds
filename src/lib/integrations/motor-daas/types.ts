// src/lib/integrations/motor-daas/types.ts

export interface MotorAuthConfig {
    publicKey: string;
    privateKey: string;
    baseUrl: string;
}

export interface MotorRequestParams {
    Scheme: string;
    XDate: string;
    ApiKey: string;
    Sig: string;
}

// Vehicle Info Types
export interface MotorVehicleInfo {
    baseVehicleId: number;
    vin: string;
    year: number;
    make: string;
    model: string;
    subModel?: string;
    engineBase?: string;
    engineVin?: string;
    transmissionBase?: string;
    driveType?: string;
    bodyType?: string;
    fuelType?: string;
    cylinders?: number;
    displacement?: string;
    manufacturerBodyCode?: string;
    region?: string;
}

// DTC Types
export interface DTCCode {
    code: string;
    description: string;
    system?: string;
    possibleCauses?: string[];
    diagnosticProcedures?: string[];
    relatedCodes?: string[];
}

// DTC Application Item
export interface DTCItem {
    Code: string;
    DTCID: number;
}

// DTC Attribute Mapping
export interface DTCAttributeMapping {
    ID: number;
    Type: string;
}

// DTC Content Silo
export interface DTCContentSilo {
    ID: number;
    Name: string;
    SourceSilos?: Array<{
        ID: number;
        Name: string;
    }>;
}

// DTC Link
export interface DTCLink {
    Href: string;
    Rel: string;
}

// DTC Application (from API)
export interface DTCApplication {
    Item: DTCItem;
    ApplicationID: number;
    AttributeMappings?: DTCAttributeMapping[];
    ContentSilos?: DTCContentSilo[];
    DisplayName: string;
    IsActive: boolean;
    Links?: DTCLink[];
    Qualifiers?: any[];
}

// DTC Response (matches MOTOR API structure)
export interface DTCResponse {
    baseVehicleId?: number;
    applications?: DTCApplication[];
    totalCount?: number;
    // Legacy support
    codes?: DTCCode[];
}

// Service Procedure Types
export interface ServiceProcedure {
    id: number;
    title: string;
    description: string;
    systemName?: string;
    componentName?: string;
    steps?: ServiceStep[];
    specifications?: Specification[];
    warnings?: string[];
    notes?: string[];
}

export interface ServiceStep {
    stepNumber: number;
    instruction: string;
    imageUrl?: string;
}

export interface Specification {
    name: string;
    value: string;
    unit?: string;
}

export interface ServiceProcedureResponse {
    baseVehicleId: number;
    procedures: ServiceProcedure[];
    totalCount: number;
}

// Parts Types
export interface Part {
    partNumber: string;
    description: string;
    partType?: string;
    manufacturer?: string;
    oemPartNumber?: string;
    interchangePartNumbers?: string[];
    position?: string;
    quantity?: number;
    specifications?: Specification[];
}

export interface PartsResponse {
    baseVehicleId: number;
    parts: Part[];
    totalCount: number;
}

// Recommended Fluids Types
export interface RecommendedFluid {
    positionId?: number;
    positionPCDBId?: number;
    positionDescription?: string;
    positionType?: string;
    fluidType: string;
    displayName?: string;
    isActive?: boolean;
    attributes?: Record<string, any>;
    specification?: string;
    capacity?: string;
    links?: FluidLink[];
    qualifiers?: FluidQualifier[];
    taxonomy?: FluidTaxonomy;
}

export interface FluidLink {
    href?: string;
    rel?: string;
    count?: number;
}

export interface FluidQualifier {
    qualifierId: number;
    description: string;
    family?: string;
    type?: string;
    isActive: boolean;
    sequence?: number;
}

export interface FluidTaxonomy {
    action?: string;
    commonName?: string;
    literalName?: string;
    systemName?: string;
    groupName?: string;
    groupId?: number;
    subGroupName?: string;
    subGroupId?: number;
    systemId?: number;
    taxonomyId?: number;
    infoObject?: {
        description?: string;
        infoObjectId?: number;
    };
    replacementTaxonomy?: any;
}

export interface RecommendedFluidsResponse {
    baseVehicleId: number;
    engineId?: number;
    submodelId?: number;
    applications: RecommendedFluid[];
    totalCount: number;
}

// Maintenance Schedule Types
export interface MaintenanceItem {
    serviceType: string;
    description: string;
    intervalMiles?: number;
    intervalMonths?: number;
    laborHours?: number;
    parts?: Part[];
    priority?: 'Critical' | 'Important' | 'Recommended';
}

export interface MaintenanceScheduleResponse {
    baseVehicleId: number;
    items: MaintenanceItem[];
    totalCount: number;
}

// Specifications Types
export interface VehicleSpecification {
    category: string;
    name: string;
    value: string;
    unit?: string;
}

export interface SpecificationsResponse {
    baseVehicleId: number;
    specifications: VehicleSpecification[];
    fluidCapacities?: FluidCapacity[];
    totalCount: number;
}

export interface FluidCapacity {
    fluidType: string;
    capacity: string;
    unit: string;
    specification?: string;
}

// Work Time Types
export interface WorkTime {
    operationDescription: string;
    laborHours: number;
    skillLevel?: string;
    operationCode?: string;
}

export interface WorkTimeResponse {
    baseVehicleId: number;
    workTimes: WorkTime[];
    totalCount: number;
}

// TSB Types
export interface TechnicalServiceBulletin {
    bulletinNumber: string;
    title: string;
    description: string;
    issueDate?: string;
    system?: string;
    component?: string;
    affectedVehicles?: string;
    summary?: string;
}

export interface TSBResponse {
    baseVehicleId: number;
    bulletins: TechnicalServiceBulletin[];
    totalCount: number;
}

// Wiring Diagram Types
export interface WiringDiagram {
    id: number;
    title: string;
    description?: string;
    systemName?: string;
    componentName?: string;
    diagramUrl?: string;
    thumbnailUrl?: string;
    saeSystemId?: number;
    saeSubjectId?: number;
}

export interface WiringDiagramResponse {
    baseVehicleId: number;
    diagrams: WiringDiagram[];
    totalCount: number;
}

// Bulk Vehicle Attributes Types
export interface VehicleAttributes {
    baseVehicleId: number;
    year: number;
    makeName: string;
    modelName: string;
    axles?: Array<{
        axleId: number;
        axleName: string;
    }>;
    bedTypes?: Array<{
        bedTypeId: number;
        bedTypeName: string;
    }>;
    bodyStyles?: Array<{
        bodyStyleId: number;
        bodyStyleName: string;
    }>;
    brakeTypes?: Array<{
        brakeTypeId: number;
        brakeTypeName: string;
    }>;
    cabTypes?: Array<{
        cabTypeId: number;
        cabTypeName: string;
    }>;
    driveTypes?: Array<{
        driveTypeId: number;
        driveTypeName: string;
    }>;
    engines?: Array<{
        engineId: number;
        blockType: string;
        cylinders: string;
        displacement: string;
        fuelType: string;
        engineVin?: string;
    }>;
    manufactureBodyCodes?: Array<{
        manufactureBodyCodeId: number;
        bodyCode: string;
    }>;
    springs?: Array<{
        springId: number;
        springName: string;
    }>;
    steerings?: Array<{
        steeringId: number;
        steeringName: string;
    }>;
    subModels?: Array<{
        subModelId: number;
        subModelName: string;
    }>;
    transmissions?: Array<{
        transmissionId: number;
        controlType: string;
        electronicControl?: string;
        manufacturerCode?: string;
        speed: string;
        type: string;
    }>;
    wheels?: Array<{
        wheelBaseId: number;
        wheelBase: string;
        wheelBaseMetric?: string;
    }>;
}

export interface BulkVehicleAttributesResponse {
    vehicles: VehicleAttributes[];
}

// Standard MOTOR API Response Wrapper
export interface MotorApiResponse<T> {
    Body: T;
    Header: {
        Date: string;
        Messages: Array<{
            Code: string;
            LongDescription: string;
            ShortDescription: string;
            Type: 'Debug' | 'Info' | 'Warning' | 'Error';
        }>;
        PagingInfo?: {
            EndIndex: number;
            ItemsPerPage: number;
            StartIndex: number;
            TotalItemCount: number;
        };
        RequestIdentifier?: {
            IdentifierType: string;
            Identifier: string;
            Package: string;
        };
        Status: string;
        StatusCode: number;
    };
}

// Error Types
export interface MotorDaasError {
    message: string;
    statusCode?: number;
    errorCode?: string;
    details?: unknown;
}

// Rate Limit Types
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    resetTime: number;
}

// Cache Types
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export interface CacheConfig {
    defaultTTL: number; // seconds
    maxSize: number; // number of entries
}