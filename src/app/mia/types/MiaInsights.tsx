// Basic priority and type enums
export type InsightPriority = 'high' | 'medium' | 'low';
export type FlagType = 'warning' | 'urgent' | 'info';

// Immediate insight types
export interface UpsellSuggestion {
    title: string;
    description: string;
    estimatedValue: number;
    priority: InsightPriority;
}

export interface InsightFlag {
    type: FlagType;
    message: string;
}

export interface ImmediateInsights {
    upsell_suggestions: UpsellSuggestion[];
    flags: InsightFlag[];
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
