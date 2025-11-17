// src/app/(features)/ai/AIDiagnostics/types/diagnostics.ts

import { VehicleContext } from '../lib/context-builder';
import { CostEstimate } from '../lib/cost-calculator';

export interface DiagnosticMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

export interface DiagnosticSession {
    id: string;
    vehicleId: number | null;
    messages: DiagnosticMessage[];
    context?: VehicleContext;
    createdAt: Date;
    updatedAt: Date;
}

export interface DTCLookupRequest {
    baseVehicleId: number;
    code?: string;
}

export interface CostEstimateRequest {
    baseVehicleId: number;
    operation: string;
    parts?: Array<{
        partNumber: string;
        description: string;
        quantity: number;
        unitPrice?: number;
    }>;
    laborHoursOverride?: number;
}

export interface VehicleContextRequest {
    vehicleId: number;
}

export interface DiagnosticRecommendation {
    id: string;
    title: string;
    description: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    estimatedCost?: CostEstimate;
    relatedDTCs?: string[];
    relatedTSBs?: string[];
    recommendedActions: string[];
}

export interface DiagnosticReport {
    vehicleInfo: {
        vin: string;
        year: number;
        make: string;
        model: string;
        mileage?: number;
    };
    symptoms: string[];
    dtcCodes: string[];
    recommendations: DiagnosticRecommendation[];
    totalEstimatedCost?: {
        min: number;
        max: number;
    };
    generatedAt: Date;
    generatedBy: string;
}

export interface ToolCallResult {
    success: boolean;
    data?: unknown;
    error?: string;
    message: string;
}

export interface DiagnosticAPIRequest {
    messages: DiagnosticMessage[];
    selectedVehicleId?: number | null;
}

export interface DiagnosticAPIError {
    error: string;
    statusCode?: number;
    details?: unknown;
}