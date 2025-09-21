// MIA Insights Types
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

export interface MiaCustomerInsight {
    id: string;
    customer_id?: string;
    vehicle_id?: string;
    shop_id: string;
    repair_order_id?: string;
    work_order_id?: string;
    analysis: ImmediateInsights;
    summary?: string;
    created_at: string;
    updated_at: string;
    timeframe?: string;
    priority?: string;
    status?: string;
    recommended_follow_up_date?: string;
    estimated_value?: number;
    confidence_score?: number;
}

export interface InsightsResponse {
    success: boolean;
    insights?: ImmediateInsights;
    error?: string;
}
