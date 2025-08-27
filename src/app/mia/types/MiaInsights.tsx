// Basic priority and type enums
export type InsightPriority = 'high' | 'medium' | 'low';
export type FlagType = 'warning' | 'urgent' | 'info';
export type UpsellCategory = 'immediate' | 'preventive' | 'safety' | 'seasonal';
export type FlagCategory = 'safety' | 'maintenance' | 'cost' | 'timing';

export interface UpsellSuggestion {
    title: string;
    description: string;
    estimatedValue: number;
    priority: InsightPriority;
    category: UpsellCategory;
}

export interface InsightFlag {
    type: FlagType;
    message: string;
    category: FlagCategory;
}

export interface WorkOrderAnalysis {
    current_work_assessment: string;
    related_systems: string[];
    mileage_considerations: string;
    timing_recommendations: string;
}

export interface ImmediateInsights {
    upsell_suggestions: UpsellSuggestion[];
    flags: InsightFlag[];
    work_order_analysis: WorkOrderAnalysis;
    summary: string;
}

// Long-term insight types
export interface FutureService {
    title: string;
    description: string;
    estimatedValue: number;
    recommendedDate: string;
    priority: InsightPriority;
}

export interface LongTermInsights {
    future_services: FutureService[];
    flags?: InsightFlag[];
    summary: string;
}

// Response types
export interface InsightsResponse {
    success: boolean;
    insights?: ImmediateInsights | LongTermInsights;
    error?: string;
}
